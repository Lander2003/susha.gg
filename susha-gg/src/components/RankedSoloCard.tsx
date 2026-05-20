import type { PlayerData } from "../App";

type RankedSoloCardProps = {
  rankedSolo: PlayerData["rankedSolo"];
};

export default function RankedSoloCard({ rankedSolo }: RankedSoloCardProps) {
  if (!rankedSolo) {
    return (
      <div className="ranked-card">
        <h2>Ranked Solo/Duo</h2>
        <p>Unranked this season</p>
      </div>
    );
  }

  return (
    <div className="ranked-card">
      <h2>Ranked Solo/Duo</h2>

      <div className="rank-emblem-wrapper">
  <img
    src={`https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem/emblem-${rankedSolo.tier.toLowerCase()}.png`}
    alt={`${rankedSolo.tier} emblem`}
    className="rank-emblem"
  />
</div>
      <h3>
        {rankedSolo.tier} {rankedSolo.rank}
      </h3>
      <p>{rankedSolo.lp} LP</p>
      <p>
        {rankedSolo.wins}W / {rankedSolo.losses}L
      </p>
      <p>Total games: {rankedSolo.totalGames}</p>
    </div>
  );
}