import type { AnalyticsMatchMode, AnalyticsPeriod } from "@/api";
import { Segmented } from "@/components/ui";
import type { StatsScope } from "./statsScope";

export function StatsScopeBar({
  scope,
  onPeriod,
  onMode,
  className,
}: {
  scope: StatsScope;
  onPeriod: (p: AnalyticsPeriod) => void;
  onMode: (m: "all" | AnalyticsMatchMode) => void;
  className?: string;
}) {
  return (
    <div className={className ?? "flex flex-wrap items-center gap-2"}>
      <Segmented
        size="sm"
        ariaLabel="Période des statistiques"
        value={scope.period}
        onChange={onPeriod}
        options={[
          { value: "7d", label: "7 jours" },
          { value: "30d", label: "30 jours" },
        ]}
      />
      <Segmented
        size="sm"
        ariaLabel="Type de partie"
        value={scope.matchMode ?? "all"}
        onChange={onMode}
        options={[
          { value: "all", label: "Tous" },
          { value: "ranked", label: "Classée" },
          { value: "unranked", label: "Non classée" },
        ]}
      />
    </div>
  );
}
