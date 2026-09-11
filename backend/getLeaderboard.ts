import { getFromCache, setCache } from "./cache.js";
import type { LeaderboardPlayer } from "./apiTypes.js";
import type { RiotOperation } from "./errors.js";
import { parseRiotPayload, riotLeaderboardSchema } from "./schemas.js";

type RiotFetch = (url: string, operation: RiotOperation) => Promise<unknown>;

type GetLeaderboardParams = {
  platformRegion: string;
  start: number;
  count: number;
  riotFetch: RiotFetch;
};

type CachedLeaderboard = {
  tier: string;
  queue: string;
  totalPlayers: number;
  players: LeaderboardPlayer[];
};

const LEADERBOARD_CACHE_TTL_MS = 5 * 60 * 1000;

export async function getLeaderboard({
  platformRegion,
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
      (player, index): LeaderboardPlayer => {
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

  return {
    tier: fullLeaderboard.tier,
    queue: fullLeaderboard.queue,
    totalPlayers: fullLeaderboard.totalPlayers,
    players: paginatedPlayers,
  };
}
