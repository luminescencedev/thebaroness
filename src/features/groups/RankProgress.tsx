import type { GroupMemberStats, RankTier } from "@/api";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { MultiLineChart, type Series } from "@/components/charts";
import { formatDate } from "@/lib/format";
import { memberColor } from "./colors";
import { scoreLabel } from "./compare";

/**
 * Progression de rang : une courbe par joueur qui a au moins 2 parties classées avec rang connu (scores
 * du back, jamais interpolés). Les autres sont nommés sous le graphique plutôt que silencieusement omis.
 * Accès sans souris : flèches sur le graphique, et « Voir les données » (premier et dernier rang observés).
 */
export function RankProgress({
  groupId,
  members,
  groupIds,
  ranks,
}: {
  groupId: string;
  members: GroupMemberStats[];
  groupIds: readonly string[];
  ranks: RankTier[] | undefined;
}) {
  const withCurve = members.filter((m) => m.rankHistory.length > 1);
  const series: Series[] = withCurve.map((m) => ({
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
  const label = (score: number) => scoreLabel(score, ranks);
  const total = withCurve.reduce((n, m) => n + m.rankHistory.length, 0);
  return (
    <ChartFrame
      id={`group-rank-${groupId}`}
      title="Progression de rang"
      subtitle="Rang observé après chaque partie classée"
      summary={`Progression de rang de ${series.length} joueur${series.length > 1 ? "s" : ""} : ${withCurve
        .map((m) => {
          const a = m.rankHistory[0];
          const b = m.rankHistory[m.rankHistory.length - 1];
          return a && b
            ? `${m.displayName}, de ${label(a.score)} à ${label(b.score)}`
            : m.displayName;
        })
        .join(" ; ")}.`}
      points={total}
      minPoints={2}
      table={{
        headers: ["Joueur", "Premier rang observé", "Dernier rang observé", "Observations"],
        rows: withCurve.map((m) => {
          const a = m.rankHistory[0];
          const b = m.rankHistory[m.rankHistory.length - 1];
          return [
            m.displayName,
            a ? `${label(a.score)} (${formatDate(a.at)})` : "n/d",
            b ? `${label(b.score)} (${formatDate(b.at)})` : "n/d",
            m.rankHistory.length,
          ];
        }),
      }}
    >
      <MultiLineChart
        series={series}
        title="Progression de rang de chaque joueur du groupe"
        format={(v) => label(Math.round(v))}
        // Échelle de rang du back : 1 (Obscurus 1) à 72 (Eternus 6). L'axe ne montre jamais de rang inexistant.
        min={1}
        max={72}
      />
      {without.length > 0 && (
        <p className="mt-3 text-[12.5px] text-subtle">
          Sans courbe (moins de 2 parties classées avec rang connu) : {without.join(", ")}.
        </p>
      )}
    </ChartFrame>
  );
}
