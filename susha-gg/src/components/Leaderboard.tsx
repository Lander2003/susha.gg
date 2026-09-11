import { useEffect, useState } from "react";
import {
  getLeaderboardRequest,
  type LeaderboardData,
} from "../api/getLeaderboard";

const regions = ["EUNE", "EUW", "KR", "NA", "BR", "OCE"];

type LeaderboardProps = {
  searchPlayer: (
    gameName: string,
    gameTag: string,
    region: string
  ) => Promise<void>;
};

export default function Leaderboard({ searchPlayer }: LeaderboardProps) {
  const [region, setRegion] = useState("EUW");
  const [leaderboard, setLeaderboard] =
    useState<LeaderboardData | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  async function fetchLeaderboard(selectedRegion: string) {
    setIsLoading(true);
    setError("");

    try {
      const data = await getLeaderboardRequest(
        selectedRegion,
        0,
        25
      );

      setLeaderboard(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while fetching leaderboard"
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function loadMorePlayers() {
    if (
      !leaderboard ||
      !leaderboard.pagination.hasMore ||
      isLoadingMore
    ) {
      return;
    }

    setIsLoadingMore(true);
    setError("");

    try {
      const data = await getLeaderboardRequest(
        region,
        leaderboard.pagination.nextStart,
        25
      );

      setLeaderboard({
        ...data,
        players: [...leaderboard.players, ...data.players],
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while loading more players"
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  useEffect(() => {
    const loadLeaderboard = async () => {
        await fetchLeaderboard(region);
    }
    loadLeaderboard();
  }, [region]);

  return (
    <main className="leaderboard-page">
      <section className="leaderboard-header">
        <div className="leaderboard-title">
          <span className="section-label">Ranked Solo/Duo</span>
          <h1>Challenger Leaderboard</h1>
          <p>View the highest ranked solo queue players by region.</p>
        </div>

        <div className="leaderboard-regions">
          {regions.map((serverRegion) => (
            <button
              key={serverRegion}
              type="button"
              onClick={() => setRegion(serverRegion)}
              className={
                region === serverRegion
                  ? "region-button active"
                  : "region-button"
              }
            >
              {serverRegion}
            </button>
          ))}
        </div>

        {error && <span className="error-message">{error}</span>}
      </section>


      {isLoading && <div className="loader"></div>}

      {!isLoading && leaderboard && (
        <section className="leaderboard-container">
          <div className="leaderboard-meta">
            <div>
              <span className="section-label">Current standings</span>
              <h2>{leaderboard.region} {leaderboard.tier}</h2>
            </div>
            <p><strong>{leaderboard.totalPlayers}</strong> players</p>
          </div>

          <div className="leaderboard-table-wrapper">
  <table className="leaderboard-table">
    <thead>
      <tr>
        <th>#</th>
        <th>Player</th>
        <th>Rank</th>
        <th>LP</th>
        <th>Wins</th>
        <th>Losses</th>
        <th>Games</th>
        <th>Win Rate</th>
      </tr>
    </thead>

    <tbody>
      {leaderboard.players.map((player) => {
        const gameName = player.gameName;
        const gameTag = player.gameTag;

        return (
        <tr key={player.puuid}>
          <td>{player.position}</td>
          <td>
            {gameName && gameTag ? (
              <button
                type="button"
                className="leaderboard-player"
                title={`View ${gameName}#${gameTag}`}
                onClick={() =>
                  void searchPlayer(
                    gameName,
                    gameTag,
                    leaderboard.region
                  )
                }
              >
                <span>{gameName}</span>
                <small>#{gameTag}</small>
              </button>
            ) : (
              <span className="leaderboard-player-fallback">
                Player #{player.position}
              </span>
            )}
          </td>
          <td>{player.rank}</td>
          <td>{player.lp}</td>
          <td>{player.wins}</td>
          <td>{player.losses}</td>
          <td>{player.totalGames}</td>
          <td>{player.winRate}%</td>
        </tr>
        );
      })}
    </tbody>
  </table>
</div>

          {leaderboard.pagination.hasMore && (
            <button
              type="button"
              className="load-button"
              onClick={loadMorePlayers}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? "Loading..." : "Load more"}
            </button>
          )}
        </section>
      )}
    </main>
  );
}
