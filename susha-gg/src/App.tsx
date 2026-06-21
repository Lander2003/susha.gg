import { useState } from 'react'
import { Routes, Route } from "react-router-dom";
import AboutMe from "./components/AboutMe";
import Navbar from './components/Navbar'
import Search from './components/Search'
import Leaderboard from './components/Leaderboard'
import Content from './components/Content'
import Footer from "./components/Footer";

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
  <div className="page-wrapper">
    <Navbar />

    <Routes>
      <Route
        path="/"
        element={
          <main>
            <div className="searchForm">
              <Search
                updateData={updateData}
                updateLoadingState={updateLoadingState}
                updateError={setErrorMessage}
              />
              {error && <p className="error-message">{error}</p>}
            </div>

            {isLoading && <div className="loader"></div>}

            {!isLoading && playerData && (
              <Content
                playerData={playerData}
                updateData={updateData}
                updateLoadingState={updateLoadingState}
              />
            )}
          </main>
        }
      />

      <Route path="/leaderboard" element={
        <Leaderboard />} />
      

    <Route path="/about-me" element={
        <AboutMe />} />
    </Routes>

    <Footer />
  </div>
);
}

export default App;
