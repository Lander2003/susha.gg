import { Link } from "react-router-dom";

export default function Footer () {
    return (
      <footer className="footer">
        <div className="footer-inner">
          <p><i>&copy; Copyright 2026</i></p>
          <p>Made with love by <Link to="/about-me">Luka Susha</Link> — Berlin</p>
        </div>
      </footer>
    )
}
