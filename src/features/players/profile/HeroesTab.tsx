import { Link } from "react-router";
import type { HeroSummary } from "@/api";
import { DeltaChip, RadialGauge } from "@/components/charts";
import { HeroPortrait } from "@/components/media/HeroPortrait";
import { EmptyState } from "@/components/ui";
import { formatDecimal, formatPercent } from "@/lib/format";
import type { HeroRow } from "@/lib/stats";

/** Une carte par héros joué, aux couleurs du héros : anneau de taux, bilan, KDA, écart face à la méta. */
export function HeroesTab({
  rows,
  heroById,
}: {
  rows: HeroRow[];
  heroById: Map<number, HeroSummary>;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="Aucun héros"
        description="Aucune partie disponible pour établir les héros joués."
      />
    );
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((h) => {
        const hero = heroById.get(h.heroId);
        return (
          <li key={h.heroId}>
            <Link
              to={`/heroes/${h.heroId}`}
              className="pressable card-hero flex items-center gap-4 p-5 hover:brightness-110"
              style={{ ["--hc" as string]: hero?.color ?? "var(--accent)" }}
            >
              <HeroPortrait
                name={h.heroName}
                src={hero?.images.card ?? h.heroImageUrl}
                color={hero?.color}
                rounded="xl"
                className="size-16"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{h.heroName}</p>
                <p className="text-xs text-muted tabular-nums">
                  {h.matches} parties · {h.wins} V {h.matches - h.wins} D
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <DeltaChip value={h.delta} unit=" pts" threshold={0.5} context="face à la méta" />
                  <span className="text-xs text-subtle tabular-nums">
                    KDA {formatDecimal(h.kda)}
                  </span>
                </div>
                {h.few && (
                  <p className="mt-1.5 text-[11px] text-subtle">
                    Peu de parties : écart peu fiable.
                  </p>
                )}
              </div>
              <RadialGauge
                value={h.winRate}
                mark={h.metaWinRate ?? 50}
                size={64}
                label={`Taux de victoire ${formatPercent(h.winRate)}`}
                color={hero?.color ?? "var(--win)"}
              >
                <span className="text-xs font-semibold tabular-nums">
                  {h.winRate === null ? "n/d" : `${Math.round(h.winRate)}`}
                </span>
              </RadialGauge>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
