import { getFromCache, setCache } from "./cache.js";

type RiotFetch = (url: string) => Promise<any>;

type GetLeaderboardParams = {
  platformRegion: string;
  start: number;
  count: number;
  riotFetch: RiotFetch;
};

type LeaderboardPlayer = {
  position: number;
  puuid: string;
  rank: string;
  lp: number;
  wins: number;
  losses: number;
  totalGames: number;
  winRate: number;
};

type CachedLeaderboard = {
  tier: string;
  queue: string;
  totalPlayers: number;
  players: LeaderboardPlayer[];
};

const LEADERBOARD_CACHE_TTL_MS = 5 * 60 * 1000;

export async function getLeaderboard({
  platformRegion,
  start,
  count,
  riotFetch,
}: GetLeaderboardParams) {
  const cacheKey = `leaderboard:${platformRegion}:RANKED_SOLO_5x5`;

  let fullLeaderboard =
    getFromCache<CachedLeaderboard>(cacheKey);

  if (!fullLeaderboard) {
    const leaderboardData = await riotFetch(
      `https://${platformRegion}.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5`
    );

    const sortedEntries = leaderboardData.entries.sort(
      (a: any, b: any) => b.leaguePoints - a.leaguePoints
    );

    const players = sortedEntries.map(
      (player: any, index: number) => {
        const totalGames = player.wins + player.losses;

        const winRate =
          totalGames > 0
            ? Math.round((player.wins / totalGames) * 100)
            : 0;

        return {
          position: index + 1,
          puuid: player.puuid,
          rank: leaderboardData.tier,
          lp: player.leaguePoints,
          wins: player.wins,
          losses: player.losses,
          totalGames,
          winRate,
        };
      }
    );

    fullLeaderboard = {
      tier: leaderboardData.tier,
      queue: leaderboardData.queue,
      totalPlayers: players.length,
      players,
    };

    setCache(
      cacheKey,
      fullLeaderboard,
      LEADERBOARD_CACHE_TTL_MS
    );
  }

  const paginatedPlayers = fullLeaderboard.players.slice(
    start,
    start + count
  );

  return {
    tier: fullLeaderboard.tier,
    queue: fullLeaderboard.queue,
    totalPlayers: fullLeaderboard.totalPlayers,
    players: paginatedPlayers,
  };
}