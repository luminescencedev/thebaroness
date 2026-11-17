import { useMemo, useState } from "react";
import type { MatchDetail } from "@/api";
import { useItemCatalog } from "@/features/players/hooks";
import { MatchPlayerDetail } from "./MatchPlayerDetail";
import { MatchScoreboard } from "./MatchScoreboard";
import { MatchSummaryHeader } from "./MatchSummaryHeader";
import { MatchTeamComparison } from "./MatchTeamComparison";
import { buildBoard, defaultSelection, type SortKey } from "./model";

/** Page partie : résumé, scoreboard, détail du joueur sélectionné et comparaison des équipes. */
export function MatchDetailView({ match }: { match: MatchDetail }) {
  const teams = useMemo(() => buildBoard(match), [match]);
  const all = useMemo(() => teams.flatMap((t) => t.players), [teams]);
  const [sort, setSort] = useState<SortKey>("net");
  const [picked, setPicked] = useState<string | null>(null);
  const catalog = useItemCatalog().data;

  // Sélection explicite, sinon défaut déterministe (MVP, puis valeur nette, puis premier joueur).
  const key = picked && all.some((b) => b.key === picked) ? picked : defaultSelection(teams);
  const selected = all.find((b) => b.key === key) ?? null;

  return (
    <div className="space-y-4">
      <MatchSummaryHeader match={match} teams={teams} />
      <MatchScoreboard
        match={match}
        teams={teams}
        sort={sort}
        onSort={setSort}
        selected={key}
        onSelect={setPicked}
        catalog={catalog}
      />
      <div className="@container">
        <div className="grid items-start gap-4 @min-[1000px]:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
          <MatchPlayerDetail selected={selected} all={all} catalog={catalog} />
          <MatchTeamComparison teams={teams} />
        </div>
      </div>
    </div>
  );
}
