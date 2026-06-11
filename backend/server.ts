import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

import { getSimplifiedMatches } from "./getSimplifiedMatches.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const RIOT_API_KEY = process.env.RIOT_API_KEY;

const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
});

app.use(helmet());
app.use(globalLimiter);
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);
app.use(express.json());
const getPlayerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    error: "Too many searches. Please try again later.",
  },
});

type Region = "NA" | "BR" | "OCE" | "EUNE" | "EUW" | "KR";

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

function isRegion(value: string): value is Region {
  return value in routingMap;
}

async function riotFetch(url: string) {
  const response = await fetch(url, {
    headers: {
      "X-Riot-Token": RIOT_API_KEY!,
    },
  });

  if (!response.ok) {
    const error: any = new Error(
      `Riot API responded with ${response.status}`
    );

    error.status = response.status;

    throw error;
  }

  return response.json();
}

app.get("/getPlayer", getPlayerLimiter, async (req, res) => {

  try {
    const gameId = String(req.query.gameid || "");
    const region = String(req.query.region || "").toUpperCase();

    if (gameId.length < 3 || gameId.length > 30) {
      return res.status(400).json({
      error: "Invalid Riot ID",
      });
    }

    if (!gameId.includes("#")) {
     return res.status(400).json({
     error: "Invalid Riot ID format",
     });
    }

    const [gameName, gameTag] = gameId.split("#");

    if (!gameName || !gameTag) {
      return res.status(400).json({
        error: "Invalid Riot ID. Use format: Name#Tag",
      });
    }

    if (!isRegion(region)) {
      return res.status(400).json({
        error: "Invalid region",
      });
    }

    const routingRegion = routingMap[region];
    const platformRegion = platformMap[region];

    const encodedGameName = encodeURIComponent(gameName);
    const encodedGameTag = encodeURIComponent(gameTag);

    // 1. Get account data from Riot ID
    const accountData = await riotFetch(
      `https://${routingRegion}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodedGameName}/${encodedGameTag}`
    );

    const puuid = accountData.puuid;

    let rankedSolo = null;

try {
  const rankedData = await riotFetch(
    `https://${platformRegion}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`
  );

  const soloQueue = rankedData.find(
    (queue: any) => queue.queueType === "RANKED_SOLO_5x5"
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
} catch (error) {
  console.log("Could not fetch ranked solo data:", error);
}



    // 2. Get recent match IDs
    // 2. Get recent matches
const start = 0;
const count = 5;

const { matchIds, simplifiedMatches } =
  await getSimplifiedMatches({
    puuid,
    routingRegion,
    start,
    count,
    riotFetch,
  });

console.log("Request Sent!");

return res.json({
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
});
  } catch (error: any) {
    if (error.status === 404) {
      return res.status(404).json({
        error: "No matches found",
      });
    }

    return res.status(500).json({
      error: "Something went wrong while fetching matches",
    });
  }
});

app.get("/getMatches", getPlayerLimiter, async (req, res) => {
  try {
    const puuid = String(req.query.puuid || "").trim();
    const region = String(req.query.region || "").toUpperCase();

    const requestedStart = Number(req.query.start);
    const requestedCount = Number(req.query.count);

    const start =
      Number.isInteger(requestedStart) && requestedStart >= 0
        ? requestedStart
        : 0;

    const count =
      Number.isInteger(requestedCount) && requestedCount >= 1
        ? Math.min(requestedCount, 10)
        : 5;

    if (!puuid || puuid.length > 100) {
      return res.status(400).json({
        error: "Invalid player identifier",
      });
    }

    if (!isRegion(region)) {
      return res.status(400).json({
        error: "Invalid region",
      });
    }

    const routingRegion = routingMap[region];

    const { matchIds, simplifiedMatches } =
      await getSimplifiedMatches({
        puuid,
        routingRegion,
        start,
        count,
        riotFetch,
      });
    console.log("getMatches Accessed!");
    return res.json({
      simplifiedMatches,
      pagination: {
        start,
        count,
        nextStart: start + matchIds.length,
        hasMore: matchIds.length === count,
      },
    });
  } catch (error: any) {
    if (error.status === 404) {
      return res.status(404).json({
        error: "No matches found",
      });
    }

    return res.status(500).json({
      error: "Something went wrong while fetching matches",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});