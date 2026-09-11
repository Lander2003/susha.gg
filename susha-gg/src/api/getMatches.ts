import { fetchApi } from "./client";
import { matchesResponseSchema, type MatchesResponse } from "./contracts";

export async function getMatchesRequest(
  puuid: string,
  region: string,
  start: number,
  count = 5
): Promise<MatchesResponse> {
  const parameters = new URLSearchParams({
    puuid,
    region,
    start: String(start),
    count: String(count),
  });

  const apiUrl = import.meta.env.VITE_API_URL;

  return fetchApi(
    `${apiUrl}/getMatches?${parameters.toString()}`,
    matchesResponseSchema
  );
}
