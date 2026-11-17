import { useMemo } from "react";
import type { MatchSummary } from "@/api";
import { CalendarHeatmap } from "@/components/charts";
import { DoubleBezel } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { calendar } from "@/lib/stats";

/** Activité sur 12 semaines. Les jours antérieurs à la parties chargée la plus ancienne ne sont pas « sans partie » : ils ne sont pas couverts. */
export function ActivityWidget({
  matches,
  capped,
  partial,
  scopeFrom,
}: {
  matches: MatchSummary[];
  capped: boolean;
  partial: boolean;
  /** Début de la période demandée (ISO) : avant cette date, rien n'est couvert. null : sans borne. */
  scopeFrom: string | null;
}) {
  const weeks = useMemo(() => calendar(matches), [matches]);
  const total = weeks.flat().reduce((s, d) => s + d.count, 0);
  const oldest = matches.at(-1)?.playedAt.slice(0, 10);
  const startOfWindow = weeks[0]?.[0]?.date;
  const from = scopeFrom?.slice(0, 10);
  const incomplete =
    capped ||
    partial ||
    from !== undefined ||
    (oldest !== undefined && startOfWindow !== undefined && oldest > startOfWindow);
  return (
    <DoubleBezel size="md" innerClassName="p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[15px]">Activité récente</h2>
        <span className="text-xs text-subtle tabular-nums">{total} parties</span>
      </div>
      <div className="mt-3 overflow-x-auto">
        <CalendarHeatmap weeks={weeks} />
      </div>
      {incomplete && (
        <p className="mt-2 text-[11px] leading-relaxed text-warning">
          {from !== undefined
            ? `Limitée à la période choisie : les jours avant le ${formatDate(`${from}T12:00:00Z`)} ne sont pas couverts, ils ne sont pas « sans partie ».`
            : `Historique partiel : les semaines avant ${oldest ? formatDate(`${oldest}T12:00:00Z`) : "la plus ancienne partie chargée"} peuvent contenir des parties non chargées.`}
        </p>
      )}
    </DoubleBezel>
  );
}
