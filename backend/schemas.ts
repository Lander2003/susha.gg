import { z } from "zod";

import { RiotPayloadError, type RiotOperation } from "./errors.js";

const nonNegativeInteger = z.number().int().nonnegative();
const regionSchema = z.enum(["NA", "BR", "OCE", "EUNE", "EUW", "KR"], {
  error: "Invalid region",
});

const riotIdSchema = z
  .string({ error: "Invalid Riot ID" })
  .trim()
  .min(3, "Invalid Riot ID")
  .max(30, "Invalid Riot ID")
  .refine((value) => value.split("#").length === 2, {
    message: "Invalid Riot ID. Use format: Name#Tag",
  })
  .transform((value) => {
    const [gameName, gameTag] = value.split("#").map((part) => part.trim());
    return { gameName, gameTag };
  })
  .refine(({ gameName, gameTag }) => Boolean(gameName && gameTag), {
    message: "Invalid Riot ID. Use format: Name#Tag",
  });

function integerQuery(defaultValue: number, maximum: number) {
  return z
    .preprocess(
      (value) => (value === undefined ? String(defaultValue) : value),
      z.string().regex(/^\d+$/, "Must be an integer")
    )
    .transform(Number)
    .pipe(z.number().int().min(0).max(maximum));
}

export const playerQuerySchema = z.object({
  gameid: riotIdSchema,
  region: z
    .string({ error: "Invalid region" })
    .transform((value) => value.toUpperCase())
    .pipe(regionSchema),
});

export const matchesQuerySchema = z.object({
  puuid: z
    .string({ error: "Invalid player identifier" })
    .trim()
    .min(1, "Invalid player identifier")
    .max(100, "Invalid player identifier"),
  region: z
    .string({ error: "Invalid region" })
    .transform((value) => value.toUpperCase())
    .pipe(regionSchema),
  start: integerQuery(0, Number.MAX_SAFE_INTEGER),
  count: integerQuery(5, 10).refine((value) => value >= 1, {
    message: "Count must be at least 1",
  }),
});

export const leaderboardQuerySchema = z.object({
  region: z
    .string({ error: "Invalid region" })
    .transform((value) => value.toUpperCase())
    .pipe(regionSchema),
  start: integerQuery(0, Number.MAX_SAFE_INTEGER),
  count: integerQuery(25, 50).refine((value) => value >= 1, {
    message: "Count must be at least 1",
  }),
});

export type Region = z.infer<typeof regionSchema>;

export const riotAccountSchema = z.object({
  puuid: z.string().min(1),
});

export const riotLeagueEntriesSchema = z.array(
  z.object({
    queueType: z.string(),
    tier: z.string(),
    rank: z.string(),
    leaguePoints: nonNegativeInteger,
    wins: nonNegativeInteger,
    losses: nonNegativeInteger,
  })
);

const riotParticipantSchema = z.object({
  puuid: z.string(),
  riotIdGameName: z.string().nullish(),
  riotIdTagline: z.string().nullish(),
  championName: z.string().min(1),
  kills: nonNegativeInteger,
  deaths: nonNegativeInteger,
  assists: nonNegativeInteger,
  win: z.boolean(),
  teamPosition: z.string(),
  teamId: z.number().int(),
  totalMinionsKilled: nonNegativeInteger,
  neutralMinionsKilled: nonNegativeInteger,
});

export const riotMatchIdsSchema = z.array(z.string().min(1));

export const riotMatchSchema = z.object({
  metadata: z.object({
    matchId: z.string().min(1),
  }),
  info: z.object({
    gameDuration: nonNegativeInteger,
    queueId: z.number().int(),
    participants: z.array(riotParticipantSchema),
  }),
});

export const riotLeaderboardSchema = z.object({
  tier: z.string(),
  queue: z.string(),
  entries: z.array(
    z.object({
      puuid: z.string().min(1),
      leaguePoints: nonNegativeInteger,
      wins: nonNegativeInteger,
      losses: nonNegativeInteger,
    })
  ),
});

export function parseRiotPayload<T>(
  schema: z.ZodType<T>,
  payload: unknown,
  operation: RiotOperation
): T {
  const result = schema.safeParse(payload);

  if (!result.success) {
    throw new RiotPayloadError(operation, z.prettifyError(result.error));
  }

  return result.data;
}
