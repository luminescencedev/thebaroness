import { Link } from "react-router";
import { Avatar } from "@/components/ui";
import type { HighlightRow } from "./compare";

/**
 * Faits marquants de la période : une liste dense, pas des cartes. Les gagnants viennent du back (seuils,
 * ex æquo) ; un titre sans gagnant n'est pas affiché.
 */
export function FactsList({ rows }: { rows: HighlightRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-[13px] text-subtle">
        Aucun fait marquant : pas assez de parties sur la période.
      </p>
    );
  }
  return (
    <ul className="card @container overflow-hidden">
      {rows.map((r) => (
        <li
          key={r.id}
          className="grid min-h-[50px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-t border-divider px-4 py-2 first:border-t-0 @[640px]:grid-cols-[170px_minmax(0,1fr)_auto]"
        >
          <span className="col-span-2 text-[12.5px] text-subtle @[640px]:col-span-1">
            {r.title}
          </span>
          <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            {r.members.map((m) => (
              <Link
                key={m.steamId}
                to={`/players/${m.steamId}`}
                className="flex min-w-0 items-center gap-1.5 hover:underline"
              >
                <Avatar name={m.displayName} src={m.avatarUrl} className="size-6 text-[10px]" />
                <span className="truncate text-sm font-medium">{m.displayName}</span>
              </Link>
            ))}
            {r.members.length > 1 && (
              <span className="rounded-full border border-border-strong bg-white/[0.04] px-2 text-[11px] text-muted">
                ex æquo
              </span>
            )}
          </span>
          <span className="text-right">
            <span className="block text-sm font-medium whitespace-nowrap">{r.value}</span>
            {(r.detail || r.minMatches > 0) && (
              <span className="block text-[11px] text-subtle">
                {r.detail ?? `à partir de ${r.minMatches} parties`}
                {r.detail && r.minMatches > 0 ? ` · min. ${r.minMatches}` : ""}
              </span>
            )}
            {r.matchId && (
              <Link
                to={`/matches/${r.matchId}`}
                className="text-[11px] text-accent-text underline underline-offset-4"
              >
                Voir la partie
              </Link>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
