import assert from "node:assert/strict";
import test from "node:test";

import { RiotNetworkError, type RiotOperation } from "./errors.js";
import { getLeaderboard } from "./getLeaderboard.js";

function createLeaderboardEntry(puuid: string, leaguePoints: number) {
  return {
    puuid,
    leaguePoints,
    wins: 20,
    losses: 10,
  };
}

test("resolves and caches identities only for the requested page", async () => {
  const requests: { url: string; operation: RiotOperation }[] = [];
  const riotFetch = async (url: string, operation: RiotOperation) => {
    requests.push({ url, operation });

    if (operation === "leaderboard") {
      return {
        tier: "CHALLENGER",
        queue: "RANKED_SOLO_5x5",
        entries: [
          createLeaderboardEntry("identity-test-1", 1000),
          createLeaderboardEntry("identity-test-2", 900),
          createLeaderboardEntry("identity-test-3", 800),
        ],
      };
    }

    const puuid = decodeURIComponent(url.split("/").at(-1) ?? "");
    return {
      puuid,
      gameName: `Player ${puuid.at(-1)}`,
      tagLine: "EUW",
    };
  };

  const firstResult = await getLeaderboard({
    platformRegion: "identity-test-platform",
    routingRegion: "identity-test-routing",
    start: 0,
    count: 2,
    riotFetch,
  });

  assert.deepEqual(
    firstResult.players.map(({ gameName, gameTag }) => ({
      gameName,
      gameTag,
    })),
    [
      { gameName: "Player 1", gameTag: "EUW" },
      { gameName: "Player 2", gameTag: "EUW" },
    ]
  );
  assert.equal(
    requests.filter(({ operation }) => operation === "account-name").length,
    2
  );

  await getLeaderboard({
    platformRegion: "identity-test-platform",
    routingRegion: "identity-test-routing",
    start: 0,
    count: 2,
    riotFetch,
  });

  assert.equal(requests.length, 3);
});

test("keeps leaderboard statistics when an identity lookup fails", async () => {
  let identityRequests = 0;

  const riotFetch = async (_url: string, operation: RiotOperation) => {
    if (operation === "leaderboard") {
      return {
        tier: "CHALLENGER",
        queue: "RANKED_SOLO_5x5",
        entries: [
          createLeaderboardEntry("fallback-test-1", 750),
          createLeaderboardEntry("fallback-test-2", 700),
          createLeaderboardEntry("fallback-test-3", 650),
        ],
      };
    }

    identityRequests += 1;
    throw new RiotNetworkError("account-name");
  };

  const result = await getLeaderboard({
    platformRegion: "fallback-test-platform",
    routingRegion: "fallback-test-routing",
    start: 0,
    count: 3,
    riotFetch,
  });

  assert.equal(result.players[0].lp, 750);
  assert.equal(result.players[0].gameName, null);
  assert.equal(result.players[0].gameTag, null);
  assert.equal(identityRequests, 1);
  assert.ok(result.players.every((player) => player.gameName === null));
});

test("limits and spaces identity lookups", async () => {
  let activeLookups = 0;
  let maximumActiveLookups = 0;
  const lookupStartTimes: number[] = [];

  const riotFetch = async (url: string, operation: RiotOperation) => {
    if (operation === "leaderboard") {
      return {
        tier: "CHALLENGER",
        queue: "RANKED_SOLO_5x5",
        entries: Array.from({ length: 8 }, (_, index) =>
          createLeaderboardEntry(`concurrency-test-${index}`, 1000 - index)
        ),
      };
    }

    lookupStartTimes.push(Date.now());
    activeLookups += 1;
    maximumActiveLookups = Math.max(maximumActiveLookups, activeLookups);
    await new Promise((resolve) => setTimeout(resolve, 10));
    activeLookups -= 1;

    const puuid = decodeURIComponent(url.split("/").at(-1) ?? "");
    return {
      puuid,
      gameName: puuid,
      tagLine: "TEST",
    };
  };

  await getLeaderboard({
    platformRegion: "concurrency-test-platform",
    routingRegion: "concurrency-test-routing",
    start: 0,
    count: 8,
    riotFetch,
  });

  assert.ok(maximumActiveLookups <= 4);

  for (let index = 1; index < lookupStartTimes.length; index += 1) {
    assert.ok(lookupStartTimes[index] - lookupStartTimes[index - 1] >= 60);
  }
});
