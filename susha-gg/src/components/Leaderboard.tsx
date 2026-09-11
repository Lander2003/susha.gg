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

function formatQueueName(queue: string) {
  return queue === "RANKED_SOLO_5x5" ? "Ranked Solo/Duo" : queue;
}

export default function Leaderboard({ searchPlayer }: LeaderboardProps) {
  const [region, setRegion] = useState("EUW");
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  async function fetchLeaderboard(selectedRegion: string) {
    setIsLoading(true);
    setError("");

    try {
      const data = await getLeaderboardRequest(selectedRegion, 0, 25);
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
    if (!leaderboard || !leaderboard.pagination.hasMore || isLoadingMore) {
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
    };

    void loadLeaderboard();
  }, [region]);

  return (
    <main className="leaderboard-page">
      <section className="leaderboard-header">
        <div className="leaderboard-title">
          <span className="section-label">Ranked Solo/Duo</span>
          <h1>Challenger Leaderboard</h1>
          <p>View the highest ranked solo queue players by region.</p>
        </div>

        <div className="leaderboard-region-picker">
          <span>Region</span>
          <div className="leaderboard-regions" aria-label="Leaderboard region">
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
                aria-pressed={region === serverRegion}
              >
                {serverRegion}
              </button>
            ))}
          </div>
        </div>

        {error && <span className="error-message">{error}</span>}
      </section>

      {isLoading && (
        <section className="leaderboard-loading" aria-label="Loading leaderboard">
          <div className="loader" />
          <p>Loading {region} standings...</p>
        </section>
      )}

      {!isLoading && leaderboard && (
        <section className="leaderboard-container">
          <div className="leaderboard-meta">
            <div>
              <span className="section-label">Current standings</span>
              <h2>
                {leaderboard.region} {leaderboard.tier}
              </h2>
            </div>
            <p>
              Showing <strong>{leaderboard.players.length}</strong> of{" "}
              <strong>{leaderboard.totalPlayers}</strong> players
            </p>
          </div>

          <div className="leaderboard-summary" aria-label="Leaderboard summary">
            <div>
              <span>Queue</span>
              <strong>{formatQueueName(leaderboard.queue)}</strong>
            </div>
            <div>
              <span>Region</span>
              <strong>{leaderboard.region}</strong>
            </div>
            <div>
              <span>Leader</span>
              <strong>
                {leaderboard.players[0]
                  ? `${leaderboard.players[0].lp.toLocaleString()} LP`
                  : "—"}
              </strong>
            </div>
          </div>

          {leaderboard.players.length > 0 ? (
            <div className="leaderboard-table-wrapper">
              <table className="leaderboard-table">
                <caption className="sr-only">
                  {leaderboard.region} Challenger player standings
                </caption>
                <thead>
                  <tr>
                    <th>Position</th>
                    <th>Player</th>
                    <th>Division</th>
                    <th>League Points</th>
                    <th>Record</th>
                    <th>Games</th>
                    <th>Win Rate</th>
                  </tr>
                </thead>

                <tbody>
                  {leaderboard.players.map((player) => {
                    const gameName = player.gameName;
                    const gameTag = player.gameTag;
                    const isTopThree = player.position <= 3;

                    return (
                      <tr
                        key={player.puuid}
                        className={
                          isTopThree
                            ? `leaderboard-row top-player top-${player.position}`
                            : "leaderboard-row"
                        }
                      >
                        <td className="leaderboard-position-cell">
                          <span className="leaderboard-position">
                            {player.position}
                          </span>
                        </td>
                        <td className="leaderboard-player-cell">
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
                              <span className="leaderboard-player-name">
                                {gameName}
                              </span>
                              <small>#{gameTag}</small>
                              <span
                                className="leaderboard-player-arrow"
                                aria-hidden="true"
                              >
                                →
                              </span>
                            </button>
                          ) : (
                            <span className="leaderboard-player-fallback">
                              Player #{player.position}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="leaderboard-division">{player.rank}</span>
                        </td>
                        <td className="leaderboard-lp">
                          <strong>{player.lp.toLocaleString()}</strong>
                          <span>LP</span>
                        </td>
                        <td className="leaderboard-record">
                          <span className="record-wins">{player.wins}W</span>
                          <span aria-hidden="true">·</span>
                          <span className="record-losses">{player.losses}L</span>
                        </td>
                        <td>{player.totalGames}</td>
                        <td className="leaderboard-win-rate">
                          <div className="win-rate-heading">
                            <strong>{player.winRate}%</strong>
                          </div>
                          <div
                            className="win-rate-track"
                            role="meter"
                            aria-label={`${player.winRate}% win rate`}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={player.winRate}
                          >
                            <span style={{ width: `${player.winRate}%` }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="leaderboard-empty">
              <h3>No ranked players found</h3>
              <p>Try another region to view its Challenger standings.</p>
            </div>
          )}

          {leaderboard.pagination.hasMore && (
            <button
              type="button"
              className="load-button"
              onClick={loadMorePlayers}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? "Loading..." : "Load more players"}
            </button>
          )}
        </section>
      )}
    </main>
  );
}
