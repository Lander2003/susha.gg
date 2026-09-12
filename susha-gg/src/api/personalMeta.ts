import { z } from "zod";

const numberOrNull = z.number().finite().nullable();
const stats = z.object({
  games: z.number().int().nonnegative(), wins: z.number().int().nonnegative(), losses: z.number().int().nonnegative(),
  winRate: z.number().min(0).max(100).nullable(), kda: numberOrNull,
  deathsPerGame: numberOrNull, csPerMinute: numberOrNull, killParticipation: numberOrNull,
  visionPerMinute: numberOrNull, damagePerMinute: numberOrNull, goldPerMinute: numberOrNull,
});
const reportSchema = z.object({
  overall: stats, recent: stats, previous: stats,
  roles: z.array(stats.extend({ role: z.string() })),
  champions: z.array(stats.extend({ champion: z.string(), role: z.string(), recent: stats, previous: stats,
    assessment: z.enum(["Too early to judge", "Needs review", "Core candidate", "Promising", "Building evidence"]),
  })),
  primaryRole: z.string().nullable(),
  pool: z.array(z.object({ champion: z.string(), role: z.string(), label: z.string(), evidence: z.string() })),
  insights: z.array(z.object({ title: z.string(), evidence: z.string(), action: z.string() })),
  patches: z.array(z.string()), scanned: z.number().int().min(0).max(50), excluded: z.number().int().nonnegative(),
  available: z.number().int().min(0).max(50), nextCount: z.number().int().min(10).max(50).nullable(),
  generatedAt: z.string(), region: z.string(), days: z.number(),
});
export type MetaReport = z.infer<typeof reportSchema>;

export async function getPersonalMeta(puuid: string, region: string, count: number, signal: AbortSignal) {
  const query = new URLSearchParams({ puuid, region, count: String(count) });
  const response = await fetch(`${import.meta.env.VITE_API_URL}/personal-meta?${query}`, { signal });
  const body: unknown = await response.json();
  if (!response.ok) {
    const error = z.object({ error: z.string() }).safeParse(body);
    throw new Error(error.success ? error.data.error : "Analysis could not be loaded. Please try again.");
  }
  const result = reportSchema.safeParse(body);
  if (!result.success) throw new Error("The server returned an unexpected analysis response.");
  return result.data;
}
