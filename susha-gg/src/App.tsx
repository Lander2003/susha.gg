import { useState } from 'react'
import Navbar from './components/Navbar'
import Search from './components/Search'
import Content from './components/Content'  

import './App.css'


type SimplifiedMatch = {
  matchId: string;
  champion: string;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  role: string;
  cs: number;
  duration: number;
  queueId: number;
};

export type PlayerData = {
  gameName: string;
  gameTag: string;
  region: string;
  rankedSolo: {
    tier: string;
    rank: string;
    lp: number;
    wins: number;
    losses: number;
    totalGames: number;
  } | null;
  matchIds: string[];
  simplifiedMatches: SimplifiedMatch[];
};

function App() {
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);

 function updateData(newData: PlayerData) {
  setPlayerData(newData);
}


  return (
    <>
    <Navbar />
    <main>
        <Search updateData={updateData} />
        <div className="content-container">
          <Content playerData={playerData} />
        </div>
    </main>
    </>
  )
}

export default App
