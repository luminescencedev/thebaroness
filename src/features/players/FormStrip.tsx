import type { MatchSummary } from "@/api";
import { cn } from "@/components/ui";

/** Les dernières parties d'un coup d'œil. Couleur ET texte pour chaque résultat. */
export function FormStrip({ matches }: { matches: MatchSummary[] }) {
  const recent = matches.slice(0, 20);
  const wins = recent.filter((m) => m.outcome === "win").length;
  return (
    <div>
      <ul className="flex flex-wrap gap-1" aria-label="Résultats des dernières parties">
        {recent.map((m) => (
          <li
            key={m.matchId}
            className={cn(
              "grid size-7 place-items-center rounded-md text-xs font-semibold",
              m.outcome === "win" ? "bg-win/15 text-win" : "bg-loss/15 text-loss",
            )}
          >
            <span aria-hidden="true">{m.outcome === "win" ? "V" : "D"}</span>
            <span className="sr-only">{m.outcome === "win" ? "Victoire" : "Défaite"}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted">
        {wins} victoire{wins > 1 ? "s" : ""} et {recent.length - wins} défaite
        {recent.length - wins > 1 ? "s" : ""} sur les {recent.length} dernières parties disponibles.
      </p>
    </div>
  );
}
