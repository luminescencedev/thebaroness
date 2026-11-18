import { Link, useParams, useSearchParams } from "react-router";
import { isApiError, type CatalogItem, type ItemStats } from "@/api";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { BrandLoader } from "@/components/brand";
import { DeltaChip, RadialGauge } from "@/components/charts";
import { DataMetaNotice } from "@/components/DataMetaNotice";
import { ErrorState } from "@/components/ErrorState";
import { DoubleBezel, EmptyState, Skeleton, buttonStyles } from "@/components/ui";
import { useHeroes } from "@/features/heroes/hooks";
import { ItemLink, ItemThumb } from "@/features/items/ItemThumb";
import { categoryLabel, itemName } from "@/features/items/tone";
import { resaleTime } from "@/features/items/format";
import { PairsList } from "@/features/items/PairsList";
import { useHeroItemPairs, useItem, useItemStats, useUpgradeCatalog } from "@/features/items/hooks";
import { StatsScopeBar } from "@/features/items/StatsScopeBar";
import { scopeLabel, useStatsScope } from "@/features/items/statsScope";
import { ITEM_TONE, ROMAN } from "@/features/items/tone";
import { NA, formatDuration, formatInt, formatPercent } from "@/lib/format";

const selectCls =
  "h-8 max-w-full rounded-[10px] border border-border-strong bg-surface px-3 text-[13px] text-muted outline-none focus-visible:outline-2 focus-visible:outline-focus";

function Fact({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-2 text-[26px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
        {value}
      </dd>
      {hint && <p className="mt-2 text-xs text-subtle">{hint}</p>}
    </div>
  );
}

function StatsBody({ stats, color }: { stats: ItemStats; color: string }) {
  const sellKnown = stats.sellRate !== null;
  const total = stats.wins + stats.losses;
  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="flex items-center gap-5 rounded-2xl border border-border bg-surface p-5">
          <RadialGauge
            value={stats.winRate}
            mark={50}
            size={96}
            label={`Taux de victoire ${formatPercent(stats.winRate)}`}
          >
            <span className="text-sm font-semibold tabular-nums">
              {stats.winRate === null ? NA : `${Math.round(stats.winRate)} %`}
            </span>
          </RadialGauge>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted">Taux de victoire avec l'objet acheté</p>
            <p className="mt-1 text-[28px] leading-none font-semibold tabular-nums">
              {formatPercent(stats.winRate)}
            </p>
            <div className="mt-2">
              <DeltaChip
                value={stats.winRate === null ? null : stats.winRate - 50}
                unit=" pts"
                threshold={0.5}
                context="face à 50 %"
              />
            </div>
            {total > 0 && (
              <div className="mt-3">
                <span
                  role="img"
                  aria-label={`${formatInt(stats.wins)} victoires, ${formatInt(stats.losses)} défaites`}
                  className="flex h-1.5 overflow-hidden rounded-full bg-loss/70"
                >
                  <span className="bg-win" style={{ width: `${(stats.wins / total) * 100}%` }} />
                </span>
                <p className="mt-1.5 text-xs text-subtle tabular-nums">
                  {formatInt(stats.wins)} V / {formatInt(stats.losses)} D
                </p>
              </div>
            )}
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-3">
          <Fact
            label="Parties avec achat"
            value={formatInt(stats.matches)}
            hint="Parties observées où l'objet a été acheté"
          />
          <Fact
            label="Joueurs distincts"
            value={stats.players === null ? NA : formatInt(stats.players)}
          />
        </dl>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs text-muted">Taux de revente</p>
          <p className="mt-2 text-[26px] leading-none font-semibold tabular-nums">
            {formatPercent(stats.sellRate)}
          </p>
          <span
            role="img"
            aria-label={
              sellKnown
                ? `Revendu dans ${formatPercent(stats.sellRate)} des parties`
                : "Revente non renseignée"
            }
            className="mt-3 block h-1.5 overflow-hidden rounded-full bg-surface-strong"
          >
            {sellKnown && (
              <span
                className="block h-full rounded-full"
                style={{ width: `${Math.min(100, stats.sellRate as number)}%`, background: color }}
              />
            )}
          </span>
          <p className="mt-2 text-xs text-subtle tabular-nums">
            {stats.sold === null
              ? "Reventes non renseignées"
              : `${formatInt(stats.sold)} parties avec revente`}
          </p>
        </div>
        <Fact
          label="Temps moyen d'achat"
          value={formatDuration(stats.avgBuyTimeSeconds)}
          hint="Minutes de jeu, moyenne des achats"
        />
        <Fact label="Temps moyen de revente" {...resaleTime(stats)} />
      </div>
    </div>
  );
}

function StatsSection({ item }: { item: CatalogItem }) {
  const [params, setParams] = useSearchParams();
  const { scope, setPeriod, setMatchMode } = useStatsScope();
  const heroes = useHeroes();
  const heroId = Number(params.get("hero")) || undefined;
  const stats = useItemStats(String(item.id), { ...scope, heroId });
  const catalog = useUpgradeCatalog();
  const catalogById = new Map((catalog.data?.items ?? []).map((i) => [i.id, i]));
  const hero = heroes.data?.items.find((h) => h.id === heroId);
  const color = item.slot ? ITEM_TONE[item.slot].fg : "var(--accent)";
  const pairs = useHeroItemPairs(
    String(heroId ?? 0),
    { ...scope, itemId: item.id },
    12,
    heroId !== undefined,
  );

  const setHero = (v: string) =>
    setParams(
      (cur) => {
        const next = new URLSearchParams(cur);
        if (v) next.set("hero", v);
        else next.delete("hero");
        return next;
      },
      { replace: true },
    );

  const d = stats.data;
  // Le titre décrit les filtres RÉELLEMENT servis, jamais ceux de l'interface en attente.
  const served = d
    ? scopeLabel({
        period: d.filters.period,
        matchMode: d.filters.matchMode === "all" ? undefined : d.filters.matchMode,
      })
    : null;

  return (
    <section aria-labelledby="stats" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div>
          <h2 id="stats" className="text-xl">
            Statistiques
          </h2>
          <p className="mt-1 text-xs text-subtle" aria-live="polite">
            {served
              ? `${served}${d?.filters.heroId ? `, héros : ${hero?.name ?? `n°${d.filters.heroId}`}` : ", tous les héros"}`
              : "Chargement…"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatsScopeBar
            scope={scope}
            onPeriod={setPeriod}
            onMode={setMatchMode}
            className="contents"
          />
          <label className="sr-only" htmlFor="item-hero">
            Héros
          </label>
          <select
            id="item-hero"
            className={selectCls}
            value={heroId ?? ""}
            onChange={(e) => setHero(e.target.value)}
          >
            <option value="">Tous les héros</option>
            {(heroes.data?.items ?? [])
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div
        aria-busy={stats.isFetching}
        className={stats.isPlaceholderData ? "opacity-60 transition-opacity" : undefined}
      >
        {stats.isPending ? (
          <Skeleton className="h-64 rounded-card" />
        ) : stats.isError && !d ? (
          <ErrorState
            error={stats.error}
            title="Statistiques indisponibles"
            onRetry={() => void stats.refetch()}
          />
        ) : d && d.stats ? (
          <StatsBody stats={d.stats} color={color} />
        ) : d ? (
          <EmptyState
            title="Échantillon insuffisant"
            description="Moins de 20 parties avec cet objet pour ces filtres : la source ne fournit pas de statistiques. Élargissez la période ou retirez le filtre de héros."
          />
        ) : null}
      </div>
      {d && <DataMetaNotice meta={d.meta} />}

      {heroId && (
        <div className="space-y-2 pt-2">
          <h3 className="text-base font-semibold">
            Souvent acheté avec, chez{" "}
            {heroes.data?.items.find((h) => h.id === pairs.data?.heroId)?.name ??
              hero?.name ??
              "ce héros"}
            {pairs.isPlaceholderData ? " (actualisation en cours)" : ""}
          </h3>
          {pairs.isPending ? (
            <Skeleton className="h-32 rounded-card" />
          ) : pairs.isError ? (
            <ErrorState
              error={pairs.error}
              title="Associations indisponibles"
              onRetry={() => void pairs.refetch()}
            />
          ) : pairs.data.items.length === 0 ? (
            <p className="text-sm text-muted">Aucune association connue pour ces filtres.</p>
          ) : (
            <PairsList pairs={pairs.data.items} catalog={catalogById} color={color} />
          )}
        </div>
      )}
    </section>
  );
}

export function ItemPage() {
  const { itemId = "" } = useParams();
  const [params] = useSearchParams();
  const query = useItem(itemId);
  const catalog = useUpgradeCatalog();
  const heroes = useHeroes();
  useDocumentTitle(query.data ? itemName(query.data.item) : "Item");

  if (query.isPending) return <BrandLoader message="Le Doorman consulte la boutique" />;
  if (query.isError) {
    if (isApiError(query.error) && (query.error.status === 404 || query.error.status === 400)) {
      return (
        <EmptyState
          icon="search"
          title="Item introuvable"
          description="Cet item n'existe pas dans le catalogue."
          action={
            <Link to="/items" className={buttonStyles("secondary")}>
              Tous les items
            </Link>
          }
        />
      );
    }
    return (
      <ErrorState
        error={query.error}
        title="Item indisponible"
        onRetry={() => void query.refetch()}
      />
    );
  }

  const item = query.data.item;
  const tone = item.slot ? ITEM_TONE[item.slot] : null;
  const catalogById = new Map((catalog.data?.items ?? []).map((i) => [i.id, i]));
  const usedIn = (catalog.data?.items ?? []).filter((i) => i.componentIds.includes(item.id));
  const heroId = Number(params.get("hero")) || null;
  const hero = heroes.data?.items.find((h) => h.id === heroId);

  return (
    <div className="max-w-[1100px] space-y-8" style={{ ["--hc" as string]: tone?.fg }}>
      <DoubleBezel
        size="lg"
        innerClassName="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7"
      >
        <ItemThumb item={item} size={88} className="rounded-2xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5 text-xs font-medium">
            <span
              className="rounded-full border px-2.5 py-1"
              style={{
                background: tone ? `color-mix(in srgb, ${tone.fg} 14%, transparent)` : undefined,
                borderColor: `color-mix(in srgb, ${tone?.fg ?? "#fff"} 45%, transparent)`,
                color: tone?.fg,
              }}
            >
              {categoryLabel(item.slot)}
            </span>
            {item.tier !== null && (
              <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-text">
                Tier {ROMAN[item.tier] ?? item.tier}
              </span>
            )}
            <span
              className="rounded-full bg-white/[0.08] px-2.5 py-1 text-text tabular-nums"
              title="Prix total du catalogue : ni le prix payé en partie, ni le reste à payer pour une amélioration"
            >
              {item.cost === null ? "Coût n/d" : `${formatInt(item.cost)} souls`}
            </span>
            <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-text">
              {item.disabled ? "Désactivé" : item.shopable ? "En boutique" : "Hors boutique"}
            </span>
            {item.isActive !== null && (
              <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-text">
                {item.isActive ? "Actif" : "Passif"}
              </span>
            )}
          </div>
          <h1 className="mt-3 text-3xl sm:text-4xl">{itemName(item)}</h1>
          <p className="mt-1 text-xs text-subtle">
            {item.className}
            {query.data.clientVersion !== null ? ` · client ${query.data.clientVersion}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
          <Link to="/items" className={buttonStyles("secondary", "sm")}>
            Tous les items
          </Link>
          {heroId && hero && (
            <Link to={`/heroes/${hero.id}?tab=builds`} className={buttonStyles("ghost", "sm")}>
              Retour à {hero.name}
            </Link>
          )}
        </div>
      </DoubleBezel>

      {(item.componentIds.length > 0 || usedIn.length > 0) && (
        <section aria-labelledby="compo" className="space-y-3">
          <h2 id="compo" className="text-xl">
            Composition
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {item.componentIds.length > 0 && (
              <div>
                <p className="mb-2 text-xs text-muted">Se compose de</p>
                <ul className="flex flex-wrap gap-x-5 gap-y-2">
                  {item.componentIds.map((id) => (
                    <li key={id}>
                      <ItemLink itemId={id} item={catalogById.get(id)} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {usedIn.length > 0 && (
              <div>
                <p className="mb-2 text-xs text-muted">Entre dans la composition de</p>
                <ul className="flex flex-wrap gap-x-5 gap-y-2">
                  {usedIn.map((i) => (
                    <li key={i.id}>
                      <ItemLink itemId={i.id} item={i} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      <StatsSection item={item} />
      <p className="text-xs text-subtle">
        Statistiques via Deadlock API, projet communautaire indépendant de Valve. Les achats
        observés ne sont pas un taux de choix.
      </p>
    </div>
  );
}
