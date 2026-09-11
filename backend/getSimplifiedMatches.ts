import { getFromCache, setCache } from "./cache.js";
import type { MatchPlayer, SimplifiedMatch } from "./apiTypes.js";
import type { RiotOperation } from "./errors.js";
import {
  parseRiotPayload,
  riotMatchIdsSchema,
  riotMatchSchema,
} from "./schemas.js";

type RiotFetch = (url: string, operation: RiotOperation) => Promise<unknown>;
type RiotMatch = ReturnType<typeof riotMatchSchema.parse>;

type GetSimplifiedMatchesParams = {
  puuid: string;
  routingRegion: string;
  start: number;
  count: number;
  riotFetch: RiotFetch;
};

const MATCH_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function getSimplifiedMatches({
  puuid,
  routingRegion,
  start,
  count,
  riotFetch,
}: GetSimplifiedMatchesParams): Promise<{
  matchIds: string[];
  simplifiedMatches: SimplifiedMatch[];
}> {
  const encodedPuuid = encodeURIComponent(puuid);

  const matchIds = parseRiotPayload(
    riotMatchIdsSchema,
    await riotFetch(
      `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodedPuuid}/ids?start=${start}&count=${count}`,
      "match-list"
    ),
    "match-list"
  );

  const matches = await Promise.all(
    matchIds.map(async (matchId) => {
      const singleMatch = await getMatchDetails({
        matchId,
        routingRegion,
        riotFetch,
      });

      const searchedPlayer = singleMatch.info.participants.find(
        (participant) => participant.puuid === puuid
      );

      if (!searchedPlayer) return null;

      return {
        matchId: singleMatch.metadata.matchId,
        duration: singleMatch.info.gameDuration,
        queueId: singleMatch.info.queueId,
        searchedPlayer: simplifyParticipant(searchedPlayer),
        players: singleMatch.info.participants.map(simplifyParticipant),
      };
    })
  );

  const simplifiedMatches = matches.filter(
    (match): match is NonNullable<typeof match> => match !== null
  );

  return { matchIds, simplifiedMatches };
}

async function getMatchDetails({
  matchId,
  routingRegion,
  riotFetch,
}: {
  matchId: string;
  routingRegion: string;
  riotFetch: RiotFetch;
}) {
  const cacheKey = `match:${routingRegion}:${matchId}`;

  const cachedMatch = getFromCache<RiotMatch>(cacheKey);

  if (cachedMatch) {
    return cachedMatch;
  }

  const match = parseRiotPayload(
    riotMatchSchema,
    await riotFetch(
      `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/${encodeURIComponent(
        matchId
      )}`,
      "match-detail"
    ),
    "match-detail"
  );

  setCache(cacheKey, match, MATCH_CACHE_TTL_MS);

  return match;
}

function simplifyParticipant(
  participant: RiotMatch["info"]["participants"][number]
): MatchPlayer {
  return {
    puuid: participant.puuid,
    gameName: participant.riotIdGameName ?? "",
    gameTag: participant.riotIdTagline ?? "",
    champion: participant.championName,
    kills: participant.kills,
    deaths: participant.deaths,
    assists: participant.assists,
    win: participant.win,
    role: participant.teamPosition,
    teamId: participant.teamId,
    cs: participant.totalMinionsKilled + participant.neutralMinionsKilled,
  };
}
