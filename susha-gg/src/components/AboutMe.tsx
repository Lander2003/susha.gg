import profilePicture from "../assets/profile.jpeg";

export default function AboutMe() {
    return (
      <main className="about-page">
        <section className="about-me">
          <img src={profilePicture} alt="Luka Susha" />
          <div>
            <span className="section-label">Behind susha.gg</span>
            <h1>About Me</h1>
            <p className="about-lead"><b>I'm a Full-Stack Engineer based in Berlin</b></p>
            <p>SUSHA.GG is a League of Legends statistics platform I built to explore full-stack product development with live game data. It combines a React frontend with an Express API, Riot Games data, caching, and ranked-match insights—while keeping the experience focused and fast.</p>
            <div className="about-actions">
              <a className="btn github" target="_blank" rel="noreferrer" href="https://github.com/Lander2003">Github</a>
              <a className="btn linkedin" target="_blank" rel="noreferrer" href="https://www.linkedin.com/in/luka-susha/">LinkedIn</a>
              <a className="btn donate" href="">Buy me a coffee</a>
            </div>
          </div>
        </section>
      </main>
    )
}
