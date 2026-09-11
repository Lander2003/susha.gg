import express, { type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

import type {
  LeaderboardResponse,
  MatchesResponse,
  PlayerResponse,
} from "./apiTypes.js";
import {
  RiotApiError,
  RiotNetworkError,
  RiotPayloadError,
  type RiotOperation,
} from "./errors.js";
import { getSimplifiedMatches } from "./getSimplifiedMatches.js";
import { getLeaderboard } from "./getLeaderboard.js";
import {
  leaderboardQuerySchema,
  matchesQuerySchema,
  parseRiotPayload,
  playerQuerySchema,
  riotAccountSchema,
  riotLeagueEntriesSchema,
  type Region,
} from "./schemas.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const RIOT_API_KEY = process.env.RIOT_API_KEY ?? "";

if (!RIOT_API_KEY) {
  throw new Error("RIOT_API_KEY environment variable is required");
}

const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
});

const allowedOrigins = [
  "http://localhost:5173",
  "https://susha-gg.vercel.app",
];

app.use(helmet());
app.use(globalLimiter);
app.use(
  cors({
    origin: allowedOrigins,
  })
);
app.use(express.json({ limit: "10kb" }));
const getPlayerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    error: "Too many player searches. Please try again later.",
  },
});

const getMatchesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: {
    error: "Too many match requests. Please try again later.",
  },
});

const leaderboardLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  message: {
    error: "Too many leaderboard requests. Please try again later.",
  },
});
const routingMap: Record<Region, string> = {
  NA: "americas",
  BR: "americas",
  OCE: "americas",
  EUNE: "europe",
  EUW: "europe",
  KR: "asia",
};

const platformMap: Record<Region, string> = {
  NA: "na1",
  BR: "br1",
  OCE: "oc1",
  EUNE: "eun1",
  EUW: "euw1",
  KR: "kr",
};

async function riotFetch(
  url: string,
  operation: RiotOperation
): Promise<unknown> {
  let response: globalThis.Response;

  try {
    response = await fetch(url, {
      headers: {
        "X-Riot-Token": RIOT_API_KEY,
      },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    throw new RiotNetworkError(operation, { cause: error });
  }

  if (!response.ok) {
    throw new RiotApiError(
      response.status,
      operation,
      response.headers.get("retry-after")
    );
  }

  try {
    return await response.json();
  } catch (error) {
    throw new RiotPayloadError(
      operation,
      error instanceof Error ? error.message : "Response was not valid JSON"
    );
  }
}

function sendRouteError(res: Response, error: unknown) {
  if (error instanceof RiotApiError) {
    if (error.status === 404) {
      const messageByOperation: Partial<Record<RiotOperation, string>> = {
        account: "Player not found",
        ranked: "Ranked data not found",
        "match-list": "Match history not found",
        "match-detail": "Match data not found",
        leaderboard: "Leaderboard not found",
      };

      return res.status(404).json({
        error: messageByOperation[error.operation] ?? "Riot resource not found",
      });
    }

    if (error.status === 429) {
      if (error.retryAfter) {
        res.setHeader("Retry-After", error.retryAfter);
      }

      return res.status(429).json({
        error: "Riot API rate limit reached. Please try again later.",
      });
    }

    console.error(error.message);

    if (error.status === 401 || error.status === 403) {
      return res.status(502).json({
        error: "The Riot API credentials are unavailable or invalid",
      });
    }

    return res.status(502).json({
      error: "Riot API request failed",
    });
  }

  if (error instanceof RiotPayloadError) {
    console.error(error.message);
    return res.status(502).json({
      error: "Riot API returned an unexpected response",
    });
  }

  if (error instanceof RiotNetworkError) {
    console.error(error.message, error.cause);
    return res.status(502).json({
      error: "Could not reach the Riot API",
    });
  }

  console.error("Unexpected server error:", error);
  return res.status(500).json({ error: "Unexpected server error" });
}

function sendInvalidQuery(res: Response, issues: { message: string }[]) {
  return res.status(400).json({
    error: issues[0]?.message ?? "Invalid query parameters",
  });
}

app.get("/getPlayer", getPlayerLimiter, async (req, res) => {
  try {
    const queryResult = playerQuerySchema.safeParse(req.query);

    if (!queryResult.success) {
      return sendInvalidQuery(res, queryResult.error.issues);
    }

    const { gameid: riotId, region } = queryResult.data;
    const { gameName, gameTag } = riotId;

    const routingRegion = routingMap[region];
    const platformRegion = platformMap[region];

    const encodedGameName = encodeURIComponent(gameName);
    const encodedGameTag = encodeURIComponent(gameTag);

    const accountData = parseRiotPayload(
      riotAccountSchema,
      await riotFetch(
        `https://${routingRegion}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodedGameName}/${encodedGameTag}`,
        "account"
      ),
      "account"
    );

    const puuid = accountData.puuid;

    let rankedSolo = null;

    const rankedData = parseRiotPayload(
      riotLeagueEntriesSchema,
      await riotFetch(
        `https://${platformRegion}.api.riotgames.com/lol/league/v4/entries/by-puuid/${encodeURIComponent(
          puuid
        )}`,
        "ranked"
      ),
      "ranked"
    );

    const soloQueue = rankedData.find(
      (queue) => queue.queueType === "RANKED_SOLO_5x5"
    );

    rankedSolo = soloQueue
      ? {
          tier: soloQueue.tier,
          rank: soloQueue.rank,
          lp: soloQueue.leaguePoints,
          wins: soloQueue.wins,
          losses: soloQueue.losses,
          totalGames: soloQueue.wins + soloQueue.losses,
        }
      : null;

    const start = 0;
    const count = 5;

    const { matchIds, simplifiedMatches } = await getSimplifiedMatches({
      puuid,
      routingRegion,
      start,
      count,
      riotFetch,
    });

    const responseBody: PlayerResponse = {
      puuid,
      gameName,
      gameTag,
      region,
      rankedSolo,
      simplifiedMatches,
      pagination: {
        start,
        count,
        nextStart: start + matchIds.length,
        hasMore: matchIds.length === count,
      },
    };

    return res.json(responseBody);
  } catch (error: unknown) {
    return sendRouteError(res, error);
  }
});

app.get("/getMatches", getMatchesLimiter, async (req, res) => {
  try {
    const queryResult = matchesQuerySchema.safeParse(req.query);

    if (!queryResult.success) {
      return sendInvalidQuery(res, queryResult.error.issues);
    }

    const { puuid, region, start, count } = queryResult.data;

    const routingRegion = routingMap[region];

    const { matchIds, simplifiedMatches } = await getSimplifiedMatches({
      puuid,
      routingRegion,
      start,
      count,
      riotFetch,
    });

    const responseBody: MatchesResponse = {
      simplifiedMatches,
      pagination: {
        start,
        count,
        nextStart: start + matchIds.length,
        hasMore: matchIds.length === count,
      },
    };

    return res.json(responseBody);
  } catch (error: unknown) {
    return sendRouteError(res, error);
  }
});

app.get("/leaderboard", leaderboardLimiter, async (req, res) => {
  try {
    const queryResult = leaderboardQuerySchema.safeParse(req.query);

    if (!queryResult.success) {
      return sendInvalidQuery(res, queryResult.error.issues);
    }

    const { region, start, count } = queryResult.data;

    const platformRegion = platformMap[region];
    const leaderboard = await getLeaderboard({
      platformRegion,
      start,
      count,
      riotFetch,
    });

    const responseBody: LeaderboardResponse = {
      region,
      ...leaderboard,
      pagination: {
        start,
        count,
        nextStart: start + leaderboard.players.length,
        hasMore:
          start + leaderboard.players.length <
          leaderboard.totalPlayers,
      },
    };

    return res.json(responseBody);
  } catch (error: unknown) {
    return sendRouteError(res, error);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
