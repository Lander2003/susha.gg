import type { PlayerData } from "../App";
import RankedSoloCard from "./RankedSoloCard";

type ContentProps = {
  playerData: PlayerData | null;
};

export default function Content ({ playerData }: ContentProps) {

  if(!playerData){
    return <h1>Search for a player</h1>
  } 

return (
  // <div className="content-container"></div>
  <div  className="content-container">
  <h1>Viewing: {playerData.gameName}</h1>

  <RankedSoloCard rankedSolo={playerData.rankedSolo} />

{playerData.simplifiedMatches.map((match) => {
  const imageLink = `https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/${match.champion}.png`

  const color = match.win ? "#6dd57b" : "#ff9494"
return (
  <div className="match-card" key={match.matchId} 
    style={{
      backgroundColor: color
    }}
  >
    <img src={imageLink} alt="" />
    <div>
    <h2>{match.champion}</h2>
    </div>
    <ul>
      <li>KDA: {match.kills}/{match.deaths}/{match.assists}</li>
      <li>Role: {match.role}</li>
      <li>Game duration: {Math.floor(match.duration / 60)} minutes</li>
      <li>CS: {match.cs}</li>
      <li>{match.win ? "Victory" : "Defeat"}</li>
    </ul>
  </div>
)
})}

</div>
)

}