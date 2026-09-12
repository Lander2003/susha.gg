import { getFromCache, setCache } from "./cache.js";
import { RiotApiError, type RiotOperation } from "./errors.js";
import { getMatchDetails } from "./getSimplifiedMatches.js";
import { parseRiotPayload, riotMatchIdsSchema, type Region } from "./schemas.js";

export type AnalysisGame = {
  matchId: string; champion: string; role: string; win: boolean;
  kills: number; deaths: number; assists: number; minutes: number; cs: number;
  killParticipation: number | null; vision: number | null;
  damage: number | null; gold: number | null; patch: string;
};
const round = (value: number) => Math.round(value * 10) / 10;
const mean = (values: number[]) => values.length ? round(values.reduce((a, b) => a + b, 0) / values.length) : null;

export function summarize(games: AnalysisGame[]) {
  const wins = games.filter(g => g.win).length;
  const deaths = games.reduce((sum, g) => sum + g.deaths, 0);
  const ka = games.reduce((sum, g) => sum + g.kills + g.assists, 0);
  return {
    games: games.length, wins, losses: games.length - wins,
    winRate: games.length ? round(wins / games.length * 100) : null,
    kda: games.length && deaths > 0 ? round(ka / deaths) : null,
    deathsPerGame: mean(games.map(g => g.deaths)),
    csPerMinute: mean(games.map(g => g.cs / g.minutes)),
    killParticipation: mean(games.flatMap(g => g.killParticipation === null ? [] : [g.killParticipation])),
    visionPerMinute: mean(games.flatMap(g => g.vision === null ? [] : [g.vision / g.minutes])),
    damagePerMinute: mean(games.flatMap(g => g.damage === null ? [] : [g.damage / g.minutes])),
    goldPerMinute: mean(games.flatMap(g => g.gold === null ? [] : [g.gold / g.minutes])),
  };
}

type Insight = { title: string; evidence: string; action: string };
const roleName = (role: string) => ({ TOP: "top", JUNGLE: "jungle", MIDDLE: "mid", BOTTOM: "bot", UTILITY: "support" }[role] ?? "unknown role");

// Inputs are newest first. Recent and previous windows never overlap.
export function analyzeGames(games: AnalysisGame[]) {
  const overall = summarize(games);
  const recent = summarize(games.slice(0, 20));
  const previous = summarize(games.slice(20));
  const roles = [...new Set(games.map(g => g.role))].map(role => ({
    role, ...summarize(games.filter(g => g.role === role)),
  })).sort((a, b) => b.games - a.games || a.role.localeCompare(b.role));
  const groups = [...new Set(games.map(g => `${g.champion}:${g.role}`))];
  const champions = groups.map(key => {
    const matches = games.filter(g => `${g.champion}:${g.role}` === key);
    const first = matches[0];
    const stats = summarize(matches);
    const baseline = games.filter(g => g.role === first.role && g.champion !== first.champion);
    const baselineRate = summarize(baseline).winRate;
    // Shrink small samples toward 50%; this is an ordering heuristic, not a skill rating.
    const adjustedRate = (stats.wins + 5) / (stats.games + 10);
    const needsReview = stats.games >= 10 && baseline.length >= 10 &&
      stats.winRate! <= 40 && baselineRate! - stats.winRate! >= 10;
    const assessment = stats.games < 5 ? "Too early to judge" : needsReview ? "Needs review" :
      stats.games >= 10 && adjustedRate >= 0.55 ? "Core candidate" :
      stats.games < 10 && adjustedRate >= 0.55 ? "Promising" : "Building evidence";
    return { champion: first.champion, role: first.role, ...stats,
      recent: summarize(games.slice(0, 20).filter(g => `${g.champion}:${g.role}` === key)),
      previous: summarize(games.slice(20).filter(g => `${g.champion}:${g.role}` === key)),
      assessment, adjustedRate,
    };
  }).sort((a, b) => b.games - a.games || a.champion.localeCompare(b.champion));

  const primaryRole = roles.find(r => r.role !== "UNKNOWN")?.role ?? null;
  const candidates = champions.filter(c => c.role === primaryRole && c.assessment === "Core candidate")
    .sort((a, b) => b.adjustedRate - a.adjustedRate || b.games - a.games || a.champion.localeCompare(b.champion));
  const pool = candidates.slice(0, 2).map((c, index) => ({
    champion: c.champion, role: c.role,
    label: index === 0 ? "Strongest established pick" : "Second established pick",
    evidence: `${c.winRate}% win rate across ${c.games} ${roleName(c.role)} games (${c.wins} wins and ${c.losses} losses). ${index === 0 ? "This is your strongest result among the established picks in your most-played role." : "This is your next strongest established option in your most-played role."}`,
  }));
  const insights: Insight[] = [];
  const recentRole = games.slice(0, 20).filter(g => g.role === primaryRole);
  const previousRole = games.slice(20).filter(g => g.role === primaryRole);
  if (primaryRole && recentRole.length >= 5 && previousRole.length >= 5) {
    // Match champion composition to avoid attributing a champion switch to deteriorating habits.
    const focus = candidates[0];
    const current = recentRole.filter(g => g.champion === focus?.champion);
    const before = previousRole.filter(g => g.champion === focus?.champion);
    if (focus && current.length >= 5 && before.length >= 5) {
      const a = summarize(current), b = summarize(before);
      if (primaryRole !== "UTILITY" && b.csPerMinute! - a.csPerMinute! >= 0.7) {
        insights.push({ title: `Your farming has dropped on ${focus.champion}`,
          evidence: `You averaged ${a.csPerMinute} CS per minute in your latest ${a.games} ${roleName(primaryRole)} games on ${focus.champion}, down from ${b.csPerMinute} across the previous ${b.games}.`,
          action: "Review one or two replays for missed minion waves, poor recall timing or time spent away from farm. In your next 10 games on this pick, try to return to your earlier CS rate." });
      }
      if (a.deathsPerGame! - b.deathsPerGame! >= 1) insights.push({ title: `You are dying more often on ${focus.champion}`,
        evidence: `You averaged ${a.deathsPerGame} deaths in your latest ${a.games} ${roleName(primaryRole)} games on ${focus.champion}, compared with ${b.deathsPerGame} across the previous ${b.games}.`,
        action: "Review one avoidable death from each game and look for a repeated decision, such as fighting without vision or staying too long. Check this number again after 10 games." });
    }
  }
  const review = champions.find(c => c.assessment === "Needs review");
  if (review) insights.push({ title: `${review.champion} is underperforming for you`,
    evidence: `You have a ${review.winRate}% win rate across ${review.games} ${roleName(review.role)} games on ${review.champion} (${review.wins} wins and ${review.losses} losses). That is at least 10 percentage points below your other ${roleName(review.role)} picks with a meaningful sample.`,
    action: `Review a few ${review.champion} losses before making it a ranked priority. Consider using a stronger established pick while you work out what is going wrong.` });
  if (pool.length) insights.push({ title: `Use ${pool[0].champion} as your next focus pick`,
    evidence: pool[0].evidence,
    action: `When the role and draft suit it, prioritize ${pool[0].champion} over your less successful picks for the next 10 ranked games. Then run the analysis again to see whether the result holds.` });
  if (!insights.length) insights.push({ title: "Play more games before changing your champion pool",
    evidence: `We analyzed ${games.length} eligible matches, but no champion-role combination has enough positive evidence to recommend confidently yet.`,
    action: "Keep playing a familiar champion in your main role. Once you reach at least 10 games on that combination, the analysis can make a more useful comparison." });
  return { overall, recent, previous, roles, champions: champions.map(({ adjustedRate: _rate, ...c }) => c),
    primaryRole, pool, insights: insights.slice(0, 3),
    patches: [...new Set(games.map(g => g.patch))],
  };
}

type RiotFetch = (url: string, operation: RiotOperation) => Promise<unknown>;
const TTL = 15 * 60 * 1000;
const pending = new Map<string, Promise<PersonalMetaReport>>();
let active = false;
let nextRequestAt = 0;
export type PersonalMetaReport = ReturnType<typeof analyzeGames> & {
  scanned: number; excluded: number; available: number; nextCount: number | null;
  generatedAt: string; region: Region; days: number;
};

export async function getPersonalMeta(puuid: string, region: Region, routingRegion: string, count: number, riotFetch: RiotFetch): Promise<PersonalMetaReport> {
  const key = `meta:${region}:${puuid}:${count}`;
  const cached = getFromCache<PersonalMetaReport>(key);
  if (cached) return cached;
  const existing = pending.get(key);
  if (existing) return existing;
  // Bound work across different users; do not accumulate an unbounded request queue.
  if (active) throw new RiotApiError(429, "match-detail", "15");
  active = true;
  const work = (async () => {
    const pacedFetch: RiotFetch = async (url, operation) => {
      await new Promise(resolve => setTimeout(resolve, Math.max(0, nextRequestAt - Date.now())));
      nextRequestAt = Date.now() + 1400;
      try { return await riotFetch(url, operation); }
      catch (error) {
        if (error instanceof RiotApiError && error.status === 429) {
          const seconds = Number(error.retryAfter);
          nextRequestAt = Date.now() + (Number.isFinite(seconds) && seconds > 0 ? seconds : 120) * 1000;
        }
        throw error;
      }
    };
    // Never hold an HTTP request open throughout a previous rate-limit cooldown.
    if (nextRequestAt - Date.now() > 2000) throw new RiotApiError(429, "match-detail", String(Math.ceil((nextRequestAt - Date.now()) / 1000)));
    const listKey = `meta-ids:${region}:${puuid}`;
    let ids = getFromCache<string[]>(listKey);
    if (!ids) {
      ids = parseRiotPayload(riotMatchIdsSchema, await pacedFetch(
        `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?queue=420&start=0&count=50&startTime=${Math.floor((Date.now() - 90 * 86400000) / 1000)}`,
        "match-list"), "match-list");
      ids = [...new Set(ids)].slice(0, 50);
      setCache(listKey, ids, TTL);
    }
    // A caller cannot turn a single request into a 50-match cold fetch.
    const previousReport = count > 10 ? getFromCache<PersonalMetaReport>(`meta:${region}:${puuid}:${count - 10}`) : null;
    const batchCount = count > 10 && !previousReport ? 10 : count;
    const selected = ids.slice(0, batchCount);
    const games: AnalysisGame[] = [];
    for (const matchId of selected) {
      const match = await getMatchDetails({ matchId, routingRegion, riotFetch: pacedFetch });
      const p = match.info.participants.find(p => p.puuid === puuid);
      if (!p || match.info.queueId !== 420 || match.info.gameDuration < 300 ||
        match.info.participants.some(player => player.gameEndedInEarlySurrender)) continue;
      const teamKills = match.info.participants.filter(other => other.teamId === p.teamId).reduce((sum, other) => sum + other.kills, 0);
      games.push({ matchId, champion: p.championName, role: p.teamPosition || "UNKNOWN", win: p.win,
        kills: p.kills, deaths: p.deaths, assists: p.assists, minutes: match.info.gameDuration / 60,
        cs: p.totalMinionsKilled + p.neutralMinionsKilled,
        killParticipation: teamKills ? Math.min(100, (p.kills + p.assists) / teamKills * 100) : null,
        vision: p.visionScore ?? null, damage: p.totalDamageDealtToChampions ?? null,
        gold: p.goldEarned ?? null, patch: match.info.gameVersion?.split(".").slice(0, 2).join(".") || "Unknown",
      });
    }
    const report = { ...analyzeGames(games), scanned: selected.length, excluded: selected.length - games.length,
      available: ids.length, nextCount: selected.length < ids.length ? Math.min(batchCount + 10, 50) : null,
      generatedAt: new Date().toISOString(), region, days: 90 };
    setCache(`meta:${region}:${puuid}:${batchCount}`, report, TTL);
    return report;
  })();
  pending.set(key, work);
  try { return await work; } finally { active = false; pending.delete(key); }
}
