import { useState } from 'react'
import { Routes, Route } from "react-router-dom";
import AboutMe from "./components/AboutMe";
import Navbar from './components/Navbar'
import Search from './components/Search'
import Leaderboard from './components/Leaderboard'
import Content from './components/Content'
import Footer from "./components/Footer";
import type { PlayerData } from "./api/contracts";

import './App.css'


function App() {
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");


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
          <main className={`home-page ${playerData ? "has-results" : "is-empty"}`}>
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
