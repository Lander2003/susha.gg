import { fetchApi } from "./client";
import {
  leaderboardResponseSchema,
  type LeaderboardData,
} from "./contracts";

export type { LeaderboardData, LeaderboardPlayer } from "./contracts";

const API_URL = import.meta.env.VITE_API_URL;

export async function getLeaderboardRequest(
  region: string,
  start = 0,
  count = 25
): Promise<LeaderboardData> {
  const parameters = new URLSearchParams({
    region,
    start: String(start),
    count: String(count),
  });

  return fetchApi(
    `${API_URL}/leaderboard?${parameters.toString()}`,
    leaderboardResponseSchema
  );
}
