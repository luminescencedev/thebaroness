import type { PlayerStats } from "@/api";
import { formatDecimal, formatInt, formatPercent } from "@/lib/format";
import { cn } from "@/components/ui";

function Stat({ label, value, tone }: { label: string; value: string; tone?: "win" | "loss" }) {
  return (
    <div className="card p-4">
      <dt className="text-xs text-subtle">{label}</dt>
      <dd
        className={cn(
          "mt-1 text-2xl font-semibold tracking-[-0.03em]",
          tone === "win" && "text-win",
          tone === "loss" && "text-loss",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export function StatsGrid({ stats }: { stats: PlayerStats }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat label="Parties disponibles" value={formatInt(stats.matchesPlayed)} />
      <Stat label="Victoires" value={formatInt(stats.wins)} tone="win" />
      <Stat label="Défaites" value={formatInt(stats.losses)} tone="loss" />
      <Stat label="Taux de victoire" value={formatPercent(stats.winRate)} />
      <Stat label="KDA" value={formatDecimal(stats.kda)} />
      <Stat label="Éliminations" value={formatInt(stats.kills)} />
      <Stat label="Morts" value={formatInt(stats.deaths)} />
      <Stat label="Assistances" value={formatInt(stats.assists)} />
    </dl>
  );
}
