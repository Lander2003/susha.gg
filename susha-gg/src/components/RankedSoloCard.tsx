import type { PlayerData } from "../api/contracts";

type RankedSoloCardProps = {
  rankedSolo: PlayerData["rankedSolo"];
};

export default function RankedSoloCard({ rankedSolo }: RankedSoloCardProps) {
  if (!rankedSolo) {
    return (
      <div className="ranked-card">
        <span className="section-label">Ranked Solo/Duo</span>
        <div className="unranked-state">
          <h2>Unranked</h2>
          <p>No ranked games this season</p>
        </div>
      </div>
    );
  }

  const winRate = Math.round(
    (rankedSolo.wins / (rankedSolo.wins + rankedSolo.losses)) * 100
  );

  return (
    <div className="ranked-card">
      <span className="section-label">Ranked Solo/Duo</span>

      <div className="rank-emblem-wrapper">
        <img
          src={`https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem/emblem-${rankedSolo.tier.toLowerCase()}.png`}
          alt={`${rankedSolo.tier} emblem`}
          className="rank-emblem"
        />
      </div>

      <div className="rank-heading">
        <h2>{rankedSolo.tier} {rankedSolo.rank}</h2>
        <p>{rankedSolo.lp} LP</p>
      </div>

      <dl className="rank-stats">
        <div><dt>Wins</dt><dd>{rankedSolo.wins}</dd></div>
        <div><dt>Losses</dt><dd>{rankedSolo.losses}</dd></div>
        <div><dt>Win rate</dt><dd>{winRate}%</dd></div>
        <div><dt>Games</dt><dd>{rankedSolo.totalGames}</dd></div>
      </dl>
    </div>
  );
}
