import type { PlayerData } from "../App";

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

  const response = await fetch(
    `${API_URL}/getPlayer?${parameters.toString()}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Could not fetch player");
  }

  return data;
}