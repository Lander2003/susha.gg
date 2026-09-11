import { useState } from "react";

type SearchProps = {
  searchPlayer: (
    gameName: string,
    gameTag: string,
    region: string
  ) => Promise<void>;
  updateError: (errorMessage: string) => void;
};

export default function Search({ searchPlayer, updateError }: SearchProps){
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

  await searchPlayer(gameName.trim(), gameTag.trim(), region);
}


  return (
    <>
      <div className="search-heading">
        <h1>Search for a player</h1>
        <p>Enter a Riot ID to view ranked stats and recent matches.</p>
      </div>

      <form className="search-controls" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="riot-id">Riot ID</label>
        <input
          id="riot-id"
          type="text"
          value={gameId}
          placeholder="Example: Carnivore#beef"
          autoComplete="off"
          onChange={(e) => setGameId(e.target.value)}
        />

        <label className="sr-only" htmlFor="region">Region</label>
        <select
          id="region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        >
          <option value="EUNE">EUNE</option>
          <option value="EUW">EUW</option>
          <option value="KR">KR</option>
          <option value="BR">BR</option>
          <option value="OCE">OCE</option>
        </select>

        <button type="submit">Search user</button>
      </form>

      <div className="search-features" aria-label="Available player information">
        <span>Ranked solo profile</span>
        <span>Recent match history</span>
        <span>Detailed team results</span>
      </div>
    </>
  );
}
