import { Link } from "react-router";
import type { MatchSummary } from "@/api";
import { HeroPortrait } from "@/components/media/HeroPortrait";
import { NA, formatDate, formatDecimal, formatDuration, formatInt } from "@/lib/format";

const ratio = (m: MatchSummary) =>
  m.kills === null || m.assists === null || m.deaths === null
    ? NA
    : formatDecimal((m.kills + m.assists) / Math.max(1, m.deaths));

const kda = (m: MatchSummary) =>
  m.kills === null || m.deaths === null || m.assists === null
    ? NA
    : `${m.kills} / ${m.deaths} / ${m.assists}`;

/** Tableau des parties : résultat en toutes lettres, ligne entière cliquable vers le détail. */
export function MatchesTable({ matches }: { matches: MatchSummary[] }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[44rem] border-collapse text-sm">
        <caption className="sr-only">Parties disponibles du joueur</caption>
        <thead>
          <tr className="text-left text-xs text-subtle">
            {["Résultat", "Héros", "K / D / A", "Ratio", "Valeur nette", "Durée", "Date"].map(
              (h) => (
                <th
                  key={h}
                  scope="col"
                  className="border-b border-border px-4 py-2.5 font-medium whitespace-nowrap"
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {matches.map((m) => (
            <tr key={m.matchId} className="group border-b border-white/[0.045] last:border-0">
              <td className="px-4 py-2.5 whitespace-nowrap">
                <span
                  className="flex items-center gap-2"
                  style={{ color: m.outcome === "win" ? "var(--win)" : "var(--loss)" }}
                >
                  <span className="size-[7px] rounded-full bg-current" aria-hidden="true" />
                  {m.outcome === "win" ? "Victoire" : "Défaite"}
                </span>
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap">
                <Link
                  to={`/matches/${m.matchId}`}
                  className="flex items-center gap-2.5 font-medium hover:underline"
                >
                  <HeroPortrait
                    name={m.heroName}
                    src={m.heroImageUrl}
                    rounded="lg"
                    className="size-7"
                  />
                  {m.heroName}
                </Link>
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap text-muted tabular-nums">{kda(m)}</td>
              <td className="px-4 py-2.5 whitespace-nowrap text-muted tabular-nums">{ratio(m)}</td>
              <td className="px-4 py-2.5 whitespace-nowrap text-muted tabular-nums">
                {formatInt(m.netWorth)}
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap text-muted tabular-nums">
                {formatDuration(m.durationSeconds)}
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap text-subtle">
                <time dateTime={m.playedAt}>{formatDate(m.playedAt)}</time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
