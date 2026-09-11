export type MatchPlayer = {
  puuid: string;
  gameName: string;
  gameTag: string;
  champion: string;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  role: string;
  teamId: number;
  cs: number;
};

export type SimplifiedMatch = {
  matchId: string;
  duration: number;
  queueId: number;
  searchedPlayer: MatchPlayer;
  players: MatchPlayer[];
};

export type Pagination = {
  start: number;
  count: number;
  nextStart: number;
  hasMore: boolean;
};

export type PlayerResponse = {
  puuid: string;
  gameName: string;
  gameTag: string;
  region: string;
  rankedSolo: {
    tier: string;
    rank: string;
    lp: number;
    wins: number;
    losses: number;
    totalGames: number;
  } | null;
  simplifiedMatches: SimplifiedMatch[];
  pagination: Pagination;
};

export type MatchesResponse = {
  simplifiedMatches: SimplifiedMatch[];
  pagination: Pagination;
};

export type LeaderboardPlayer = {
  position: number;
  puuid: string;
  gameName: string | null;
  gameTag: string | null;
  rank: string;
  lp: number;
  wins: number;
  losses: number;
  totalGames: number;
  winRate: number;
};

export type LeaderboardResponse = {
  region: string;
  tier: string;
  queue: string;
  totalPlayers: number;
  players: LeaderboardPlayer[];
  pagination: Pagination;
};
