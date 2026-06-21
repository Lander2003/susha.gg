import { Link } from "react-router-dom";

export default function Footer () {
    return (
      <>
      <div className="footer">
        <p>Made with love by <Link to="/about-me">Luka Susha</Link>, in Berlin</p>
      </div>
      </>
    )
}