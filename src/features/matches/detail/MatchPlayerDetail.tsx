import { Tabs } from "@base-ui/react/tabs";
import { Link } from "react-router";
import type { CatalogItem, MatchPlayer } from "@/api";
import { RadialGauge } from "@/components/charts";
import { HeroPortrait } from "@/components/media/HeroPortrait";
import { DoubleBezel, cn } from "@/components/ui";
import { ItemIcon } from "@/features/players/profile/MatchBuild";
import { NA, formatDecimal, formatDuration, formatInt, formatPercent } from "@/lib/format";
import { TEAM_META } from "@/lib/teams";
import { maxKnown, purchaseTimeline, type BoardPlayer, type Purchase } from "./model";

const TAB_CLS =
  "pressable relative z-10 h-8 rounded-[9px] px-3 text-[12.5px] font-medium text-subtle outline-none hover:text-muted focus-visible:outline-2 focus-visible:outline-focus data-[selected]:text-text";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.05] py-1.5 text-xs">
      <dt className="text-subtle" title={hint}>
        {label}
      </dt>
      <dd className="font-medium tabular-nums text-text">{value}</dd>
    </div>
  );
}

function CompareBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number | null;
  max: number | null;
  color: string;
}) {
  const pct = value !== null && max ? Math.max(2, (value / max) * 100) : 0;
  return (
    <li className="grid grid-cols-[minmax(0,7.5rem)_1fr_3.5rem] items-center gap-3 text-xs sm:grid-cols-[8.5rem_1fr_4rem]">
      <span className="truncate text-muted">{label}</span>
      <span
        className="h-[7px] overflow-hidden rounded-full bg-white/[0.07]"
        role="img"
        aria-label={`${label} : ${formatInt(value)}${max ? `, référence ${formatInt(max)}` : ""}`}
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${pct}%`, background: color }}
        />
      </span>
      <span className="text-right font-medium tabular-nums">{formatInt(value)}</span>
    </li>
  );
}

function StatsPanel({ b, all }: { b: BoardPlayer; all: BoardPlayer[] }) {
  const p = b.player;
  const s = p.stats ?? null;
  const color = TEAM_META[b.side].color;
  const bars: { label: string; get: (x: MatchPlayer) => number | null }[] = [
    { label: "Dégâts aux héros", get: (x) => x.stats?.playerDamage ?? null },
    { label: "Dégâts aux objectifs", get: (x) => x.stats?.objectiveDamage ?? null },
    { label: "Soins", get: (x) => x.stats?.healing ?? null },
  ];
  return (
    <div className="space-y-5">
      <div className="grid gap-x-8 gap-y-5 @min-[640px]:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <p className="mb-2 text-[11px] font-medium text-muted">Comparaison avec la partie</p>
          <ul className="space-y-2.5">
            {bars.map((r) => (
              <CompareBar
                key={r.label}
                label={r.label}
                value={r.get(p)}
                max={maxKnown(all, r.get)}
                color={color}
              />
            ))}
          </ul>
          <p className="mt-2 text-[10.5px] text-subtle">
            Référence : la plus grande valeur connue parmi les joueurs de la partie.
          </p>
        </div>
        <div className="flex items-start justify-center gap-5">
          <div className="text-center">
            <RadialGauge
              value={s?.accuracy ?? null}
              mark={null}
              size={76}
              color="var(--accent-text)"
              label={`Précision : ${formatPercent(s?.accuracy)}`}
            >
              <b className="text-[15px] tabular-nums">
                {s?.accuracy == null ? NA : `${Math.round(s.accuracy)} %`}
              </b>
            </RadialGauge>
            <p
              className="mt-1.5 text-[10.5px] text-subtle"
              title="Balles touchées sur balles tirées, toutes cibles"
            >
              Précision
            </p>
          </div>
          <div className="text-center">
            <RadialGauge
              value={b.kp}
              mark={null}
              size={76}
              color="var(--win)"
              label={`Participation aux éliminations : ${formatPercent(b.kp)}`}
            >
              <b className="text-[15px] tabular-nums">
                {b.kp === null ? NA : `${Math.round(b.kp)} %`}
              </b>
            </RadialGauge>
            <p
              className="mt-1.5 text-[10.5px] text-subtle"
              title="(éliminations + assistances) / éliminations de l'équipe"
            >
              Participation
            </p>
          </div>
        </div>
      </div>

      <dl className="grid gap-x-8 @min-[640px]:grid-cols-2">
        <Stat
          label="K / D / A"
          value={`${p.kills ?? NA} / ${p.deaths ?? NA} / ${p.assists ?? NA}`}
        />
        <Stat label="KDA" value={formatDecimal(b.kda)} hint="(K + A) / max(D, 1)" />
        <Stat label="Souls (valeur nette)" value={formatInt(p.netWorth)} />
        <Stat
          label="MVP Valve"
          value={p.mvpRank == null ? NA : `n°${p.mvpRank}`}
          hint="Classement calculé par Valve"
        />
        <Stat label="Derniers coups" value={formatInt(p.lastHits)} />
        <Stat label="Dénis" value={formatInt(p.denies)} />
        <Stat label="Creeps éliminés" value={formatInt(s?.creepKills)} />
        <Stat label="Neutres éliminés" value={formatInt(s?.neutralKills)} />
        <Stat label="Dégâts subis" value={formatInt(s?.damageTaken)} />
        <Stat
          label="Tirs critiques"
          value={formatPercent(s?.heroCritRate)}
          hint="Critiques sur balles touchant un héros"
        />
        <Stat label="Éliminations à la tête" value={formatInt(s?.headshotKills)} />
        <Stat
          label="Soins reçus et donnés"
          value={`${formatInt(s?.selfHealing)} / ${formatInt(s?.teammateHealing)}`}
          hint="Auto-soins / soins aux alliés"
        />
      </dl>
    </div>
  );
}

function PurchaseRow({ pu }: { pu: Purchase }) {
  const c = pu.catalog;
  const sold = pu.soldAtSeconds !== null;
  return (
    <li className="grid grid-cols-[3rem_28px_minmax(0,1fr)_auto] items-center gap-3 border-t border-white/[0.06] py-2 text-xs">
      <span className="tabular-nums text-subtle">
        {pu.atSeconds === null ? NA : formatDuration(pu.atSeconds)}
      </span>
      {c && c.slot ? (
        <span className={cn(sold && "opacity-50")}>
          <ItemIcon
            size={28}
            item={{
              itemId: c.id,
              name: c.name,
              tier: c.tier ?? 1,
              category: c.slot,
              iconUrl: c.imageUrl,
            }}
          />
        </span>
      ) : (
        <span
          aria-hidden="true"
          className="grid size-7 place-items-center rounded-[6px] border border-dashed border-white/15 text-[10px] text-subtle"
        >
          ?
        </span>
      )}
      <span className={cn("min-w-0 truncate", sold ? "text-subtle line-through" : "text-text")}>
        {c ? c.name : `Objet n°${pu.itemId}`}
        {!c && <span className="ml-1.5 text-subtle no-underline">(catalogue indisponible)</span>}
      </span>
      <span className="text-right text-[11px] text-subtle">
        {sold ? `Revendu à ${formatDuration(pu.soldAtSeconds)}` : ""}
      </span>
    </li>
  );
}

function BuildPanel({
  b,
  catalog,
}: {
  b: BoardPlayer;
  catalog: Map<number, CatalogItem> | undefined;
}) {
  const p = b.player;
  const timeline = purchaseTimeline(p.purchases, catalog);
  const finals = p.finalItemIds ?? null;
  return (
    <div className="space-y-5">
      <section>
        <h3 className="mb-2 text-[11px] font-medium text-muted">
          Objets conservés en fin de partie
        </h3>
        {finals === null ? (
          <p className="text-xs text-subtle">Build {NA}</p>
        ) : finals.length === 0 ? (
          <p className="text-xs text-subtle">Aucun objet conservé.</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {finals.map((id, i) => {
              const c = catalog?.get(id);
              return (
                <li key={`${id}-${i}`}>
                  {c && c.slot ? (
                    <ItemIcon
                      size={34}
                      item={{
                        itemId: id,
                        name: c.name,
                        tier: c.tier ?? 1,
                        category: c.slot,
                        iconUrl: c.imageUrl,
                      }}
                    />
                  ) : (
                    <span
                      tabIndex={0}
                      title={`Objet n°${id} (catalogue indisponible)`}
                      aria-label={`Objet n°${id}, catalogue indisponible`}
                      className="grid size-[34px] place-items-center rounded-[6px] border border-dashed border-white/15 text-[10px] text-subtle"
                    >
                      ?
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section>
        <h3 className="mb-1 text-[11px] font-medium text-muted">Chronologie des achats</h3>
        {timeline === null ? (
          <p className="text-xs text-subtle">Achats {NA}</p>
        ) : timeline.length === 0 ? (
          <p className="text-xs text-subtle">Aucun achat enregistré.</p>
        ) : (
          <ol>
            {timeline.map((pu, i) => (
              <PurchaseRow key={`${pu.itemId}-${i}`} pu={pu} />
            ))}
          </ol>
        )}
        <p className="mt-2 text-[10.5px] text-subtle">
          Les prix payés ne sont pas fournis par la source ; les objets revendus sont barrés.
        </p>
      </section>
    </div>
  );
}

/** Panneau du joueur sélectionné : en-tête, onglets Statistiques et Build & achats. */
export function MatchPlayerDetail({
  selected,
  all,
  catalog,
}: {
  selected: BoardPlayer | null;
  all: BoardPlayer[];
  catalog: Map<number, CatalogItem> | undefined;
}) {
  if (!selected)
    return (
      <DoubleBezel as="section" aria-label="Détail du joueur" innerClassName="p-5">
        <p className="text-sm text-subtle">Aucun joueur disponible.</p>
      </DoubleBezel>
    );
  const p = selected.player;
  const team = TEAM_META[selected.side];
  return (
    <DoubleBezel as="section" aria-label="Détail du joueur sélectionné" innerClassName="p-4 sm:p-5">
      <Tabs.Root defaultValue="stats" className="@container">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <HeroPortrait name={p.heroName} src={p.heroImageUrl} className="size-11" />
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                {p.steamId ? (
                  <Link
                    to={`/players/${p.steamId}`}
                    className="truncate underline-offset-4 hover:underline"
                  >
                    {p.displayName}
                  </Link>
                ) : (
                  <span className="truncate">{p.displayName}</span>
                )}
                {selected.mvp && (
                  <span className="rounded-[5px] bg-accent-text/15 px-1.5 py-px text-[10px] font-semibold text-accent-text">
                    MVP
                  </span>
                )}
              </h2>
              <p className="mt-0.5 text-xs text-subtle">
                {p.heroName} · <span style={{ color: team.color }}>{team.label}</span>
                {p.level !== null ? ` · Niv. ${p.level}` : ""}
              </p>
            </div>
          </div>
          <Tabs.List
            aria-label="Détail du joueur"
            className="relative inline-flex rounded-[11px] bg-surface p-[3px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07)]"
          >
            <Tabs.Indicator className="absolute top-[var(--active-tab-top)] left-0 h-[var(--active-tab-height)] w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)] rounded-[9px] bg-white/[0.1] shadow-[0_1px_2px_rgb(0_0_0/0.45),inset_0_1px_0_rgb(255_255_255/0.07)] transition-[translate,width] duration-[220ms] ease-[var(--ease-in-out)] motion-reduce:transition-none" />
            <Tabs.Tab value="stats" className={TAB_CLS}>
              Statistiques
            </Tabs.Tab>
            <Tabs.Tab value="build" className={TAB_CLS}>
              Build &amp; achats
            </Tabs.Tab>
          </Tabs.List>
        </div>
        <Tabs.Panel value="stats">
          <StatsPanel b={selected} all={all} />
        </Tabs.Panel>
        <Tabs.Panel value="build">
          <BuildPanel b={selected} catalog={catalog} />
        </Tabs.Panel>
      </Tabs.Root>
    </DoubleBezel>
  );
}
