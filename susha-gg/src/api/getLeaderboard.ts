export type LeaderboardPlayer = {
  position: number;
  puuid: string;
  rank: string;
  lp: number;
  wins: number;
  losses: number;
  totalGames: number;
  winRate: number;
};

export type LeaderboardData = {
  region: string;
  tier: string;
  queue: string;
  totalPlayers: number;
  players: LeaderboardPlayer[];
  pagination: {
    start: number;
    count: number;
    nextStart: number;
    hasMore: boolean;
  };
};

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

  const response = await fetch(
    `${API_URL}/leaderboard?${parameters.toString()}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Could not fetch leaderboard");
  }

  return data;
}