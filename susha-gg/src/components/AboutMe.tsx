import profilePicture from "../assets/profile.jpeg";

export default function AboutMe() {
    return (
        <>
            <div className="about-me">
                <img src={profilePicture} alt="" />
                <div>
                     <h1>About Me</h1>
                     <p>I'm a Junior Full-Stack Engineer based in Berlin.</p>
                     <p> As a passion project to challenge myself, I built susha.gg, a full-stack League of Legends statistics application. While giants like OP.GG and similar already rule the rift, building this tool allowed me to master complex state management, data caching, and the Riot Games API.</p>
                     <button className="btn github"><a target="_blank" href="https://github.com/Lander2003">Github</a></button>
                     <button className="btn linkedin"><a target="_blank" href="https://www.linkedin.com/in/luka-susha/">LinkedIn</a></button>
                     <button className="btn donate"><a href="">Buy me a coffee</a></button>
                </div>
            </div>
        </>
    )
}