import type { GroupMemberStats, RankTier } from "@/api";
import { MultiLineChart, type Series } from "@/components/charts";
import { memberColor } from "./colors";
import { scoreLabel } from "./compare";

/**
 * Progression de rang : une courbe par joueur qui a au moins 2 parties classées avec rang connu (scores
 * du back, jamais interpolés). Les autres sont nommés sous le graphique plutôt que silencieusement omis.
 */
export function RankProgress({
  members,
  groupIds,
  ranks,
}: {
  members: GroupMemberStats[];
  groupIds: readonly string[];
  ranks: RankTier[] | undefined;
}) {
  const series: Series[] = members
    .filter((m) => m.rankHistory.length > 1)
    .map((m) => ({
      key: m.steamId,
      label: m.displayName,
      color: memberColor(groupIds, m.steamId),
      points: m.rankHistory.map((p) => ({ at: Date.parse(p.at), value: p.score })),
    }));
  const without = members.filter((m) => m.rankHistory.length < 2).map((m) => m.displayName);

  if (series.length === 0) {
    return (
      <p className="card px-5 py-6 text-[13px] leading-relaxed text-muted">
        Progression insuffisante : aucun joueur n'a au moins 2 parties classées avec rang connu sur
        la période.
      </p>
    );
  }
  return (
    <div className="card p-4">
      <MultiLineChart
        series={series}
        title="Progression de rang de chaque joueur du groupe"
        format={(v) => scoreLabel(Math.round(v), ranks)}
        // Échelle de rang du back : 1 (Obscurus 1) à 72 (Eternus 6). L'axe ne montre jamais de rang inexistant.
        min={1}
        max={72}
      />
      {without.length > 0 && (
        <p className="mt-3 text-[12.5px] text-subtle">
          Sans courbe (moins de 2 parties classées avec rang connu) : {without.join(", ")}.
        </p>
      )}
    </div>
  );
}
