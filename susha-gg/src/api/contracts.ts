import { z } from "zod";

const nonNegativeInteger = z.number().int().nonnegative();
const regionSchema = z.enum(["NA", "BR", "OCE", "EUNE", "EUW", "KR"]);

const matchPlayerSchema = z.object({
  puuid: z.string(),
  gameName: z.string(),
  gameTag: z.string(),
  champion: z.string(),
  kills: nonNegativeInteger,
  deaths: nonNegativeInteger,
  assists: nonNegativeInteger,
  win: z.boolean(),
  role: z.string(),
  teamId: z.number().int(),
  cs: nonNegativeInteger,
});

const simplifiedMatchSchema = z.object({
  matchId: z.string(),
  duration: nonNegativeInteger,
  queueId: z.number().int(),
  searchedPlayer: matchPlayerSchema,
  players: z.array(matchPlayerSchema),
});

const paginationSchema = z.object({
  start: nonNegativeInteger,
  count: nonNegativeInteger,
  nextStart: nonNegativeInteger,
  hasMore: z.boolean(),
});

export const playerResponseSchema = z.object({
  puuid: z.string(),
  gameName: z.string(),
  gameTag: z.string(),
  region: regionSchema,
  rankedSolo: z
    .object({
      tier: z.string(),
      rank: z.string(),
      lp: nonNegativeInteger,
      wins: nonNegativeInteger,
      losses: nonNegativeInteger,
      totalGames: nonNegativeInteger,
    })
    .nullable(),
  simplifiedMatches: z.array(simplifiedMatchSchema),
  pagination: paginationSchema,
});

export const matchesResponseSchema = z.object({
  simplifiedMatches: z.array(simplifiedMatchSchema),
  pagination: paginationSchema,
});

const leaderboardPlayerSchema = z.object({
  position: nonNegativeInteger,
  puuid: z.string(),
  gameName: z.string().nullable(),
  gameTag: z.string().nullable(),
  rank: z.string(),
  lp: nonNegativeInteger,
  wins: nonNegativeInteger,
  losses: nonNegativeInteger,
  totalGames: nonNegativeInteger,
  winRate: z.number().min(0).max(100),
});

export const leaderboardResponseSchema = z.object({
  region: regionSchema,
  tier: z.string(),
  queue: z.string(),
  totalPlayers: nonNegativeInteger,
  players: z.array(leaderboardPlayerSchema),
  pagination: paginationSchema,
});

export const apiErrorSchema = z.object({
  error: z.string(),
});

export type PlayerData = z.infer<typeof playerResponseSchema>;
export type MatchesResponse = z.infer<typeof matchesResponseSchema>;
export type LeaderboardPlayer = z.infer<typeof leaderboardPlayerSchema>;
export type LeaderboardData = z.infer<typeof leaderboardResponseSchema>;
