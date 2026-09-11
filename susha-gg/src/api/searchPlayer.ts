import { fetchApi } from "./client";
import { playerResponseSchema, type PlayerData } from "./contracts";

export async function searchPlayerRequest(
  gameName: string,
  gameTag: string,
  region: string
): Promise<PlayerData> {
  const parameters = new URLSearchParams({
    gameid: `${gameName}#${gameTag}`,
    region,
  });

  const API_URL = import.meta.env.VITE_API_URL;

  return fetchApi(
    `${API_URL}/getPlayer?${parameters.toString()}`,
    playerResponseSchema
  );
}
