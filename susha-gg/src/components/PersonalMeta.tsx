import { useEffect, useRef, useState } from "react";
import { getPersonalMeta, type MetaReport } from "../api/personalMeta";

const roleName = (role: string | null) => ({ TOP: "Top", JUNGLE: "Jungle", MIDDLE: "Mid", BOTTOM: "Bot", UTILITY: "Support" }[role ?? ""] ?? "Unknown");
const value = (n: number | null, suffix = "") => n === null ? "—" : `${n}${suffix}`;
const assessmentLabel = (assessment: string) => ({
  "Too early to judge": "Not enough games yet",
  "Needs review": "Underperforming",
  "Core candidate": "Strong pick",
  "Promising": "Promising pick",
  "Building evidence": "More games needed",
}[assessment] ?? assessment);
const signalText = (assessment: string, champion: string, games: number, winRate: number | null) => {
  if (assessment === "Promising") return `${champion} is performing well so far (${value(winRate, "%")}), but ${games} games is still a small sample.`;
  if (assessment === "Needs review") return `${champion} is winning less often than your other established picks in this role.`;
  return "";
};
const tabs = ["Overview", "Statistics", "Improvement plan"] as const;
type Tab = typeof tabs[number];
export type MetaLoadStatus = "idle" | "loading" | "partial" | "ready";

const championAssetNames: Record<string, string> = {
  "Bel'Veth": "Belveth", "Cho'Gath": "Chogath", "Kai'Sa": "Kaisa", "Kha'Zix": "Khazix",
  "Kog'Maw": "KogMaw", LeBlanc: "Leblanc", "Nunu & Willump": "Nunu", "Rek'Sai": "RekSai",
  "Renata Glasc": "Renata", "Vel'Koz": "Velkoz", Wukong: "MonkeyKing",
};
const championImage = (champion: string) => {
  const assetName = championAssetNames[champion] ?? champion.replace(/[^a-zA-Z0-9]/g, "");
  return `https://ddragon.leagueoflegends.com/cdn/latest/img/champion/${assetName}.png`;
};

function ChampionPortrait({ champion, className }: { champion: string; className: string }) {
  const [loaded, setLoaded] = useState(false);
  return <span className={`${className} champion-portrait`}>
    <span className="champion-portrait-fallback" aria-hidden="true">{champion.slice(0, 2).toUpperCase()}</span>
    <img className={loaded ? "is-loaded" : ""} src={championImage(champion)} alt={`${champion} portrait`} loading="lazy" onLoad={() => setLoaded(true)} />
  </span>;
}

export default function PersonalMeta({ puuid, region, onStatusChange }: { puuid: string; region: string; onStatusChange?: (status: MetaLoadStatus) => void }) {
  const [report, setReport] = useState<MetaReport | null>(null);
  const [tab, setTab] = useState<Tab>("Overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    onStatusChange?.(loading ? "loading" : !report ? "idle" : report.nextCount !== null ? "partial" : "ready");
  }, [loading, onStatusChange, report]);

  async function analyze() {
    if (loading) return;
    const request = new AbortController();
    controller.current = request;
    setLoading(true);
    setError("");
    try {
      let count: number | null = report?.nextCount ?? 10;
      while (count !== null && !request.signal.aborted) {
        const result = await getPersonalMeta(puuid, region, count, request.signal);
        if (request.signal.aborted) return;
        setReport(result);
        count = result.nextCount;
      }
    } catch (err) {
      if (!request.signal.aborted) setError(err instanceof Error ? err.message : "Could not load analysis.");
    } finally {
      if (!request.signal.aborted) setLoading(false);
    }
  }

  return <section className="personal-meta" aria-labelledby="meta-title">
    <div className="meta-heading">
      <div><span className="section-label">What works best for you</span><h2 id="meta-title">Personal Meta</h2>
        <p>See your strongest champions, your recent performance and what to work on next.</p></div>
      {(!report || report.nextCount !== null) && <button className="load-button" type="button" disabled={loading} onClick={() => void analyze()}>
        {loading ? "Analyzing…" : report ? "Continue analysis" : "Analyze my ranked games"}
      </button>}
    </div>
    <p className="meta-method">Based on up to 50 ranked Solo/Duo games from the last 90 days. Your recent form means your latest 20 valid games. Results appear in batches, so the first analysis may take over a minute.</p>
    {loading && <div role="status" className="meta-loading">
      <div className="meta-loading-copy"><span className="section-label">Analysis in progress</span>
        <h3>{report ? `${report.scanned} of ${report.available} matches checked` : "Finding your recent ranked games"}</h3>
        <p>{report ? "Your current results are ready below. We’re adding the next batch now." : "We’re collecting your match results before comparing champions and recent habits."}</p>
      </div>
      <div className={`meta-progress-track${report ? "" : " is-indeterminate"}`} aria-hidden="true"><span style={report ? { width: `${report.available ? Math.round(report.scanned / report.available * 100) : 0}%` } : undefined} /></div>
      <div className="meta-loading-steps" aria-hidden="true"><span className={report ? "is-done" : "is-active"}>Match history</span><span className={report ? "is-active" : ""}>Champion results</span><span>Recommendations</span></div>
    </div>}
    {error && <p role="alert" className="error-message">{error}</p>}
    {report && <>
      <div className="meta-coverage">{report.overall.games} ranked games analyzed · {report.excluded} skipped · {report.nextCount !== null ? "Still analyzing — conclusions may change" : "Analysis complete"}
        <span>Generated {new Date(report.generatedAt).toLocaleString()} · Patches {report.patches.join(", ") || "—"}</span>
      </div>
      <div className="meta-tabs" aria-label="Analysis views">
        {tabs.map(name => <button key={name} type="button" aria-pressed={tab === name} onClick={() => setTab(name)}>{name}</button>)}
      </div>
      {report.overall.games === 0 ? <p className="meta-empty">No eligible ranked Solo/Duo matches found in this window. Remakes, very short games and early-surrender flags are excluded.</p> : <>
        {tab === "Overview" && <div>
          <div className="meta-direction">{report.pool.length && <ChampionPortrait champion={report.pool[0].champion} className="meta-featured-champion" />}<div><span className="section-label">Main conclusion</span>
            <h3>{report.pool.length ? `${report.pool[0].champion} stands out in ${roleName(report.primaryRole)}` : "There is not enough evidence for a clear best pick yet"}</h3>
            <p>{report.pool.length ? `${report.pool[0].evidence} This makes ${report.pool[0].champion} the clearest champion to prioritize when the role and draft suit it.` : "None of your champion-role combinations currently has both 10 games and strong enough results. Keep playing your familiar picks and check again when the sample is larger."}</p></div>
          </div>
          <div className="meta-pool">{report.pool.map(pick => <article key={`${pick.champion}:${pick.role}`}>
            <ChampionPortrait champion={pick.champion} className="meta-pool-champion" /><div><span className="section-label">{pick.label}</span><h3>{pick.champion}</h3><p>{pick.evidence}</p></div>
          </article>)}</div>
          <h3>Other champions worth noticing</h3>
          <div className="meta-signals">{report.champions.filter(c => ["Promising", "Needs review"].includes(c.assessment)).map(c => <p key={`${c.champion}:${c.role}`}>
            <ChampionPortrait champion={c.champion} className="meta-signal-champion" /><strong>{c.champion} · {roleName(c.role)}</strong><span>{assessmentLabel(c.assessment)} · {c.wins} wins, {c.losses} losses across {c.games} games</span>
            <small>{signalText(c.assessment, c.champion, c.games, c.winRate)}</small>
          </p>)}</div>
          {!report.champions.some(c => ["Promising", "Needs review"].includes(c.assessment)) && <p className="meta-method">No other champion has a clear positive or negative result worth calling out yet.</p>}
        </div>}
        {tab === "Statistics" && <div>
          <dl className="meta-stats">
            <div><dt>Win rate in this analysis</dt><dd>{value(report.overall.winRate, "%")}</dd></div>
            <div><dt>Latest {report.recent.games} games</dt><dd>{value(report.recent.winRate, "%")}</dd></div>
            <div><dt>Earlier {report.previous.games} games</dt><dd>{value(report.previous.winRate, "%")}</dd></div>
            <div><dt>Most-played role</dt><dd>{roleName(report.primaryRole)}</dd></div>
          </dl>
          <div className="meta-table-wrap"><table className="meta-table"><caption>Your results on each champion and role · “latest” covers up to 20 games</caption>
            <thead><tr><th scope="col">Champion / role</th><th scope="col">Games</th><th scope="col">Win rate</th><th scope="col">Recent W/L</th><th scope="col">KDA</th><th scope="col">CS/min</th><th scope="col">KP</th><th scope="col">Assessment</th></tr></thead>
            <tbody>{report.champions.map(c => <tr key={`${c.champion}:${c.role}`}><th scope="row"><span className="meta-table-champion"><ChampionPortrait champion={c.champion} className="meta-table-portrait" /><span>{c.champion}<small>{roleName(c.role)}</small></span></span></th><td>{c.games}</td><td>{value(c.winRate, "%")}</td><td>{c.recent.games ? `${c.recent.wins}W / ${c.recent.losses}L` : "—"}</td><td>{value(c.kda)}</td><td>{value(c.csPerMinute)}</td><td>{value(c.killParticipation, "%")}</td><td>{assessmentLabel(c.assessment)}</td></tr>)}</tbody>
          </table></div>
          <div className="meta-table-wrap"><table className="meta-table"><caption>Your results in each role</caption>
            <thead><tr><th scope="col">Role</th><th scope="col">Games</th><th scope="col">Win rate</th><th scope="col">Deaths/game</th><th scope="col">CS/min</th><th scope="col">Vision/min</th><th scope="col">Damage/min</th><th scope="col">Gold/min</th></tr></thead>
            <tbody>{report.roles.map(r => <tr key={r.role}><th scope="row">{roleName(r.role)}</th><td>{r.games}</td><td>{value(r.winRate, "%")}</td><td>{value(r.deathsPerGame)}</td><td>{value(r.csPerMinute)}</td><td>{value(r.visionPerMinute)}</td><td>{value(r.damagePerMinute)}</td><td>{value(r.goldPerMinute)}</td></tr>)}</tbody>
          </table></div>
          <p className="meta-method">KDA combines your kills and assists for every death. KP is the percentage of your team's kills you helped secure. A dash means the value was unavailable. These numbers cover only the games analyzed here, not your full season.</p>
        </div>}
        {tab === "Improvement plan" && <ol className="meta-plan">{report.insights.map(tip => <li key={tip.title}><h3>{tip.title}</h3><p className="meta-evidence">{tip.evidence}</p><p>{tip.action}</p></li>)}</ol>}
      </>}
      <details className="meta-rules"><summary>How we decide what to recommend</summary>
        <p>This analysis uses fixed rules, not generative AI. It judges each champion separately in each role, because playing the same champion in two roles can produce very different results.</p>
        <p>A strong pick needs at least 10 games and consistently positive results. A promising pick has positive early results across 5–9 games, but needs more games before it can become a confident recommendation. An underperforming pick needs at least 10 games and must be clearly behind your other champions in the same role.</p>
        <p>We reduce the influence of very small samples when comparing picks, so a champion that won two games does not automatically outrank one that performed well across twenty. Farming and death tips only appear when we can compare at least five recent games with five earlier games on the same champion and role. These results show patterns in your match history; they cannot prove why you won or lost, and they do not guarantee future results.</p>
      </details>
    </>}
  </section>;
}
