import { useEffect, useState } from "react";
import {
  getLeaderboardRequest,
  type LeaderboardData,
} from "../api/getLeaderboard";

const regions = ["EUNE", "EUW", "KR", "NA", "BR", "OCE"];

export default function Leaderboard() {
  const [region, setRegion] = useState("EUW");
  const [leaderboard, setLeaderboard] =
    useState<LeaderboardData | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");

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
    fetchLeaderboard(region);
  }, [region]);

  return (
    <main className="leaderboard-page">
      <section className="leaderboard-header">
        <h1>Challenger Leaderboard</h1>
        <p>
          View the highest ranked solo queue players by region.
        </p>

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
      </section>

      {error && <p className="error-message">{error}</p>}

      {isLoading && <div className="loader"></div>}

      {!isLoading && leaderboard && (
        <section className="leaderboard-container">
          <div className="leaderboard-meta">
            <h2>
              {leaderboard.region} {leaderboard.tier}
            </h2>
            <p>{leaderboard.totalPlayers} players</p>
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
      {leaderboard.players.map((player) => (
        <tr key={player.puuid}>
          <td>{player.position}</td>
          <td>Player #{player.position}</td>
          <td>{player.rank}</td>
          <td>{player.lp}</td>
          <td>{player.wins}</td>
          <td>{player.losses}</td>
          <td>{player.totalGames}</td>
          <td>{player.winRate}%</td>
        </tr>
      ))}
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