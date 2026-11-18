import { Link } from "react-router";
import type { GroupMemberStats } from "@/api";
import { HeroPortrait } from "@/components/media/HeroPortrait";
import { formatDecimal } from "@/lib/format";
import { sortMembers } from "./compare";

/** Meilleure partie de chaque joueur (par KDA, valeur du back) : une liste, un lien vers le détail de la partie. */
export function BestMatches({ members }: { members: GroupMemberStats[] }) {
  const rows = sortMembers(members, "kda").filter((m) => m.bestMatch !== null);
  if (rows.length === 0) {
    return (
      <p className="text-[13px] text-subtle">
        Aucune partie avec kills, morts et assistances connus sur la période.
      </p>
    );
  }
  return (
    <ul className="card overflow-hidden">
      {rows.map((m) => {
        const b = m.bestMatch;
        if (!b) return null;
        return (
          <li key={m.steamId} className="border-t border-divider first:border-t-0">
            <Link
              to={`/matches/${b.matchId}`}
              className="row-link flex min-h-[60px] items-center gap-3 px-4 py-2"
            >
              <HeroPortrait
                name={b.heroName}
                src={b.heroImageUrl}
                rounded="full"
                className="size-10"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">{m.displayName}</span>
                <span className="block truncate text-[13px] text-muted">
                  {b.heroName} · {b.kills} / {b.deaths} / {b.assists}
                </span>
              </span>
              <span className="text-right">
                <span className="block text-[17px] font-semibold tracking-[-0.03em]">
                  {formatDecimal(b.kda)}
                </span>
                <span className="block text-[11px] text-subtle">KDA</span>
              </span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="row-chevron size-3.5 shrink-0 text-subtle"
              >
                <path
                  d="m9 6 6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
