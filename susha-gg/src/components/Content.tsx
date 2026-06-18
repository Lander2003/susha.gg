import type { PlayerData } from "../App";
import { useState } from "react";
import RankedSoloCard from "./RankedSoloCard";
import { searchPlayerRequest } from "../api/searchPlayer";

type ContentProps = {
  playerData: PlayerData | null;
  updateData: (newData: PlayerData) => void;
  updateLoadingState: (loadingState: boolean) => void;
  // errorMessage: string;
};

export default function Content({ playerData, updateData, updateLoadingState }: ContentProps) {

  const [openMatchId, setOpenMatchId] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;
  async function searchMatchPlayer(
  gameName: string,
  gameTag: string
) {
  if (!playerData) return;
  updateLoadingState(true);
  try {
    const data = await searchPlayerRequest(
      gameName,
      gameTag,
      playerData.region
    );

    updateData(data);
    setOpenMatchId(null);
  } catch (error) {
    console.error(error);
  } finally {
    updateLoadingState(false);
  }
}

  async function loadMoreMatches() {
  if (!playerData || !playerData.pagination.hasMore || isLoadingMore) {
    return;
  }

  setIsLoadingMore(true);

  try {
    const parameters = new URLSearchParams({
  puuid: playerData.puuid,
  region: playerData.region,
  start: String(playerData.pagination.nextStart),
  count: "5",
});

const response = await fetch(
  `${API_URL}/getMatches?${parameters.toString()}`
);

    const data: PlayerData = await response.json();

    if (!response.ok) {
      throw new Error("Could not load more matches");
    }

    updateData({
      ...playerData,
      simplifiedMatches: [
        ...playerData.simplifiedMatches,
        ...data.simplifiedMatches,
      ],
      pagination: data.pagination,
    });
  } catch (error) {
    console.error(error);
  } finally {
    setIsLoadingMore(false);
  }
}

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

    const imageLink =
      `https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/${searchedPlayer.champion}.png`;

    const color = searchedPlayer.win ? "#6dd57b" : "#ff9494";

    const isOpen = openMatchId === match.matchId;
    const blueTeam = match.players.filter(
      (player) => player.teamId === 100
    );
    const redTeam = match.players.filter(
      (player) => player.teamId === 200
    );

    const blueTeamWon = blueTeam[0]?.win;
    const redTeamWon = redTeam[0]?.win;

    return (
      <div className="match-card-header" key={match.matchId}>
        <div
          className="match-card"
          style={{ backgroundColor: color }}
        >
          <img
            src={imageLink}
            alt={searchedPlayer.champion}
          />

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
            <li>
              Game duration: {Math.floor(match.duration / 60)} minutes
            </li>
            <li>CS: {searchedPlayer.cs}</li>
            <li>{searchedPlayer.win ? "Victory" : "Defeat"}</li>
          </ul>

          <button
            className="btn-show"
            type="button"
            onClick={() =>
              setOpenMatchId(isOpen ? null : match.matchId)
            }
          >
            {isOpen ? "Hide players" : "Show players"}
          </button>
        </div>

        {isOpen && (
          <div className="match-players">
            <div
              className="team-section"
              style={{
                backgroundColor: blueTeamWon
                  ? "#9dffaa"
                  : "#ffa5a5",
              }}
            >
              <h3>
                Blue Team - {blueTeamWon ? "Victory" : "Defeat"}
              </h3>

              {blueTeam.map((player) => {
                const champImageLink =
                  `https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/${player.champion}.png`;
                   const displayName = player.gameName ? (player.gameName.length > 12 ? player.gameName.slice(0, 12) + '...' : player.gameName) : "Guest";
                return (
                  <div className="match-player" key={player.puuid}>
                    <img
                      src={champImageLink}
                      alt={player.champion}
                    />

                    <button
  type="button"
  className="player-name"
  title={player.gameName + "#" + player.gameTag}
  onClick={() =>
    searchMatchPlayer(player.gameName, player.gameTag)
  }
>
  {displayName}
</button>

                    <span>
                      KDA: {player.kills}/{player.deaths}/
                      {player.assists}
                    </span>

                    <span>CS: {player.cs}</span>
                  </div>
                );
              })}
            </div>

            <div
              className="team-section"
              style={{
                backgroundColor: redTeamWon
                  ? "#9dffaa"
                  : "#ffa5a5",
              }}
            >
              <h3>
                Red Team - {redTeamWon ? "Victory" : "Defeat"}
              </h3>

              {redTeam.map((player) => {
                const champImageLink =
                  `https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/${player.champion}.png`;
                  const displayName = player.gameName ? (player.gameName.length > 12 ? player.gameName.slice(0, 12) + '...' : player.gameName) : "Guest";

                return (
                  <div className="match-player" key={player.puuid}>
                    <img
                      src={champImageLink}
                      alt={player.champion}
                    />

                    <button
  type="button"
  title={player.gameName + "#" + player.gameTag}
  className="player-name"
  onClick={() =>
    searchMatchPlayer(player.gameName, player.gameTag)
  }
>
  {displayName}
</button>

                    <span>
                      KDA: {player.kills}/{player.deaths}/
                      {player.assists}
                    </span>

                    <span>CS: {player.cs}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  })}

  {playerData.pagination.hasMore && (
    <button
      type="button"
      onClick={loadMoreMatches}
      disabled={isLoadingMore}
      className="load-button"
    >
      {isLoadingMore ? "Loading..." : "Load more"}
    </button>
  )}
</div>
    </div>
  )

}