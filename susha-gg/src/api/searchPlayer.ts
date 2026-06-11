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

  const response = await fetch(
    `http://localhost:3000/getPlayer?${parameters.toString()}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Could not fetch player");
  }

  return data;
}