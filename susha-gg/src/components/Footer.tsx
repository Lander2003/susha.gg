import { Link } from "react-router-dom";

export default function Footer () {
    return (
      <>
      <div className="footer">
        <p><i>&copy; Copyright 2026</i> - Made with love by <Link to="/about-me">Luka Susha</Link> - Berlin</p>
      </div>
      </>
    )
}