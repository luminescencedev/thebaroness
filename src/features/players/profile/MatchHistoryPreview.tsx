import type { HeroSummary, MatchSummary } from "@/api";
import { Button, DoubleBezel } from "@/components/ui";
import { MatchRow } from "./MatchRow";

/** Les 5 dernières parties, lignes compactes. Le détail s'ouvre sur demande. */
export function MatchHistoryPreview({
  matches,
  heroById,
  ownerSteamId,
  onSeeAll,
}: {
  matches: MatchSummary[];
  heroById: Map<number, HeroSummary>;
  ownerSteamId?: string;
  onSeeAll: () => void;
}) {
  return (
    <DoubleBezel size="lg" innerClassName="p-0">
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <h2 className="text-[15px]">Dernières parties</h2>
        <Button variant="ghost" size="sm" onClick={onSeeAll}>
          Voir toutes les parties
        </Button>
      </div>
      <ul aria-label="Dernières parties">
        {matches.slice(0, 5).map((m) => (
          <MatchRow key={m.matchId} match={m} heroById={heroById} ownerSteamId={ownerSteamId} />
        ))}
      </ul>
    </DoubleBezel>
  );
}
