import { Link } from "react-router-dom";

export default function Navbar() {
    return (
        <nav className="navbar">
            <h1>susha.gg</h1>
            <ul className="nav-links">
                <li><Link to="/">Search</Link></li>
                <li><Link to="/leaderboard">Leaderboard</Link></li>
               <li><Link to="/about-me">About Me</Link></li>
            </ul>
        </nav>
    )
}