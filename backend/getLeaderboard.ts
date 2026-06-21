type RiotFetch = (url: string) => Promise<any>;

type GetLeaderboardParams = {
  platformRegion: string;
  start: number;
  count: number;
  riotFetch: RiotFetch;
};

export async function getLeaderboard({
  platformRegion,
  start,
  count,
  riotFetch,
}: GetLeaderboardParams) {
  const leaderboardData = await riotFetch(
    `https://${platformRegion}.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5`
  );

  const sortedEntries = leaderboardData.entries.sort(
    (a: any, b: any) => b.leaguePoints - a.leaguePoints
  );

  const paginatedEntries = sortedEntries.slice(start, start + count);

  const players = paginatedEntries.map((player: any, index: number) => {
    const totalGames = player.wins + player.losses;

    const winRate =
      totalGames > 0
        ? Math.round((player.wins / totalGames) * 100)
        : 0;

    return {
      position: start + index + 1,
      puuid: player.puuid,
      rank: leaderboardData.tier,
      lp: player.leaguePoints,
      wins: player.wins,
      losses: player.losses,
      totalGames,
      winRate,
    };
  });

  return {
    tier: leaderboardData.tier,
    queue: leaderboardData.queue,
    totalPlayers: sortedEntries.length,
    players,
  };
}