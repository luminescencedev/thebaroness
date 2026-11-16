import type { MatchSummary } from "@/api";
import { cn } from "@/components/ui";
import { NA, formatDate, formatDuration, formatInt } from "@/lib/format";

const kda = (m: MatchSummary) =>
  m.kills === null || m.deaths === null || m.assists === null
    ? NA
    : `${m.kills} / ${m.deaths} / ${m.assists}`;

export function MatchList({ matches }: { matches: MatchSummary[] }) {
  return (
    <ul className="space-y-2">
      {matches.map((m) => (
        <li key={m.matchId} className="card flex flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3">
          <span
            className={cn(
              "w-20 text-sm font-semibold",
              m.outcome === "win" ? "text-win" : "text-loss",
            )}
          >
            {m.outcome === "win" ? "Victoire" : "Défaite"}
          </span>
          <span className="min-w-32 flex-1 font-medium">{m.heroName}</span>
          <span className="text-sm text-muted">
            <span className="sr-only">Éliminations, morts, assistances : </span>
            {kda(m)}
          </span>
          <span className="text-sm text-muted">
            <span className="sr-only">Durée : </span>
            {formatDuration(m.durationSeconds)}
          </span>
          <span className="hidden text-sm text-muted sm:inline">
            <span className="sr-only">Valeur nette : </span>
            {formatInt(m.netWorth)}
          </span>
          <time dateTime={m.playedAt} className="text-sm text-subtle">
            {formatDate(m.playedAt)}
          </time>
        </li>
      ))}
    </ul>
  );
}
