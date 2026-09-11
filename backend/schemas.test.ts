import assert from "node:assert/strict";
import test from "node:test";

import { RiotPayloadError } from "./errors.js";
import {
  leaderboardQuerySchema,
  matchesQuerySchema,
  parseRiotPayload,
  playerQuerySchema,
  riotAccountIdentitySchema,
  riotAccountSchema,
} from "./schemas.js";

test("normalizes a valid player query", () => {
  const query = playerQuerySchema.parse({
    gameid: " Hide on bush # KR1 ",
    region: "kr",
  });

  assert.deepEqual(query, {
    gameid: { gameName: "Hide on bush", gameTag: "KR1" },
    region: "KR",
  });
});

test("applies pagination defaults", () => {
  const matchesQuery = matchesQuerySchema.parse({
    puuid: "player-puuid",
    region: "EUW",
  });
  const leaderboardQuery = leaderboardQuerySchema.parse({ region: "KR" });

  assert.equal(matchesQuery.start, 0);
  assert.equal(matchesQuery.count, 5);
  assert.equal(leaderboardQuery.start, 0);
  assert.equal(leaderboardQuery.count, 25);
});

test("rejects malformed query parameters", () => {
  assert.equal(
    playerQuerySchema.safeParse({ gameid: "missing-tag", region: "EUW" })
      .success,
    false
  );
  assert.equal(
    matchesQuerySchema.safeParse({
      puuid: "player-puuid",
      region: "EUW",
      count: "11",
    }).success,
    false
  );
});

test("rejects malformed Riot payloads with a typed error", () => {
  assert.throws(
    () => parseRiotPayload(riotAccountSchema, { puuid: 123 }, "account"),
    RiotPayloadError
  );
});

test("validates a Riot account identity", () => {
  assert.deepEqual(
    riotAccountIdentitySchema.parse({
      puuid: "player-puuid",
      gameName: "Hide on bush",
      tagLine: "KR1",
    }),
    {
      puuid: "player-puuid",
      gameName: "Hide on bush",
      tagLine: "KR1",
    }
  );
});
