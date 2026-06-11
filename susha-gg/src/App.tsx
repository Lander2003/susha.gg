import { useState } from 'react'
import Navbar from './components/Navbar'
import Search from './components/Search'
import Content from './components/Content'

import './App.css'


type MatchPlayer = {
  puuid: string;
  gameName: string;
  gameTag: string;
  champion: string;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  role: string;
  teamId: number;
  cs: number;
};

type SimplifiedMatch = {
  matchId: string;
  duration: number;
  queueId: number;
  searchedPlayer: MatchPlayer;
  players: MatchPlayer[];
};

export type PlayerData = {
  puuid: string;
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
  pagination: {
    start: number;
    count: number;
    nextStart: number;
    hasMore: boolean;
  };
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
        {!isLoading && playerData && <Content playerData={playerData} updateData={updateData} updateLoadingState={updateLoadingState} />}

      </main>
    </>
  )
}

export default App;
