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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");


  function updateData(newData: PlayerData) {
    setPlayerData(newData);
  }

  function updateLoadingState(loadingState: boolean) {
    setIsLoading(loadingState);
  }

  function setErrorMessage(errorMessage: string) {
    setError(errorMessage);
  }


  return (
    <>
      <Navbar />
      <main>
        <div className="searchForm">

          <Search updateData={updateData} updateLoadingState={updateLoadingState} updateError={setErrorMessage} />
          {error && <p className="error-message">{error}</p>}
        </div>

        {isLoading && <div className="loader"></div>}
        {!isLoading && playerData && <Content playerData={playerData} />}

      </main>
    </>
  )
}

export default App;
