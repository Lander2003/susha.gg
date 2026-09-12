import profilePicture from "../assets/profile.jpeg";
import masterPromotion from "../assets/master-tier-zed.png";

export default function AboutMe() {
  return (
    <main className="about-page">
      <article className="about-me">
        <section className="about-intro" aria-labelledby="about-title">
          <div className="about-portrait-frame">
            <img className="about-portrait" src={profilePicture} alt="Luka Susha" />
          </div>

          <div className="about-intro-copy">
            <span className="section-label">Behind SUSHA.GG</span>
            <h1 id="about-title">Developer, player, builder.</h1>
            <p className="about-lead">I’m Luka, a full-stack engineer based in Berlin and a Master-tier Zed player.</p>
            <p>
              Engineering and League of Legends appeal to me for many of the same reasons: both are complex, constantly evolving and reward the patience to understand how every part works together. I enjoy turning that complexity into something clearer—whether I am solving a technical problem or reviewing a difficult game.
            </p>
            <p>
              SUSHA.GG brings those two sides of me together. It combines my experience as a competitive player with my work as an engineer, using React, Express, live Riot data, validation, caching and testing to create ranked insights that are useful, readable and built for players.
            </p>

            <ul className="about-facts" aria-label="About Luka">
              <li><span>Based in</span><strong>Berlin</strong></li>
              <li><span>Peak rank</span><strong>Master</strong></li>
              <li><span>Main champion</span><strong>Zed</strong></li>
            </ul>

            <div className="about-actions">
              <a className="btn github" target="_blank" rel="noreferrer" href="https://github.com/Lander2003">GitHub</a>
              <a className="btn linkedin" target="_blank" rel="noreferrer" href="https://www.linkedin.com/in/luka-susha/">Connect on LinkedIn</a>
              <a className="btn donate" href="">Buy me a coffee</a>
            </div>
          </div>
        </section>

        <section className="about-player-story" aria-labelledby="player-story-title">
          <figure className="about-achievement">
            <img src={masterPromotion} alt="TrueLander12 promoted to Master in Ranked Solo/Duo" />
            <figcaption>Promoted to Master · Ranked Solo/Duo</figcaption>
          </figure>

          <div className="about-story-copy">
            <span className="section-label">Player and teammate</span>
            <h2 id="player-story-title">Individual skill, shared result.</h2>
            <p className="about-story-lead">Reaching Master is an individual accomplishment, but League is still five people solving a fast moving problem together.</p>
            <p>
              Even in <b>solo queue</b>, playing well means more than winning your own lane. It means understanding your role within that game, reading what your teammates need, adapting when the original plan no longer works and making decisions that give the whole team a better chance to succeed.
            </p>
            <p>
              I bring that same mindset to engineering, taking full ownership of my part, communicating clearly, learning honestly from mistakes and working towards the result the team is trying to achieve. SUSHA.GG reflects both perspectives, a product shaped by how I think as an engineer and also how I learn as a player.
            </p>
          </div>
        </section>
      </article>
    </main>
  );
}
