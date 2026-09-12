import { useRef, useState } from 'react'
import { Routes, Route, useNavigate } from "react-router-dom";
import AboutMe from "./components/AboutMe";
import Navbar from './components/Navbar'
import Search from './components/Search'
import Leaderboard from './components/Leaderboard'
import Content from './components/Content'
import Footer from "./components/Footer";
import type { PlayerData } from "./api/contracts";
import { searchPlayerRequest } from "./api/searchPlayer";

import './App.css'


function App() {
  const navigate = useNavigate();
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const latestSearchId = useRef(0);


  function updateData(newData: PlayerData) {
    setPlayerData(newData);
  }

  function setErrorMessage(errorMessage: string) {
    setError(errorMessage);
  }

  async function searchPlayer(
    gameName: string,
    gameTag: string,
    region: string
  ) {
    const searchId = latestSearchId.current + 1;
    latestSearchId.current = searchId;

    setError("");
    setPlayerData(null);
    setIsLoading(true);
    navigate("/");

    try {
      const data = await searchPlayerRequest(gameName, gameTag, region);

      if (latestSearchId.current === searchId) {
        setPlayerData(data);
      }
    } catch (error) {
      if (latestSearchId.current === searchId) {
        setError(
          error instanceof Error
            ? error.message
            : "Something went wrong while fetching the player."
        );
      }
    } finally {
      if (latestSearchId.current === searchId) {
        setIsLoading(false);
      }
    }
  }


   return (
  <div className="page-wrapper">
    <Navbar />
    <p style={{
      color: "red",
      margin: "30px auto",
      width: "fit-content",
      backgroundColor: "#ffc1c1",
      border: "1px solid red",
      padding: "15px 20px"
      }}>SUSHA.GG is temporarily unavailable while Riot Production ready API access is being finalized!</p>
    <Routes>
      <Route
        path="/"
        element={
          <main className={`home-page ${playerData ? "has-results" : "is-empty"}`}>
            <div className="searchForm">
              <Search
                searchPlayer={searchPlayer}
                updateError={setErrorMessage}
              />
              {error && <p className="error-message">{error}</p>}
            </div>

            {isLoading && <div className="loader"></div>}

            {!isLoading && playerData && (
              <Content
                key={`${playerData.region}:${playerData.puuid}`}
                playerData={playerData}
                updateData={updateData}
                searchPlayer={searchPlayer}
              />
            )}
          </main>
        }
      />

      <Route path="/leaderboard" element={
        <Leaderboard searchPlayer={searchPlayer} />} />
      

    <Route path="/about-me" element={
        <AboutMe />} />
    </Routes>

    <Footer />
  </div>
);
}

export default App;
