import type { TeamTotalKey } from "@/api";
import { DoubleBezel } from "@/components/ui";
import { NA, formatInt } from "@/lib/format";
import { TEAM_META, teamLabel } from "@/lib/teams";
import { teamTotal, type BoardTeam } from "./model";

const ROWS: { label: string; key: TeamTotalKey }[] = [
  { label: "Souls (valeur nette)", key: "netWorth" },
  { label: "Éliminations", key: "kills" },
  { label: "Dégâts aux héros", key: "playerDamage" },
  { label: "Soins", key: "healing" },
];

/** Comparaison des équipes : totaux du back, nuls dès qu'un joueur n'a pas la valeur (jamais une somme partielle). */
export function MatchTeamComparison({ teams }: { teams: BoardTeam[] }) {
  const [a, b] = teams;
  if (!a || !b) return null;
  return (
    <DoubleBezel as="section" aria-label="Comparaison des équipes" innerClassName="p-4 sm:p-5">
      <h2 className="text-[15px] font-semibold">Comparaison des équipes</h2>
      <p className="mt-0.5 mb-4 text-[11px] text-subtle">
        Totaux de fin de partie, une même échelle par ligne.
      </p>
      <ul className="space-y-4">
        {ROWS.map((r) => {
          const ta = teamTotal(a, r.key);
          const tb = teamTotal(b, r.key);
          const both = ta.complete && tb.complete;
          const sum = both ? (ta.value ?? 0) + (tb.value ?? 0) : 0;
          const pa = sum > 0 ? ((ta.value ?? 0) / sum) * 100 : 50;
          const show = (t: typeof ta) =>
            t.complete ? formatInt(t.value) : `${NA} (${t.known}/${t.of})`;
          return (
            <li key={r.label}>
              <div className="mb-1.5 grid grid-cols-[1fr_auto_1fr] items-baseline gap-2 text-xs">
                <b className="tabular-nums" style={{ color: TEAM_META[a.side].color }}>
                  {show(ta)}
                </b>
                <span className="text-[11px] text-subtle">{r.label}</span>
                <b className="text-right tabular-nums" style={{ color: TEAM_META[b.side].color }}>
                  {show(tb)}
                </b>
              </div>
              {both ? (
                <div
                  role="img"
                  aria-label={`${r.label} : ${teamLabel(a.side)} ${ta.value}, ${teamLabel(b.side)} ${tb.value}`}
                  className="flex h-2 gap-[3px] overflow-hidden rounded-full bg-white/[0.07]"
                >
                  <span
                    style={{ width: `${pa}%`, background: TEAM_META[a.side].color }}
                    className="rounded-full"
                  />
                  <span
                    style={{ width: `${100 - pa}%`, background: TEAM_META[b.side].color }}
                    className="rounded-full"
                  />
                </div>
              ) : (
                <p className="text-[10.5px] text-subtle">
                  Valeurs incomplètes : aucune somme n'est affichée pour éviter un faux total.
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-5 flex gap-4 text-[11px] text-subtle">
        {teams.map((t) => (
          <span key={t.side} className="flex items-center gap-1.5">
            <i className="size-2 rounded-full" style={{ background: TEAM_META[t.side].color }} />
            {teamLabel(t.side)}
          </span>
        ))}
      </div>
    </DoubleBezel>
  );
}
