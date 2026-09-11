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
            <p>As a passion project to challenge myself, I built susha.gg, a full-stack League of Legends statistics application. While giants like OP.GG and similar already rule the rift, building this tool allowed me to master complex state management, data caching, and the Riot Games API.</p>
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
