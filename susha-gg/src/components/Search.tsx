import { useState, useEffect } from "react";

export default function Search(){
const [ign, setIgn] = useState("");
const [region, setRegion] = useState("EUNE");

// useEffect(() => {
//   console.log(ign, region)
// }, [ign, region])


async function handleSubmit(e: React.FormEvent){

    e.preventDefault();
    const response = await fetch(`http://localhost:3000/getPlayer?ign=${ign}&region=${region}`);
    const data = await response.json();
    console.log(data);
}


    return(
        <div className="searchForm">
           <form onSubmit={handleSubmit} action="">
            <input type="text" 
                   value={ign}
                   onChange={(e) => setIgn(e.target.value)}
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