import { NavLink } from "react-router-dom";

export default function Navbar() {
    return (
        <nav className="navbar" aria-label="Primary navigation">
          <div className="navbar-inner">
            <h1>susha.gg</h1>
            <ul className="nav-links">
              <li><NavLink to="/" end>Search</NavLink></li>
              <li><NavLink to="/leaderboard">Leaderboard</NavLink></li>
              <li><NavLink to="/about-me">About Me</NavLink></li>
            </ul>
          </div>
        </nav>
    )
}
