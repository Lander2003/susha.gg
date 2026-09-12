import assert from "node:assert/strict";
import test from "node:test";
import { analyzeGames, getPersonalMeta, summarize, type AnalysisGame } from "./personalMeta.js";
import { personalMetaQuerySchema } from "./schemas.js";

const game = (overrides: Partial<AnalysisGame> = {}): AnalysisGame => ({
  matchId: "m", champion: "Ahri", role: "MIDDLE", win: true,
  kills: 5, deaths: 2, assists: 5, minutes: 30, cs: 210,
  killParticipation: 50, vision: 20, damage: 18000, gold: 12000, patch: "16.17", ...overrides,
});
const games = (count: number, overrides: Partial<AnalysisGame> = {}) => Array.from({ length: count }, (_, i) => game({ matchId: String(i), ...overrides }));

test("empty and zero-death samples never produce NaN, Infinity or invented picks", () => {
  const empty = analyzeGames([]);
  assert.equal(empty.overall.winRate, null);
  assert.deepEqual(empty.pool, []);
  assert.equal(summarize(games(3, { deaths: 0, vision: null })).kda, null);
  assert.equal(summarize(games(3, { vision: null })).visionPerMinute, null);
});

test("two lucky games cannot replace an established pick; champion roles stay separate", () => {
  const report = analyzeGames([...games(2, { champion: "Zed" }), ...games(12), ...games(5, { role: "UTILITY" })]);
  assert.equal(report.pool[0].champion, "Ahri");
  assert.equal(report.champions.filter(c => c.champion === "Ahri").length, 2);
  assert.equal(report.champions.find(c => c.champion === "Zed")?.assessment, "Too early to judge");
});

test("recent and previous observations are disjoint", () => {
  const report = analyzeGames([...games(20), ...games(30, { win: false })]);
  assert.equal(report.recent.winRate, 100);
  assert.equal(report.previous.winRate, 0);
  assert.equal(report.overall.winRate, 40);
});

test("supports never receive farming targets", () => {
  const report = analyzeGames([...games(20, { role: "UTILITY", cs: 10 }), ...games(30, { role: "UTILITY", cs: 100 })]);
  assert.ok(!report.insights.some(i => i.title.includes("farming")));
});

test("matched champion and role declines produce evidence-based review prompts", () => {
  const report = analyzeGames([...games(20, { cs: 150, deaths: 4 }), ...games(30)]);
  assert.ok(report.insights.some(i => i.title === "Your farming has dropped on Ahri"));
  assert.ok(report.insights.some(i => i.title === "You are dying more often on Ahri"));
});

test("changing champions does not invent a personal farming decline", () => {
  const report = analyzeGames([...games(20, { champion: "Zed", cs: 150 }), ...games(30)]);
  assert.ok(!report.insights.some(i => i.title.includes("farming")));
});

test("review label requires a same-role comparison and enough matches", () => {
  const report = analyzeGames([...games(10, { champion: "Zed", win: false }), ...games(20)]);
  assert.equal(report.champions.find(c => c.champion === "Zed")?.assessment, "Needs review");
  const alone = analyzeGames(games(10, { win: false }));
  assert.notEqual(alone.champions[0].assessment, "Needs review");
  assert.deepEqual(alone.pool, [], "A familiar losing pick is not automatically a recommendation");
});

test("analysis parameters reject unsupported sizes, array queries and regions", () => {
  assert.equal(personalMetaQuerySchema.safeParse({ puuid: "p", region: "euw", count: "20" }).success, true);
  for (const count of ["100", "0", "11", ["10"]]) assert.equal(personalMetaQuerySchema.safeParse({ puuid: "p", region: "EUW", count }).success, false);
});

test("cached match details are reused, non-ranked/remakes excluded, cold requests bounded", async () => {
  const { setCache } = await import("./cache.js");
  const puuid = "meta-cache-test";
  const ids = Array.from({ length: 12 }, (_, i) => `META_${i}`);
  const participant = { puuid, championName: "Ahri", kills: 5, deaths: 2, assists: 5, win: true,
    teamPosition: "MIDDLE", teamId: 100, totalMinionsKilled: 200, neutralMinionsKilled: 10 };
  ids.forEach((id, i) => setCache(`match:europe:${id}`, {
    metadata: { matchId: id }, info: { queueId: i === 0 ? 450 : 420, gameDuration: i === 1 ? 100 : 1800,
      participants: [{ ...participant, gameEndedInEarlySurrender: i === 2 }] },
  }, 60000));
  let calls = 0;
  const fetcher = async (url: string) => { calls++; assert.ok(url.includes("queue=420")); return ids; };
  const first = await getPersonalMeta(puuid, "EUW", "europe", 50, fetcher);
  assert.equal(first.scanned, 10);
  assert.equal(first.excluded, 3);
  assert.equal(first.overall.games, 7);
  assert.equal(first.nextCount, 20);
  assert.equal(first.overall.visionPerMinute, null);
  const final = await getPersonalMeta(puuid, "EUW", "europe", 20, fetcher);
  assert.equal(final.scanned, 12);
  assert.equal(final.nextCount, null);
  assert.equal(calls, 1);
  assert.deepEqual(await getPersonalMeta(puuid, "EUW", "europe", 20, fetcher), final);
});
