type RiotFetch = (url: string) => Promise<any>;

type GetSimplifiedMatchesParams = {
  puuid: string;
  routingRegion: string;
  start: number;
  count: number;
  riotFetch: RiotFetch;
};

export async function getSimplifiedMatches({
  puuid,
  routingRegion,
  start,
  count,
  riotFetch,
}: GetSimplifiedMatchesParams) {
  const encodedPuuid = encodeURIComponent(puuid);

  const matchIds: string[] = await riotFetch(
    `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodedPuuid}/ids?start=${start}&count=${count}`
  );

  const matches = await Promise.all(
    matchIds.map(async (matchId) => {
      const singleMatch = await riotFetch(
        `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/${encodeURIComponent(
          matchId
        )}`
      );

      const searchedPlayer = singleMatch.info.participants.find(
        (participant: any) => participant.puuid === puuid
      );

      if (!searchedPlayer) {
        return null;
      }

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

  return {
    matchIds,
    simplifiedMatches,
  };
}

function simplifyParticipant(participant: any) {
  return {
    puuid: participant.puuid,
    gameName: participant.riotIdGameName,
    gameTag: participant.riotIdTagline,
    champion: participant.championName,
    kills: participant.kills,
    deaths: participant.deaths,
    assists: participant.assists,
    win: participant.win,
    role: participant.teamPosition,
    teamId: participant.teamId,
    cs:
      participant.totalMinionsKilled +
      participant.neutralMinionsKilled,
  };
}