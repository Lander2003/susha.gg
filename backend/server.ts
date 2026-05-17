import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { log } from "node:console";

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const riotKey = process.env.RIOT_API_KEY;

app.use(cors());
app.use(express.json());

app.get("/getPlayer", async (req, res) => {
  const gameId = String(req.query.gameid || "");

  const [gameName, gameTag] = gameId.split("#");

  const region = String(req.query.region);
  console.log(gameId, gameName, gameTag, region);

  
  const routingMap: Record<string, string> = {
    NA: "americas",
    BR: "americas",
    OCE: "americas",
    EUNE: "europe",
    EUW: "europe",
    KR: "asia",
  };

  const routingRegion = routingMap[region];

  if(!routingRegion){
    return res.status(400).json({ error: "Invalid region" });
  }

  const url = `https://${routingRegion}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${gameTag}`;
  console.log(url);
  const riotResponse = await fetch(url, {
    headers: {
      "X-Riot-Token": riotKey!
    }
  })

 if(riotResponse.status != 200){
    return res.json({ error: "Invalid" });
  }

  const data = await riotResponse.json();


  const puuid = data.puuid;
  // console.log(puuid)
                                                                               
  const matchResponse = await fetch(`https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=10`, {
    headers: {
      "X-Riot-Token": riotKey!
    }
  });

  const matchIds = await matchResponse.json();
console.log(matchResponse);
  console.log(matchIds);

  const simplifiedMatches = [];

for (let i = 0; i < matchIds.length; i++) {
  const matchId = matchIds[i];

  const singleMatchResponse = await fetch(
    `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
    {
      headers: {
        "X-Riot-Token": riotKey!,
      },
    }
  );

  const singleMatch = await singleMatchResponse.json();

  const searchedPlayer = singleMatch.info.participants.find(
    (participant: any) => participant.puuid === puuid
  );

  const simplifiedMatch = {
    matchId: singleMatch.metadata.matchId,
    champion: searchedPlayer.championName,
    kills: searchedPlayer.kills,
    deaths: searchedPlayer.deaths,
    assists: searchedPlayer.assists,
    win: searchedPlayer.win,
    role: searchedPlayer.teamPosition,
    cs: searchedPlayer.totalMinionsKilled + searchedPlayer.neutralMinionsKilled,
    duration: singleMatch.info.gameDuration,
    queueId: singleMatch.info.queueId,
  };

  simplifiedMatches.push(simplifiedMatch);
}

  res.json({
  gameName,
  gameTag,
  region,
  matchIds,
  simplifiedMatches
});
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});