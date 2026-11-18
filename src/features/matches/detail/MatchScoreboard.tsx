import { Link } from "react-router";
import type { CatalogItem, MatchItem } from "@/api";
import { BuildGrid } from "@/features/players/profile/MatchBuild";
import { HeroPortrait } from "@/components/media/HeroPortrait";
import { DoubleBezel, Segmented, cn } from "@/components/ui";
import { NA, formatCompact, formatDecimal, formatInt } from "@/lib/format";
import { TEAM_META } from "@/lib/teams";
import {
  SORT_OPTIONS,
  sortPlayers,
  teamTotal,
  type BoardPlayer,
  type BoardTeam,
  type SortKey,
} from "./model";

/** Objets finaux résolus avec le catalogue ; null si inconnus (affiche « n/d », jamais un faux build). */
function finalItems(
  p: BoardPlayer,
  catalog: Map<number, CatalogItem> | undefined,
): MatchItem[] | null {
  const ids = p.player.finalItemIds;
  if (!ids || !catalog) return null;
  return ids.flatMap((id) => {
    const c = catalog.get(id);
    return c && c.slot
      ? [
          {
            itemId: id,
            name: c.name ?? `Objet n°${id}`,
            tier: c.tier ?? 1,
            category: c.slot,
            iconUrl: c.imageUrl,
          },
        ]
      : [];
  });
}

const ROW_GRID = [
  "grid-cols-[34px_minmax(0,1fr)_78px]",
  "@min-[400px]:grid-cols-[28px_34px_minmax(0,1fr)_70px_84px]",
  "@min-[520px]:grid-cols-[28px_34px_minmax(0,1fr)_70px_84px_84px]",
  "@min-[600px]:grid-cols-[28px_34px_minmax(0,1fr)_70px_84px_84px_138px]",
  "@min-[780px]:grid-cols-[28px_34px_minmax(0,1fr)_70px_84px_84px_138px_48px]",
].join(" ");

/** Barre de valeur relative à la meilleure valeur connue de la partie. */
function ValueBar({
  value,
  max,
  color,
  strong,
}: {
  value: number | null;
  max: number | null;
  color: string;
  strong?: boolean;
}) {
  return (
    <div>
      <p
        className={cn("text-xs tabular-nums", strong ? "font-semibold text-warning" : "text-text")}
      >
        {formatInt(value)}
      </p>
      <span
        className="mt-1 block h-[4px] max-w-[72px] overflow-hidden rounded-full bg-white/[0.07]"
        aria-hidden="true"
      >
        {value !== null && max ? (
          <span
            className="block h-full rounded-full"
            style={{ width: `${Math.max(6, (value / max) * 100)}%`, background: color }}
          />
        ) : null}
      </span>
    </div>
  );
}

function PlayerRow({
  b,
  selected,
  onSelect,
  catalog,
  maxNet,
  maxDmg,
}: {
  b: BoardPlayer;
  selected: boolean;
  onSelect: () => void;
  catalog: Map<number, CatalogItem> | undefined;
  maxNet: number | null;
  maxDmg: number | null;
}) {
  const p = b.player;
  const color = TEAM_META[b.side].color;
  return (
    <li
      data-selected={selected || undefined}
      className="group relative rounded-xl transition-colors duration-150 hover:bg-white/[0.035] data-[selected]:bg-accent-text/[0.07] data-[selected]:shadow-[inset_0_0_0_1px_rgb(180_171_255/0.28)]"
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`Sélectionner ${p.displayName}, ${p.heroName}`}
        className="absolute inset-0 rounded-xl outline-none focus-visible:outline-2 focus-visible:outline-focus"
      />
      <div
        className={cn("pointer-events-none relative grid items-center gap-2 px-2 py-2", ROW_GRID)}
      >
        <span
          className={cn(
            "hidden h-6 place-items-center rounded-md text-[10px] font-semibold tabular-nums @min-[400px]:grid",
            b.mvp
              ? "bg-accent-text/15 text-accent-text"
              : b.netRank === 1
                ? "bg-warning/15 text-warning"
                : "bg-white/[0.06] text-subtle",
          )}
          title={
            b.mvp
              ? "MVP officiel de la partie (classement Valve)"
              : b.netRank
                ? `${b.netRank}e en souls de la partie`
                : "Position en souls inconnue"
          }
        >
          {b.mvp ? "MVP" : b.netRank ? `n°${b.netRank}` : NA}
        </span>
        <HeroPortrait name={p.heroName} src={p.heroImageUrl} rounded="lg" className="size-[34px]" />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[13px] leading-tight font-semibold">
            {p.steamId ? (
              <Link
                to={`/players/${p.steamId}`}
                className="pointer-events-auto relative z-10 truncate underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-focus"
              >
                {p.displayName}
              </Link>
            ) : (
              <span className="truncate" title="Profil non identifiable (SteamID absent)">
                {p.displayName}
              </span>
            )}
            {b.mvp && (
              <span
                aria-hidden="true"
                className="shrink-0 rounded-[5px] bg-accent-text/15 px-1.5 py-px text-[9px] font-semibold text-accent-text @min-[400px]:hidden"
              >
                MVP
              </span>
            )}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-subtle">
            {p.heroName} · Niv. {p.level ?? NA}
          </p>
        </div>
        <div className="text-xs tabular-nums" title={`KDA ${formatDecimal(b.kda)}`}>
          <p className="font-medium text-text">
            {p.kills ?? NA}
            <span className="text-subtle"> / </span>
            <span className="text-loss">{p.deaths ?? NA}</span>
            <span className="text-subtle"> / </span>
            {p.assists ?? NA}
          </p>
          <p className="mt-0.5 text-[11px] text-subtle @min-[400px]:hidden">
            {formatInt(p.netWorth)} souls
          </p>
          <p className="mt-0.5 hidden text-[11px] text-subtle @min-[400px]:block">
            {b.kda === null ? NA : `${formatDecimal(b.kda)} KDA`}
          </p>
        </div>
        <div className="hidden @min-[400px]:block">
          <ValueBar value={p.netWorth} max={maxNet} color={color} strong={b.netRank === 1} />
        </div>
        <div className="hidden @min-[520px]:block">
          <ValueBar value={p.stats?.playerDamage ?? null} max={maxDmg} color="var(--accent-text)" />
        </div>
        <div className="hidden @min-[600px]:block">
          <BuildGrid items={finalItems(b, catalog)} size={20} className="pointer-events-auto" />
        </div>
        <p
          className="hidden text-right text-xs tabular-nums text-muted @min-[780px]:block"
          title="Participation aux éliminations"
        >
          {b.kp === null ? NA : `${Math.round(b.kp)} %`}
        </p>
      </div>
    </li>
  );
}

function Totals({ team }: { team: BoardTeam }) {
  const souls = teamTotal(team, "netWorth");
  const kills = teamTotal(team, "kills");
  const dmg = teamTotal(team, "playerDamage");
  const item = (label: string, v: number | null, compact = false) => (
    <span className="tabular-nums">
      <span className="text-subtle">{label} </span>
      <span className="font-medium text-text">{compact ? formatCompact(v) : formatInt(v)}</span>
    </span>
  );
  return (
    <p className="flex flex-wrap items-center justify-end gap-x-3 text-[11px]">
      {item("Souls", souls.value, true)}
      {item("Éliminations", kills.value)}
      {item("Dégâts", dmg.value, true)}
    </p>
  );
}

function TeamBoard({
  team,
  order,
  selected,
  onSelect,
  catalog,
}: {
  team: BoardTeam;
  order: BoardPlayer[];
  selected: string | null;
  onSelect: (key: string) => void;
  catalog: Map<number, CatalogItem> | undefined;
}) {
  const meta = TEAM_META[team.side];
  const r = team.result;
  const max = (get: (b: BoardPlayer) => number | null) => {
    const v = team.players.map(get).filter((x): x is number => x !== null);
    return v.length ? Math.max(...v) : null;
  };
  const maxNet = max((b) => b.player.netWorth);
  const maxDmg = max((b) => b.player.stats?.playerDamage ?? null);
  return (
    <section aria-label={`Scoreboard ${meta.label}`} className="@container min-w-0">
      <header className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-2">
        <h3 className="flex items-baseline gap-2">
          <span
            className={cn(
              "text-lg font-semibold",
              r === "win" ? "text-win" : r === "loss" ? "text-loss" : "text-muted",
            )}
          >
            {r === "win" ? "Victoire" : r === "loss" ? "Défaite" : "Résultat inconnu"}
          </span>
          <span className="text-[13px] font-medium" style={{ color: meta.color }}>
            {meta.label}
          </span>
        </h3>
        <Totals team={team} />
      </header>
      <div
        aria-hidden="true"
        className={cn(
          "grid gap-2 px-2 pb-1 text-[10px] font-medium tracking-[0.06em] text-subtle uppercase",
          ROW_GRID,
        )}
      >
        <span className="col-span-2 @min-[400px]:col-span-3">Joueur</span>
        <span>K / D / A</span>
        <span className="hidden @min-[400px]:block">Souls</span>
        <span className="hidden @min-[520px]:block">Dégâts</span>
        <span className="hidden @min-[600px]:block">Build</span>
        <span className="hidden text-right @min-[780px]:block">KP</span>
      </div>
      <ul className="border-t border-white/[0.06] pt-1">
        {order.map((b) => (
          <PlayerRow
            key={b.key}
            b={b}
            selected={selected === b.key}
            onSelect={() => onSelect(b.key)}
            catalog={catalog}
            maxNet={maxNet}
            maxDmg={maxDmg}
          />
        ))}
      </ul>
    </section>
  );
}

/** Scoreboard : deux équipes côte à côte quand la largeur le permet, tri commun, sélection d'un joueur. */
export function MatchScoreboard({
  teams,
  sort,
  onSort,
  selected,
  onSelect,
  catalog,
}: {
  teams: BoardTeam[];
  sort: SortKey;
  onSort: (s: SortKey) => void;
  selected: string | null;
  onSelect: (key: string) => void;
  catalog: Map<number, CatalogItem> | undefined;
}) {
  return (
    <DoubleBezel as="section" aria-label="Scoreboard" innerClassName="p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold">Scoreboard</h2>
          <p className="mt-0.5 text-[11px] text-subtle">
            Sélectionne un joueur pour voir ses statistiques et son build.
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <span className="hidden text-[11px] text-subtle sm:inline">Trier par</span>
          <Segmented
            className="w-full max-sm:[&_[role=radio]]:px-1 max-sm:[&_[role=radio]]:text-[11px] sm:w-auto"
            size="sm"
            ariaLabel="Trier les joueurs"
            options={SORT_OPTIONS}
            value={sort}
            onChange={onSort}
          />
        </div>
      </div>
      <div className="@container">
        <div className="grid gap-6 @min-[780px]:grid-cols-2 @min-[780px]:gap-4">
          {teams.map((t) => (
            <TeamBoard
              key={t.side}
              team={t}
              order={sortPlayers(t.players, sort)}
              selected={selected}
              onSelect={onSelect}
              catalog={catalog}
            />
          ))}
        </div>
      </div>
    </DoubleBezel>
  );
}
