import type { PlayerData } from "../api/contracts";
import { getMatchesRequest } from "../api/getMatches";
import { useState } from "react";
import RankedSoloCard from "./RankedSoloCard";

type ContentProps = {
  playerData: PlayerData | null;
  updateData: (newData: PlayerData) => void;
  searchPlayer: (
    gameName: string,
    gameTag: string,
    region: string
  ) => Promise<void>;
};

type MatchPlayer = PlayerData["simplifiedMatches"][number]["players"][number];

function getQueueLabel(queueId: number) {
  if (queueId === 420) return "Ranked Solo";
  if (queueId === 440) return "Ranked Flex";
  if (queueId === 450) return "ARAM";
  return `Queue ${queueId}`;
}

type TeamProps = {
  title: string;
  players: MatchPlayer[];
  won: boolean | undefined;
  onPlayerClick: (gameName: string, gameTag: string) => void;
};

function MatchTeam({ title, players, won, onPlayerClick }: TeamProps) {
  return (
    <section className={`team-section ${won ? "team-won" : "team-lost"}`}>
      <header className="team-heading">
        <h3>{title}</h3>
        <span>{won ? "Victory" : "Defeat"}</span>
      </header>

      {players.map((player) => {
        const championImage =
          `https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/${player.champion}.png`;
        const displayName = player.gameName
          ? player.gameName.length > 12
            ? `${player.gameName.slice(0, 12)}...`
            : player.gameName
          : "Guest";

        return (
          <div className="match-player" key={player.puuid}>
            <img src={championImage} alt={player.champion} />
            <button
              type="button"
              className="player-name"
              title={`${player.gameName}#${player.gameTag}`}
              onClick={() => onPlayerClick(player.gameName, player.gameTag)}
            >
              {displayName}
            </button>
            <span className="team-kda">
              {player.kills} / {player.deaths} / {player.assists}
            </span>
            <span className="team-cs">{player.cs} CS</span>
          </div>
        );
      })}
    </section>
  );
}

export default function Content({ playerData, updateData, searchPlayer }: ContentProps) {

  const [openMatchId, setOpenMatchId] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  async function searchMatchPlayer(
  gameName: string,
  gameTag: string
) {
  if (!playerData) return;
  setOpenMatchId(null);
  await searchPlayer(gameName, gameTag, playerData.region);
}

  async function loadMoreMatches() {
  if (!playerData || !playerData.pagination.hasMore || isLoadingMore) {
    return;
  }

  setIsLoadingMore(true);

  try {
    const data = await getMatchesRequest(
      playerData.puuid,
      playerData.region,
      playerData.pagination.nextStart
    );

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
        <div className="player-identity">
          <span className="section-label">Current player</span>
          <h1>{playerData.gameName}</h1>
          <p>
            #{playerData.gameTag}
            <span className="region-badge">{playerData.region}</span>
          </p>
        </div>

        <RankedSoloCard rankedSolo={playerData.rankedSolo}/>
      </div>
      <div className="player-matches">
        <div className="matches-heading">
          <div>
            <span className="section-label">Performance</span>
            <h2>Recent matches</h2>
          </div>
          <span>{playerData.simplifiedMatches.length} loaded</span>
        </div>
  {playerData.simplifiedMatches.map((match) => {
    const searchedPlayer = match.searchedPlayer;

    const imageLink =
      `https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/${searchedPlayer.champion}.png`;

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
      <article
        className={`match-card-header ${searchedPlayer.win ? "victory" : "defeat"}`}
        key={match.matchId}
      >
        <div className="match-card">
          <div className="champion-info">
            <img src={imageLink} alt={searchedPlayer.champion} />
            <div>
              <span className="match-result">
                {searchedPlayer.win ? "Victory" : "Defeat"}
              </span>
              <h3>{searchedPlayer.champion}</h3>
              <span className="queue-name">{getQueueLabel(match.queueId)}</span>
            </div>
          </div>

          <div className="kda-block">
            <strong>{searchedPlayer.kills} / {searchedPlayer.deaths} / {searchedPlayer.assists}</strong>
            <span>K / D / A</span>
          </div>

          <dl className="match-stats">
            <div><dt>Role</dt><dd>{searchedPlayer.role || "—"}</dd></div>
            <div><dt>CS</dt><dd>{searchedPlayer.cs}</dd></div>
            <div><dt>Duration</dt><dd>{Math.floor(match.duration / 60)}m</dd></div>
          </dl>

          <button
            className="btn-show"
            type="button"
            onClick={() =>
              setOpenMatchId(isOpen ? null : match.matchId)
            }
          >
            {isOpen ? "Hide players" : "Show players"}
            <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
          </button>
        </div>

        {isOpen && (
          <div className="match-players">
            <MatchTeam
              title="Blue Team"
              players={blueTeam}
              won={blueTeamWon}
              onPlayerClick={searchMatchPlayer}
            />
            <MatchTeam
              title="Red Team"
              players={redTeam}
              won={redTeamWon}
              onPlayerClick={searchMatchPlayer}
            />
          </div>
        )}
      </article>
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
