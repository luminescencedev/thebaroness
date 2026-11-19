import type { PlayerProfile } from "@/api";
import { RankBadge } from "@/components/media/RankBadge";
import { DoubleBezel, Skeleton } from "@/components/ui";
import { formatPercent } from "@/lib/format";
import { modeComboLabel } from "@/lib/modes";
import { rankLabel } from "@/lib/rank";
import { AreaChart, type AreaPoint } from "@/components/charts";
import { useRanks } from "@/features/heroes/hooks";
import type { usePlayerOverview, usePlayerRankHistory } from "@/features/players/hooks";
import { formatDate } from "@/lib/format";
import { ROMAN } from "@/lib/stats";
import { decodeRankScore } from "@/lib/rank";
import { periodLong } from "./scopeText";
import type { ProfileScope } from "@/api";

/** Progression observée sur de vraies parties classées : un point par partie dont la source donne le badge. */
function RankProgress({ history }: { history: ReturnType<typeof usePlayerRankHistory> }) {
  const ranks = useRanks();
  if (history.isPending || history.isError || !history.data) return null;
  const { points, coverage } = history.data;
  const nameOf = (score: number) => {
    const s = Math.round(score);
    const { tier, subrank: sub } = decodeRankScore(s);
    const base = ranks.data?.items.find((r) => r.tier === tier)?.name;
    return base ? `${base} ${ROMAN[sub] ?? sub}` : String(s);
  };
  // Deux saisons classées ne sont pas comparables (la source recalcule les rangs) : un point vide entre elles
  // interrompt la courbe, qui n'est jamais reliée d'une saison à l'autre.
  const chart: AreaPoint[] = points.flatMap((p, i) => {
    const point: AreaPoint = {
      value: p.score,
      title: p.name,
      lines: [formatDate(p.at), p.outcome === "win" ? "Victoire" : "Défaite"],
    };
    const prev = points[i - 1];
    const cut =
      prev !== undefined && prev.season != null && p.season != null && prev.season !== p.season;
    return cut
      ? [{ value: null, title: "Changement de saison classée", lines: [] }, point]
      : [point];
  });
  const crossesSeasons = chart.some((p) => p.value === null);
  const seasonNote = (() => {
    const later = (history.data.seasons ?? []).slice(1);
    const when = later[0] ? formatDate(later[0].startedAt) : null;
    return `Changement de saison classée${when ? ` le ${when}` : ""} : la source recalcule les rangs, deux saisons ne sont pas comparables. La courbe est coupée.`;
  })();
  const scores = points.map((p) => p.score);
  // Bornes entières, étendue multiple de 4 : les 5 graduations tombent sur des rangs distincts.
  const lo = Math.min(...scores) - 1;
  const span = Math.max(4, Math.ceil((Math.max(...scores) + 1 - lo) / 4) * 4);
  const hi = lo + span;
  return (
    <div className="mt-4 border-t border-divider pt-3">
      <p className="text-xs text-subtle">Progression du rang classé</p>
      {points.length < 2 ? (
        <p className="mt-1.5 text-xs text-subtle">
          {coverage.rankedMatches === 0
            ? "Aucune partie classée sur cette période."
            : `Pas assez de parties classées avec badge connu (${points.length} sur ${coverage.rankedMatches}).`}
        </p>
      ) : (
        <div className="mt-2">
          <AreaChart
            points={chart}
            format={nameOf}
            ariaLabel={`Rang classé sur ${points.length} parties, de ${nameOf(scores[0] ?? 0)} à ${nameOf(scores[scores.length - 1] ?? 0)}`}
            min={lo}
            max={hi}
            height={96}
          />
          <p className="mt-1.5 text-[11px] leading-relaxed text-subtle">
            {points.length} partie{points.length > 1 ? "s" : ""} classée
            {points.length > 1 ? "s" : ""} avec badge connu sur {coverage.rankedMatches}
            {coverage.missingBadge > 0 ? ` (${coverage.missingBadge} sans badge, non tracées)` : ""}
            . Aucun MMR : seulement le rang observé.
          </p>
          {crossesSeasons && (
            <p className="mt-1 text-[11px] leading-relaxed text-subtle">{seasonNote}</p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Rang officiel (indépendant des filtres) et bilan par combinaison format x type, calculé par le back
 * pour le périmètre choisi.
 */
export function RankModesWidget({
  profile,
  overview,
  scope,
  rankHistory,
}: {
  profile: PlayerProfile;
  overview: ReturnType<typeof usePlayerOverview>;
  scope: ProfileScope;
  rankHistory: ReturnType<typeof usePlayerRankHistory>;
}) {
  const { rank } = profile;
  const label = rankLabel(rank.name, rank.subrank);
  const data = overview.data;
  return (
    <DoubleBezel size="md" innerClassName="p-4">
      <h2 className="text-[15px]">Rang et modes</h2>
      <div className="mt-3 flex items-center gap-3">
        {label ? (
          <>
            <RankBadge name={label} imageUrl={rank.imageUrl} size="lg" />
            <div>
              <p className="text-xs text-subtle">Rang classé actuel</p>
              <p
                className="text-lg font-semibold tracking-[-0.03em]"
                style={{ color: rank.color ?? undefined }}
              >
                {label}
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted">Aucun rang classé connu.</p>
        )}
      </div>

      {overview.isPending ? (
        <div className="mt-4 space-y-3" aria-busy="true" aria-label="Chargement des modes">
          <Skeleton className="h-9 rounded-lg" />
          <Skeleton className="h-9 rounded-lg" />
        </div>
      ) : overview.isError || !data ? (
        <p className="mt-4 text-xs text-subtle">Bilan par mode indisponible pour le moment.</p>
      ) : data.modes.length === 0 ? (
        <p className="mt-4 text-xs text-subtle">
          Aucune partie à mode connu sur les {periodLong(scope)}.
        </p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {data.modes.map((r) => {
            const name = modeComboLabel(r.gameMode, r.matchMode);
            return (
              <li key={`${r.gameMode}|${r.matchMode}`} className="text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-text">{name}</span>
                  <span className="text-xs text-muted tabular-nums">
                    {r.wins} V · {r.losses} D · {formatPercent(r.winRate)}
                  </span>
                </div>
                <div
                  className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.07]"
                  role="img"
                  aria-label={`${name} : ${r.matches} parties, ${formatPercent(r.winRate)} de victoires`}
                >
                  <span
                    className="block h-full rounded-full bg-win"
                    style={{ width: `${r.winRate}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <RankProgress history={rankHistory} />
      {data && (
        <p className="mt-3 text-[11px] leading-relaxed text-subtle">
          {periodLong(scope)} : {data.coverage.includedMatches} partie
          {data.coverage.includedMatches > 1 ? "s" : ""}. Le rang ne dépend pas de ce filtre.
        </p>
      )}
    </DoubleBezel>
  );
}
