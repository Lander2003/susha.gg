import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const RIOT_API_KEY = process.env.RIOT_API_KEY;

app.use(cors());
app.use(express.json());

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
      "X-Riot-Token": process.env.RIOT_API_KEY!,
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

app.get("/getPlayer", async (req, res) => {

  try {
    const gameId = String(req.query.gameid || "");
    const region = String(req.query.region || "").toUpperCase();

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
    const matchIds = await riotFetch(
      `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=10`
    );

   const simplifiedMatches = await Promise.all(
  matchIds.map(async (matchId: string) => {
    const singleMatch = await riotFetch(
      `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/${matchId}`
    );

    const searchedPlayer = singleMatch.info.participants.find(
      (participant: any) => participant.puuid === puuid
    );

    if (!searchedPlayer) return null;

    return {
      matchId: singleMatch.metadata.matchId,
      duration: singleMatch.info.gameDuration,
      queueId: singleMatch.info.queueId,

      searchedPlayer: {
        puuid: searchedPlayer.puuid,
        champion: searchedPlayer.championName,
        kills: searchedPlayer.kills,
        deaths: searchedPlayer.deaths,
        assists: searchedPlayer.assists,
        win: searchedPlayer.win,
        role: searchedPlayer.teamPosition,
        cs:
          searchedPlayer.totalMinionsKilled +
          searchedPlayer.neutralMinionsKilled,
      },

      players: singleMatch.info.participants.map((participant: any) => ({
        puuid: participant.puuid,
        gameName: participant.riotIdGameName,
        gameTag: participant.riotIdTagline,
        champion: participant.championName,
        kills: participant.kills,
        deaths: participant.deaths,
        assists: participant.assists,
        win: participant.win,
        role: participant.teamPosition,
        teamId: participant.teamId,
        cs:
          participant.totalMinionsKilled +
          participant.neutralMinionsKilled,
      })),
    };
  })
);
   console.log(simplifiedMatches);
    res.json({
      gameName,
      gameTag,
      region,
      rankedSolo,
      matchIds,
      simplifiedMatches,
    });
  } catch (error: any) {
    if(error.status == 404){
      return res.status(404).json({
      error: "Results not found for this player",
    });
     }else {
     return res.status(500).json({
      error: "Something went wrong while fetching player data",
    });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});