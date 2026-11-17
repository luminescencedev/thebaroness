import { useMemo } from "react";
import { CalendarHeatmap } from "@/components/charts";
import { DoubleBezel, Skeleton } from "@/components/ui";
import type { usePlayerActivity } from "@/features/players/hooks";
import { calendarFromDays } from "@/lib/stats";

/**
 * Activité sur 12 semaines (jours UTC) calculée par le back sur l'historique complet : un jour à 0 est un
 * vrai jour sans partie. Suit le format et le type du scope, pas sa période (toujours 12 semaines).
 */
export function ActivityWidget({
  activity,
  scopeText,
}: {
  activity: ReturnType<typeof usePlayerActivity>;
  scopeText: string;
}) {
  const data = activity.data;
  const weeks = useMemo(() => (data ? calendarFromDays(data.days, data.weeks) : null), [data]);
  return (
    <DoubleBezel size="md" innerClassName="p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[15px]">Activité récente</h2>
        {data && (
          <span className="text-xs text-subtle tabular-nums">{data.summary.matches} parties</span>
        )}
      </div>
      {activity.isPending ? (
        <Skeleton className="mt-3 h-[150px] rounded-xl" aria-busy="true" />
      ) : activity.isError || !weeks || !data ? (
        <p className="mt-3 text-sm text-subtle">Activité indisponible pour le moment.</p>
      ) : (
        <>
          <div className="mt-3 overflow-x-auto">
            <CalendarHeatmap weeks={weeks} />
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-subtle">
            12 semaines, jours en UTC{scopeText ? ` · ${scopeText}` : ""}. {data.summary.activeDays}{" "}
            jour{data.summary.activeDays > 1 ? "s" : ""} actif
            {data.summary.activeDays > 1 ? "s" : ""}.
          </p>
          {data.coverage.excludedUnknownMode > 0 && (
            <p className="mt-1 text-[11px] leading-relaxed text-warning">
              {data.coverage.excludedUnknownMode} partie
              {data.coverage.excludedUnknownMode > 1 ? "s" : ""} au mode inconnu écartée
              {data.coverage.excludedUnknownMode > 1 ? "s" : ""} par ce filtre.
            </p>
          )}
        </>
      )}
    </DoubleBezel>
  );
}
