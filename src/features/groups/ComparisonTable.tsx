import { Link } from "react-router";
import type { GroupMemberStats, RankTier } from "@/api";
import { RankBadge } from "@/components/media/RankBadge";
import { Avatar, cn } from "@/components/ui";
import { rankLabel } from "@/lib/rank";
import { formatDecimal, formatPercent } from "@/lib/format";
import { memberColor } from "./colors";
import { SORTS, isLowSample, positionMembers, type SortKey } from "./compare";

interface ComparisonTableProps {
  members: GroupMemberStats[];
  groupIds: readonly string[];
  sort: SortKey;
  onSort: (key: SortKey) => void;
  /** Seuil de parties sous lequel une proportion est signalée « échantillon faible ». */
  minMatches: number;
  ranks: RankTier[] | undefined;
}

function Rank({ m }: { m: GroupMemberStats }) {
  if (!m.rank) return <span className="text-subtle">Rang n/d</span>;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <RankBadge
        name={m.rank.name}
        imageUrl={m.rank.imageUrl}
        color={m.rank.color}
        className="[&_img]:size-[26px] [&_span]:size-[26px]"
      />
      <span className="text-[13px]">{rankLabel(m.rank.name, m.rank.subrank) ?? m.rank.name}</span>
    </span>
  );
}

function Climb({ delta }: { delta: number | null | undefined }) {
  if (delta === null || delta === undefined) return <span className="text-subtle">n/d</span>;
  if (delta === 0) return <span className="text-muted">Stable</span>;
  const up = delta > 0;
  return (
    <span className={cn("font-medium", up ? "text-win" : "text-loss")}>
      <span aria-hidden="true">{up ? "▲ +" : "▼ "}</span>
      {delta}
      <span className="sr-only">
        {" "}
        sous-rang{Math.abs(delta) > 1 ? "s" : ""}, en {up ? "hausse" : "baisse"}
      </span>
    </span>
  );
}

/** Une proportion avec sa taille d'échantillon : le chiffre seul pourrait tromper (3 parties, 100 %). */
function Sampled({
  value,
  count,
  label,
  low,
}: {
  value: string;
  count: number;
  label: string;
  low: boolean;
}) {
  return (
    <span className="flex flex-col leading-tight">
      <span className={cn(low && "text-warning")}>{value}</span>
      <small className="text-[11.5px] text-subtle">
        {count} {label}
        {low && " · échantillon faible"}
      </small>
    </span>
  );
}

const cols =
  "grid-cols-[30px_minmax(0,1fr)] @[820px]:grid-cols-[34px_minmax(0,1.4fr)_150px_96px_120px_96px_90px]";

/**
 * Classement comparatif du groupe. Tableau sur grand conteneur, lignes à deux niveaux sinon (la sidebar
 * change la largeur utile : container query). La position suit le critère actif, ce n'est pas le rang officiel.
 */
export function ComparisonTable({
  members,
  groupIds,
  sort,
  onSort,
  minMatches,
}: ComparisonTableProps) {
  const rows = positionMembers(members, sort);
  const sortLabel = SORTS.find((s) => s.key === sort)?.label ?? "";
  return (
    <div>
      <div role="group" aria-label="Trier par" className="mb-3 flex flex-wrap gap-1.5">
        {SORTS.map((s) => (
          <button
            key={s.key}
            type="button"
            aria-pressed={sort === s.key}
            onClick={() => onSort(s.key)}
            className={cn(
              "pressable hover-text h-[30px] rounded-full border px-3 text-[13px]",
              sort === s.key
                ? "border-border-strong bg-surface-strong text-text"
                : "border-border text-muted",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="card @container overflow-hidden">
        <div
          aria-hidden="true"
          className={cn(
            "hidden h-[38px] items-center gap-x-2.5 border-b border-divider px-4 text-[11px] font-semibold text-subtle @[820px]:grid",
            cols,
          )}
        >
          <span className="text-center">#</span>
          <span>Joueur</span>
          <span>Rang</span>
          <span>Progression</span>
          <span>Victoires</span>
          <span>Taux</span>
          <span>KDA</span>
        </div>
        <ol aria-label={`Classement du groupe, trié par ${sortLabel.toLowerCase()}`}>
          {rows.map(({ member: m, position, tied }) => {
            const low = isLowSample(m, minMatches);
            const winRate = m.winRate === null ? null : formatPercent(m.winRate);
            return (
              <li
                key={m.steamId}
                className={cn(
                  "grid min-h-[60px] items-center gap-x-2.5 gap-y-1 border-t border-divider px-3.5 py-2.5 first:border-t-0 @[820px]:px-4",
                  cols,
                )}
              >
                <span className="text-center text-base font-semibold text-muted tabular-nums">
                  {position === null ? (
                    <>
                      –<span className="sr-only">Position inconnue</span>
                    </>
                  ) : (
                    <>
                      {tied && (
                        <span className="mr-px text-xs font-medium text-subtle" title="Ex æquo">
                          =<span className="sr-only">Ex æquo, position </span>
                        </span>
                      )}
                      {position}
                    </>
                  )}
                </span>
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: memberColor(groupIds, m.steamId) }}
                    aria-hidden="true"
                  />
                  <Avatar name={m.displayName} src={m.avatarUrl} className="size-9 text-xs" />
                  <Link
                    to={`/players/${m.steamId}`}
                    className="min-w-0 truncate text-[15px] font-medium tracking-[-0.012em] hover:underline"
                  >
                    {m.displayName}
                  </Link>
                </span>
                {/* Grand conteneur : colonnes. */}
                <span className="hidden @[820px]:block">
                  <Rank m={m} />
                </span>
                <span className="hidden @[820px]:block">
                  <Climb delta={m.rankDelta} />
                </span>
                <span className="hidden whitespace-nowrap text-muted @[820px]:block">
                  {m.wins} V / {m.losses} D
                </span>
                <span className="hidden @[820px]:block">
                  {winRate === null ? (
                    <span className="text-subtle">n/d</span>
                  ) : (
                    <Sampled value={winRate} count={m.matches} label="parties" low={low} />
                  )}
                </span>
                <span className="hidden @[820px]:block">
                  {m.kda === null ? (
                    <span className="text-subtle">n/d</span>
                  ) : (
                    <Sampled
                      value={formatDecimal(m.kda)}
                      count={m.kdaSampleSize ?? m.matches}
                      label="parties"
                      low={false}
                    />
                  )}
                </span>
                {/* Petit conteneur : résumé sous le nom, mêmes informations. */}
                <span className="col-start-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted @[820px]:hidden">
                  <Rank m={m} />
                  <Climb delta={m.rankDelta} />
                  <span>
                    {m.wins} V / {m.losses} D
                  </span>
                  <span className={cn(low && winRate !== null && "text-warning")}>
                    {winRate ?? "n/d"} <span className="text-subtle">({m.matches})</span>
                  </span>
                  <span>KDA {m.kda === null ? "n/d" : formatDecimal(m.kda)}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <p className="mt-2.5 text-[12.5px] leading-relaxed text-subtle">
        La position suit le critère choisi : c'est la place dans ce groupe, pas le rang officiel. «
        = » signale des valeurs identiques.
      </p>
    </div>
  );
}
