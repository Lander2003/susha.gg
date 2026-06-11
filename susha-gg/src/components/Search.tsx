import { useState } from "react";
import { searchPlayerRequest } from "../api/searchPlayer";

import type { PlayerData } from "../App";

type SearchProps = {
  updateData: (newData: PlayerData) => void;
  updateLoadingState: (loadingState: boolean) => void;
  updateError: (errorMessage: string) => void;
};

export default function Search({ updateData, updateLoadingState, updateError }: SearchProps){
const [gameId, setGameId] = useState("");
// const [tag, setTag] = useState("");
const [region, setRegion] = useState("EUNE");

// useEffect(() => {
//   console.log(ign, region)
// }, [ign, region])


async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  updateError("");

  if (gameId.trim() === "") {
    updateError(
      "Form is empty. Enter a Riot ID such as Carnivore#Beef."
    );
    return;
  }

  const parts = gameId.split("#");

  if (parts.length !== 2) {
    updateError("Invalid Riot ID. Use the format Name#Tag.");
    return;
  }

  const [gameName, gameTag] = parts;

  if (!gameName.trim() || !gameTag.trim()) {
    updateError("Invalid Riot ID. Use the format Name#Tag.");
    return;
  }

  updateLoadingState(true);

  try {
    const data = await searchPlayerRequest(
      gameName.trim(),
      gameTag.trim(),
      region
    );

    updateData(data);
  } catch (error) {
    updateError(
      error instanceof Error
        ? error.message
        : "Something went wrong while fetching the player."
    );
  } finally {
    updateLoadingState(false);
  }
}


    return(
        <>
           <h1>Search for a player</h1>
           <form onSubmit={handleSubmit} action="">
            <input type="text" 
                   value={gameId}
                   placeholder="Example: Carnivore#beef"
                   onChange={(e) => setGameId(e.target.value)}
            />
            <select name="" id="" value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="EUNE">EUNE</option>
              <option value="EUW">EUW</option>
              <option value="KR">KR</option>
              <option value="BR">BR</option>
              <option value="OCE">OCE</option>
            </select>
            <button type="submit">Search user</button>
           </form>
        </>
    )
}