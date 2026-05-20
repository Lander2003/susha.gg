import { useState } from "react";

import type { PlayerData } from "../App";

type SearchProps = {
  updateData: (newData: PlayerData) => void;
};

export default function Search({ updateData }: SearchProps){
const [gameId, setGameId] = useState("");
// const [tag, setTag] = useState("");
const [region, setRegion] = useState("EUNE");

// useEffect(() => {
//   console.log(ign, region)
// }, [ign, region])


async function handleSubmit(e: React.FormEvent){

    e.preventDefault();

    const parameters = new URLSearchParams({
        gameid: gameId,
        region: region,
    });

    // console.log(paramaters.toString());

    const response = await fetch(`http://localhost:3000/getPlayer?${parameters.toString()}`);
    console.log(`{http://localhost:3000/getPlayer?${parameters.toString()}`)
    const data = await response.json();
    console.log(data);
    updateData(data);
}


    return(
        <div className="searchForm">
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
        </div>
    )
}