import { getFromCache, setCache } from "./cache.js";
import type { LeaderboardPlayer } from "./apiTypes.js";
import { RiotApiError, type RiotOperation } from "./errors.js";
import {
  parseRiotPayload,
  riotAccountIdentitySchema,
  riotLeaderboardSchema,
} from "./schemas.js";

type RiotFetch = (url: string, operation: RiotOperation) => Promise<unknown>;

type GetLeaderboardParams = {
  platformRegion: string;
  routingRegion: string;
  start: number;
  count: number;
  riotFetch: RiotFetch;
};

type RankedLeaderboardPlayer = Omit<
  LeaderboardPlayer,
  "gameName" | "gameTag"
>;

type CachedLeaderboard = {
  tier: string;
  queue: string;
  totalPlayers: number;
  players: RankedLeaderboardPlayer[];
};

type PlayerIdentity = {
  gameName: string;
  gameTag: string;
};

const LEADERBOARD_CACHE_TTL_MS = 5 * 60 * 1000;
const ACCOUNT_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const ACCOUNT_LOOKUP_CONCURRENCY = 4;
const ACCOUNT_LOOKUP_MIN_INTERVAL_MS = 75;

const pendingIdentityLookups = new Map<
  string,
  Promise<PlayerIdentity | null>
>();
const identityLookupPausedUntil = new Map<string, number>();
const nextIdentityLookupAt = new Map<string, number>();
const identityLookupQueue: Array<() => void> = [];
let activeIdentityLookups = 0;

export async function getLeaderboard({
  platformRegion,
  routingRegion,
  start,
  count,
  riotFetch,
}: GetLeaderboardParams) {
  const cacheKey = `leaderboard:${platformRegion}:RANKED_SOLO_5x5`;

  let fullLeaderboard =
    getFromCache<CachedLeaderboard>(cacheKey);

  if (!fullLeaderboard) {
    const leaderboardData = parseRiotPayload(
      riotLeaderboardSchema,
      await riotFetch(
        `https://${platformRegion}.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5`,
        "leaderboard"
      ),
      "leaderboard"
    );

    const sortedEntries = leaderboardData.entries.sort(
      (a, b) => b.leaguePoints - a.leaguePoints
    );

    const players = sortedEntries.map(
      (player, index): RankedLeaderboardPlayer => {
        const totalGames = player.wins + player.losses;

        const winRate =
          totalGames > 0
            ? Math.round((player.wins / totalGames) * 100)
            : 0;

        return {
          position: index + 1,
          puuid: player.puuid,
          rank: leaderboardData.tier,
          lp: player.leaguePoints,
          wins: player.wins,
          losses: player.losses,
          totalGames,
          winRate,
        };
      }
    );

    fullLeaderboard = {
      tier: leaderboardData.tier,
      queue: leaderboardData.queue,
      totalPlayers: players.length,
      players,
    };

    setCache(
      cacheKey,
      fullLeaderboard,
      LEADERBOARD_CACHE_TTL_MS
    );
  }

  const paginatedPlayers = fullLeaderboard.players.slice(
    start,
    start + count
  );

  const players = await addPlayerIdentities(
    paginatedPlayers,
    routingRegion,
    riotFetch
  );

  return {
    tier: fullLeaderboard.tier,
    queue: fullLeaderboard.queue,
    totalPlayers: fullLeaderboard.totalPlayers,
    players,
  };
}

async function addPlayerIdentities(
  players: RankedLeaderboardPlayer[],
  routingRegion: string,
  riotFetch: RiotFetch
): Promise<LeaderboardPlayer[]> {
  return Promise.all(
    players.map(async (player) => {
      const identity = await getPlayerIdentity(
        player.puuid,
        routingRegion,
        riotFetch
      );

      return {
        ...player,
        gameName: identity?.gameName ?? null,
        gameTag: identity?.gameTag ?? null,
      };
    })
  );
}

async function getPlayerIdentity(
  puuid: string,
  routingRegion: string,
  riotFetch: RiotFetch
): Promise<PlayerIdentity | null> {
  const cacheKey = `account:${puuid}`;
  const cachedIdentity = getFromCache<PlayerIdentity>(cacheKey);

  if (cachedIdentity) {
    return cachedIdentity;
  }

  if ((identityLookupPausedUntil.get(routingRegion) ?? 0) > Date.now()) {
    return null;
  }

  const pendingLookup = pendingIdentityLookups.get(cacheKey);

  if (pendingLookup) {
    return pendingLookup;
  }

  const lookup = withIdentityLookupSlot(async () => {
    await waitForIdentityLookupBudget(routingRegion);

    if ((identityLookupPausedUntil.get(routingRegion) ?? 0) > Date.now()) {
      return null;
    }

    try {
      const account = parseRiotPayload(
        riotAccountIdentitySchema,
        await riotFetch(
          `https://${routingRegion}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${encodeURIComponent(
            puuid
          )}`,
          "account-name"
        ),
        "account-name"
      );

      const identity = {
        gameName: account.gameName,
        gameTag: account.tagLine,
      };

      setCache(cacheKey, identity, ACCOUNT_CACHE_TTL_MS);
      return identity;
    } catch (error) {
      let pauseMs: number | null = null;

      if (error instanceof RiotApiError) {
        const retryAfterSeconds = Number(error.retryAfter);

        if (error.status === 429) {
          pauseMs =
            Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
              ? retryAfterSeconds * 1000
              : 60_000;
        } else if (
          error.status === 401 ||
          error.status === 403 ||
          error.status >= 500
        ) {
          pauseMs = 60_000;
        }
      } else {
        pauseMs = 60_000;
      }

      if (pauseMs !== null) {
        identityLookupPausedUntil.set(
          routingRegion,
          Date.now() + pauseMs
        );
      }

      const reason =
        error instanceof Error ? error.message : "Unknown lookup error";
      console.warn(
        `Could not resolve Riot ID for leaderboard player ${puuid}: ${reason}`
      );
      return null;
    }
  }).finally(() => {
    pendingIdentityLookups.delete(cacheKey);
  });

  pendingIdentityLookups.set(cacheKey, lookup);
  return lookup;
}

function withIdentityLookupSlot<T>(operation: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    identityLookupQueue.push(() => {
      activeIdentityLookups += 1;

      void operation()
        .then(resolve, reject)
        .finally(() => {
          activeIdentityLookups -= 1;
          runNextIdentityLookups();
        });
    });

    runNextIdentityLookups();
  });
}

function runNextIdentityLookups() {
  while (
    activeIdentityLookups < ACCOUNT_LOOKUP_CONCURRENCY &&
    identityLookupQueue.length > 0
  ) {
    identityLookupQueue.shift()?.();
  }
}

async function waitForIdentityLookupBudget(routingRegion: string) {
  const now = Date.now();
  const scheduledAt = Math.max(
    now,
    nextIdentityLookupAt.get(routingRegion) ?? now
  );

  nextIdentityLookupAt.set(
    routingRegion,
    scheduledAt + ACCOUNT_LOOKUP_MIN_INTERVAL_MS
  );

  const waitMs = scheduledAt - now;

  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
}
