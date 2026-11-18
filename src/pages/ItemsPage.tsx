import { useEffect, useMemo } from "react";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { DataMetaNotice } from "@/components/DataMetaNotice";
import { ErrorState } from "@/components/ErrorState";
import { PageHeader } from "@/components/PageHeader";
import { Button, EmptyState, SearchField, Segmented, Skeleton, cn } from "@/components/ui";
import { ItemCard } from "@/features/items/ItemCard";
import { CATEGORIES, categoryLabel } from "@/features/items/tone";
import { useItemsStats, useUpgradeCatalog } from "@/features/items/hooks";
import { StatsScopeBar } from "@/features/items/StatsScopeBar";
import { scopeLabel, useStatsScope } from "@/features/items/statsScope";
import { CostFilter } from "@/features/items/CostFilter";
import { costOptions } from "@/features/items/costs";
import { filterItems, inShopScope, sortItems } from "@/features/items/catalogView";
import { useItemFilters } from "@/features/items/useItemFilters";
import { ITEM_TONE } from "@/features/items/tone";
import { formatInt } from "@/lib/format";

const GRID = "grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]";

function Chip({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const c = color ?? "var(--text)";
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="pressable hover-text h-8 rounded-full border px-3 text-[13px]"
      style={
        active
          ? {
              borderColor: `color-mix(in srgb, ${c} 55%, transparent)`,
              background: `color-mix(in srgb, ${c} 16%, transparent)`,
              color: c,
            }
          : { borderColor: "var(--border)", color: "var(--muted)" }
      }
    >
      {children}
    </button>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[11px] font-medium tracking-wide text-subtle uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}

export function ItemsPage() {
  useDocumentTitle("Items");
  const catalog = useUpgradeCatalog();
  const f = useItemFilters();
  const { scope, setPeriod, setMatchMode } = useStatsScope();
  // Une seule requête d'agrégats pour tout le catalogue, jointe côté front.
  const stats = useItemsStats(scope);
  const statsById = useMemo(
    () => new Map((stats.data?.items ?? []).map((s) => [s.itemId, s])),
    [stats.data],
  );
  const hasStats = statsById.size > 0;

  const all = catalog.data?.items;
  // Options de coût : montants exacts du catalogue pertinent (réglage boutique), indépendantes des autres filtres.
  const options = useMemo(() => costOptions(inShopScope(all ?? [], f.allShops)), [all, f.allShops]);
  const tierByCost = useMemo(() => {
    const tiers = new Map<number, Set<number | null>>();
    for (const i of inShopScope(all ?? [], f.allShops))
      if (i.cost !== null && i.tier !== null)
        tiers.set(i.cost, (tiers.get(i.cost) ?? new Set()).add(i.tier));
    return new Map(
      [...tiers].flatMap(([c, t]) => {
        const only = t.size === 1 ? [...t][0] : null;
        return only ? [[c, only] as const] : [];
      }),
    );
  }, [all, f.allShops]);
  const cost =
    f.costParam !== null && options.some((o) => o.value === f.costParam) ? f.costParam : null;

  // Normalise une valeur d'URL obsolète (low, mid, high) ou absente du catalogue : une seule fois, sans boucle.
  const { costRaw, costParam, clearCost } = f;
  const catalogReady = catalog.isSuccess;
  useEffect(() => {
    if (costRaw === null) return;
    if (costParam === null || (catalogReady && cost === null)) clearCost();
  }, [costRaw, costParam, catalogReady, cost, clearCost]);

  const visible = useMemo(
    () =>
      sortItems(
        filterItems(all ?? [], { q: f.q, slot: f.slot, tier: f.tier, cost, allShops: f.allShops }),
        f.sort,
        f.dir,
        statsById,
      ),
    [all, f.q, f.slot, f.tier, cost, f.allShops, f.sort, f.dir, statsById],
  );

  return (
    <div>
      <PageHeader
        title="Items"
        description="Les objets de boutique de Deadlock : catégorie, tier, coût et volume d'achats observé dans les parties analysées."
      />

      <div className="mb-5 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <SearchField
            label="Filtrer les items par nom"
            placeholder="Filtrer par nom"
            value={f.q}
            onChange={(e) => f.setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && f.setQ("")}
            className="w-full sm:w-72"
          />
          <div className="flex items-center gap-2 sm:ml-auto">
            <Segmented
              ariaLabel="Trier les items"
              value={f.sort}
              onChange={f.setSort}
              options={[
                { value: "name", label: "Nom" },
                { value: "cost", label: "Coût" },
                { value: "tier", label: "Tier" },
                { value: "matches", label: "Achats" },
              ]}
            />
            <button
              type="button"
              onClick={() => f.setDir(f.dir === "asc" ? "desc" : "asc")}
              aria-label={`Ordre ${f.dir === "asc" ? "croissant" : "décroissant"}, cliquer pour inverser`}
              title={f.dir === "asc" ? "Croissant" : "Décroissant"}
              className="pressable hover-text grid size-9 shrink-0 place-items-center rounded-[10px] border border-border-strong bg-surface text-muted"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className={cn(
                  "size-4 transition-transform motion-reduce:transition-none",
                  f.dir === "desc" && "rotate-180",
                )}
              >
                <path d="M12 19V5M6 11l6-6 6 6" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2.5">
          <Group label="Catégorie">
            <Chip active={f.slot === null} onClick={() => f.setSlot(null)}>
              Toutes
            </Chip>
            {CATEGORIES.map((c) => (
              <Chip
                key={c}
                active={f.slot === c}
                color={ITEM_TONE[c].fg}
                onClick={() => f.setSlot(f.slot === c ? null : c)}
              >
                {categoryLabel(c)}
              </Chip>
            ))}
          </Group>
          <CostFilter options={options} value={cost} onChange={f.setCost} tierByCost={tierByCost} />
          <Group label="Boutique">
            <Chip active={!f.allShops} onClick={() => f.setAllShops(false)}>
              Disponibles
            </Chip>
            <Chip active={f.allShops} onClick={() => f.setAllShops(true)}>
              Tous
            </Chip>
          </Group>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3">
          <StatsScopeBar scope={scope} onPeriod={setPeriod} onMode={setMatchMode} />
          <p className="text-xs text-subtle" aria-live="polite">
            {stats.isPending
              ? "Chargement des achats observés…"
              : stats.isError && !stats.data
                ? "Achats observés indisponibles : le catalogue reste consultable."
                : stats.data
                  ? `Achats observés : ${scopeLabel({
                      period: stats.data.filters.period,
                      matchMode:
                        stats.data.filters.matchMode === "all"
                          ? undefined
                          : stats.data.filters.matchMode,
                    })}.${stats.isPlaceholderData ? " Actualisation en cours." : " Items sous 20 parties : sans valeur."}`
                  : ""}
          </p>
          {stats.isError && !stats.data && (
            <div className="flex gap-1.5">
              <Button variant="ghost" size="sm" onClick={() => void stats.refetch()}>
                Réessayer
              </Button>
              {scope.period === "30d" && (
                <Button variant="ghost" size="sm" onClick={() => setPeriod("7d")}>
                  Voir sur 7 jours
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {catalog.isPending ? (
        <div className={GRID} aria-busy="true">
          {Array.from({ length: 16 }, (_, i) => (
            <Skeleton key={i} className="h-[84px] rounded-2xl" />
          ))}
        </div>
      ) : catalog.isError ? (
        <ErrorState
          error={catalog.error}
          title="Catalogue indisponible"
          onRetry={() => void catalog.refetch()}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title="Aucun item"
          description="Aucun item ne correspond à ces filtres."
          action={
            <Button variant="secondary" onClick={f.reset}>
              Réinitialiser les filtres
            </Button>
          }
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-muted tabular-nums" aria-live="polite">
            {formatInt(visible.length)} items
            {f.sort === "matches" && !hasStats && !stats.isPending
              ? " · tri par achats indisponible, ordre alphabétique"
              : ""}
          </p>
          <ul className={GRID}>
            {visible.map((i) => (
              <li key={i.id}>
                <ItemCard item={i} stats={statsById.get(i.id)} />
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-1">
            <DataMetaNotice meta={catalog.data.meta} />
            <p className="text-xs text-subtle">
              Achats observés : parties analysées où l'objet a été acheté. Ce n'est pas un taux de
              choix : le dénominateur n'est pas fourni par la source.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
