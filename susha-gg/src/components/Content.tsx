import type { PlayerData } from "../App";
import { useState } from "react";
import RankedSoloCard from "./RankedSoloCard";

type ContentProps = {
  playerData: PlayerData | null;
  // errorMessage: string;
};

export default function Content({ playerData }: ContentProps) {

  const [openMatchId, setOpenMatchId] = useState<string | null>(null);

  if (!playerData) {
    return null;
  }
  return (
    <div className="content-container">
      <div className="player-info">
        <h1>{playerData.gameName}</h1>

        <RankedSoloCard rankedSolo={playerData.rankedSolo}/>
      </div>
      <div className="player-matches">
        {playerData.simplifiedMatches.map((match) => {
  const searchedPlayer = match.searchedPlayer;

  const imageLink = `https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/${searchedPlayer.champion}.png`;

  const color = searchedPlayer.win ? "#6dd57b" : "#ff9494";

  const isOpen = openMatchId === match.matchId;
  const blueTeam = match.players.filter((player) => player.teamId === 100); 
  const redTeam = match.players.filter((player) => player.teamId === 200);
  const blueTeamWon = blueTeam[0]?.win;
  const redTeamWon = redTeam[0]?.win;

  return (
    <div className="match-card-header">
    <div
      className="match-card"
      key={match.matchId}
      style={{ backgroundColor: color }}
    >
      <img src={imageLink} alt={searchedPlayer.champion} />

      <div>
        <h2>{searchedPlayer.champion}</h2>
      </div>

      <ul
        style={
          searchedPlayer.win
            ? { backgroundColor: "#4ba657" }
            : { backgroundColor: "rgb(148, 82, 82)" }
        }
      >
        <li>
          KDA: {searchedPlayer.kills}/{searchedPlayer.deaths}/
          {searchedPlayer.assists}
        </li>
        <li>Role: {searchedPlayer.role}</li>
        <li>Game duration: {Math.floor(match.duration / 60)} minutes</li>
        <li>CS: {searchedPlayer.cs}</li>
        <li>{searchedPlayer.win ? "Victory" : "Defeat"}</li>
      </ul>

      <button
    className="btn-show"
  type="button"
  onClick={() => setOpenMatchId(isOpen ? null : match.matchId)}
>
  {isOpen ? "Hide players" : "Show players"}
</button>
</div>

{isOpen && (
  <div className="match-players"
          style={{ backgroundColor: color }}
    >
    <div className="team-section">
      <h3>
  Blue Team - {blueTeamWon ? "Victory" : "Defeat"}
</h3>

      {blueTeam.map((player) => (
        <div className="match-player" key={player.puuid}>
          <span>
            {player.gameName}#{player.gameTag}
          </span>
          <span>{player.champion}</span>
          <span>
            KDA: {player.kills}/{player.deaths}/{player.assists}
          </span>
          <span>CS: {player.cs}</span>
        </div>
      ))}
    </div>

    <div className="team-section">
      <h3>
         Red Team - {redTeamWon ? "Victory" : "Defeat"}
     </h3>

      {redTeam.map((player) => (
        <div className="match-player" key={player.puuid}>
          <span className="player-name">
            {player.gameName}#{player.gameTag}
          </span>
          <span className="player-champ">{player.champion}</span>
          <span>
            KDA: {player.kills}/{player.deaths}/{player.assists}
          </span>
          <span>CS: {player.cs}</span>
        </div>
      ))}
    </div>
  </div>
)}
    </div>
  );
})}
      </div>
    </div>
  )

}