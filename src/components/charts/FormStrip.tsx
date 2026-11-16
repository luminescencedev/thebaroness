import type { MatchSummary } from "@/api";
import { cn } from "@/components/ui";

/** Forme récente : victoire V vert, défaite D rouge, toujours doublé d'une lettre. Du plus récent au plus ancien. */
export function FormStrip({
  matches,
  size = 20,
  compact = false,
}: {
  matches: MatchSummary[];
  size?: number;
  compact?: boolean;
}) {
  const recent = matches.slice(0, size);
  const wins = recent.filter((m) => m.outcome === "win").length;
  return (
    <ul
      className="flex flex-wrap gap-1"
      aria-label={`${wins} victoires et ${recent.length - wins} défaites sur les ${recent.length} dernières parties`}
    >
      {recent.map((m) => (
        <li
          key={m.matchId}
          className={cn(
            "grid place-items-center rounded-md font-semibold",
            compact ? "size-5 text-[10px]" : "size-7 text-xs",
            m.outcome === "win" ? "bg-win/15 text-win" : "bg-loss/15 text-loss",
          )}
        >
          <span aria-hidden="true">{m.outcome === "win" ? "V" : "D"}</span>
          <span className="sr-only">{m.outcome === "win" ? "Victoire" : "Défaite"}</span>
        </li>
      ))}
    </ul>
  );
}
