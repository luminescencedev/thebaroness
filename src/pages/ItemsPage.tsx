import { useMemo } from "react";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { DataMetaNotice } from "@/components/DataMetaNotice";
import { ErrorState } from "@/components/ErrorState";
import { PageHeader } from "@/components/PageHeader";
import { Button, EmptyState, SearchField, Segmented, Skeleton } from "@/components/ui";
import { ItemCard } from "@/features/items/ItemCard";
import { CATEGORIES, categoryLabel, itemName } from "@/features/items/tone";
import { useItemsStats, useUpgradeCatalog } from "@/features/items/hooks";
import { StatsScopeBar } from "@/features/items/StatsScopeBar";
import { scopeLabel, useStatsScope } from "@/features/items/statsScope";
import { COST_BANDS, useItemFilters } from "@/features/items/useItemFilters";
import { ITEM_TONE, ROMAN } from "@/features/items/tone";
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
  const tiers = useMemo(
    () => [...new Set((all ?? []).flatMap((i) => (i.tier === null ? [] : [i.tier])))].sort(),
    [all],
  );

  const visible = useMemo(() => {
    const needle = f.q.trim().toLowerCase();
    const band = COST_BANDS.find((b) => b.value === f.cost);
    const list = (all ?? []).filter(
      (i) =>
        (f.allShops || (i.shopable && !i.disabled)) &&
        (!f.slot || i.slot === f.slot) &&
        (f.tier === null || i.tier === f.tier) &&
        (!band || (i.cost !== null && band.test(i.cost))) &&
        (!needle || itemName(i).toLowerCase().includes(needle)),
    );
    const byName = (a: (typeof list)[number], b: (typeof list)[number]) =>
      itemName(a).localeCompare(itemName(b));
    // Valeur inconnue : toujours en fin de liste, jamais traitée comme 0.
    const num = (v: number | null | undefined) => v ?? Number.POSITIVE_INFINITY;
    return [...list].sort((a, b) =>
      f.sort === "cost"
        ? num(a.cost) - num(b.cost) || byName(a, b)
        : f.sort === "tier"
          ? num(a.tier) - num(b.tier) || num(a.cost) - num(b.cost) || byName(a, b)
          : f.sort === "matches"
            ? (statsById.get(b.id)?.matches ?? -1) - (statsById.get(a.id)?.matches ?? -1) ||
              byName(a, b)
            : byName(a, b),
    );
  }, [all, f.q, f.slot, f.tier, f.cost, f.allShops, f.sort, statsById]);

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
          <Segmented
            ariaLabel="Trier les items"
            className="sm:ml-auto"
            value={f.sort}
            onChange={f.setSort}
            options={[
              { value: "name", label: "Nom" },
              { value: "cost", label: "Coût" },
              { value: "tier", label: "Tier" },
              { value: "matches", label: "Achats" },
            ]}
          />
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
          <Group label="Tier">
            <Chip active={f.tier === null} onClick={() => f.setTier(null)}>
              Tous
            </Chip>
            {tiers.map((t) => (
              <Chip
                key={t}
                active={f.tier === t}
                onClick={() => f.setTier(f.tier === t ? null : t)}
              >
                {ROMAN[t] ?? t}
              </Chip>
            ))}
          </Group>
          <Group label="Coût">
            <Chip active={f.cost === null} onClick={() => f.setCost(null)}>
              Tous
            </Chip>
            {COST_BANDS.map((b) => (
              <Chip
                key={b.value}
                active={f.cost === b.value}
                onClick={() => f.setCost(f.cost === b.value ? null : b.value)}
              >
                {b.label}
              </Chip>
            ))}
          </Group>
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
              : stats.isError
                ? "Achats observés indisponibles : le catalogue reste consultable."
                : `Achats observés : ${scopeLabel(scope)}. Items sous 20 parties : sans valeur.`}
          </p>
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
