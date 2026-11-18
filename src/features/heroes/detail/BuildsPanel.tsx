import { useSearchParams } from "react-router";
import type { BuildSort, CatalogItem, HeroBuild } from "@/api";
import { ErrorState } from "@/components/ErrorState";
import { DataMetaNotice } from "@/components/DataMetaNotice";
import { EmptyState, Segmented, Skeleton, cn } from "@/components/ui";
import { ItemLink, ItemThumb } from "@/features/items/ItemThumb";
import { useHeroBuilds, useUpgradeCatalog } from "@/features/items/hooks";
import { formatDate, formatInt } from "@/lib/format";

const SORTS: { value: BuildSort; label: string }[] = [
  { value: "favorites", label: "Favoris" },
  { value: "weekly_favorites", label: "Semaine" },
  { value: "updated_at", label: "Mis à jour" },
  { value: "published_at", label: "Publiés" },
];

/** Compteur du tri demandé seulement : null (non renseigné) n'est jamais affiché comme 0 favori. */
function favoritesText(b: HeroBuild, sort: BuildSort): string | null {
  if (sort === "favorites" && b.favorites !== null) return `${formatInt(b.favorites)} favoris`;
  if (sort === "weekly_favorites" && b.weeklyFavorites !== null)
    return `${formatInt(b.weeklyFavorites)} favoris cette semaine`;
  return null;
}

const buildTitle = (b: HeroBuild) => b.name?.trim() || "Build sans nom";

function BuildDetail({
  build,
  sort,
  heroId,
  catalog,
  color,
}: {
  build: HeroBuild;
  sort: BuildSort;
  heroId: number;
  catalog: Map<number, CatalogItem> | undefined;
  color: string;
}) {
  const fav = favoritesText(build, sort);
  return (
    <section
      aria-label={`Détail du build ${buildTitle(build)}`}
      className="min-w-0 rounded-2xl border border-border bg-surface p-5"
    >
      <h3 className="text-xl font-semibold tracking-[-0.02em]">{buildTitle(build)}</h3>
      <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-subtle">
        {fav && <span className="text-muted tabular-nums">{fav}</span>}
        {build.updatedAt && <span>Mis à jour le {formatDate(build.updatedAt)}</span>}
        {build.publishedAt && <span>Publié le {formatDate(build.publishedAt)}</span>}
        {build.version !== null && <span>Version {build.version}</span>}
        <span>{build.authorSteamId ? `Auteur Steam ${build.authorSteamId}` : "Auteur n/d"}</span>
      </p>
      {build.description && (
        <p className="mt-3 text-sm leading-relaxed text-muted">{build.description}</p>
      )}
      {build.categories.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Ce build ne contient aucune catégorie.</p>
      ) : (
        <ol className="mt-5 space-y-5">
          {build.categories.map((c, i) => (
            <li key={`${c.name}-${i}`}>
              <div className="flex items-baseline gap-2 border-b border-border pb-1.5">
                <h4 className="text-sm font-semibold" style={{ color }}>
                  {c.name?.trim() || "Section sans nom"}
                </h4>
                <span className="text-xs text-subtle tabular-nums">{c.items.length} items</span>
              </div>
              {c.description && <p className="mt-2 text-xs text-muted">{c.description}</p>}
              {c.items.length === 0 ? (
                <p className="mt-2 text-xs text-subtle">Aucun item dans cette section.</p>
              ) : (
                <ul className="mt-3 grid gap-x-4 gap-y-3 sm:grid-cols-2">
                  {c.items.map((it, j) => (
                    <li key={`${it.itemId}-${j}`} className="min-w-0">
                      <ItemLink
                        itemId={it.itemId}
                        item={catalog?.get(it.itemId)}
                        size={36}
                        heroId={heroId}
                      />
                      {it.annotation && (
                        <p className="mt-1 pl-11 text-xs leading-snug text-subtle">
                          {it.annotation}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** Builds publiés par la communauté (jamais « officiels » ni les achats réels d'un joueur). */
export function BuildsPanel({ heroId, color }: { heroId: number; color: string }) {
  const [params, setParams] = useSearchParams();
  const sort = SORTS.find((s) => s.value === params.get("sort"))?.value ?? "favorites";
  const builds = useHeroBuilds(String(heroId), sort, 10);
  const catalog = useUpgradeCatalog();
  const catalogById = new Map((catalog.data?.items ?? []).map((i) => [i.id, i]));

  const setParam = (key: string, value: string | null, replace = true) =>
    setParams(
      (cur) => {
        const next = new URLSearchParams(cur);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace },
    );

  const list = builds.data?.items ?? [];
  const selected = list.find((b) => String(b.buildId) === params.get("build")) ?? list[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-xs leading-relaxed text-subtle">
          Builds publiés en jeu par la communauté. Ils ne reflètent ni un choix officiel ni les
          achats réels des joueurs.
        </p>
        <Segmented
          size="sm"
          ariaLabel="Trier les builds"
          value={sort}
          onChange={(v) => setParam("sort", v === "favorites" ? null : v)}
          options={SORTS}
        />
      </div>

      <div
        aria-busy={builds.isFetching}
        className={cn(builds.isPlaceholderData && "opacity-60 transition-opacity")}
      >
        {builds.isPending ? (
          <Skeleton className="h-72 rounded-card" />
        ) : builds.isError && !builds.data ? (
          <ErrorState
            error={builds.error}
            title="Builds indisponibles"
            onRetry={() => void builds.refetch()}
          />
        ) : list.length === 0 ? (
          <EmptyState
            title="Aucun build publié"
            description="La source ne référence aucun build publié pour ce héros."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
            <ul
              aria-label="Builds du héros"
              className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2 lg:mx-0 lg:max-h-[640px] lg:flex-col lg:overflow-y-auto lg:px-0 lg:pb-0"
            >
              {list.map((b) => {
                const on = b.buildId === selected?.buildId;
                const fav = favoritesText(b, sort);
                const preview = b.categories.flatMap((c) => c.items).slice(0, 6);
                return (
                  <li key={b.buildId} className="w-[240px] shrink-0 snap-start lg:w-auto">
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => setParam("build", String(b.buildId))}
                      className={cn(
                        "pressable w-full rounded-2xl border p-3 text-left",
                        on ? "bg-white/[0.07]" : "border-border bg-surface hover:bg-surface-strong",
                      )}
                      style={
                        on
                          ? { borderColor: `color-mix(in srgb, ${color} 55%, transparent)` }
                          : undefined
                      }
                    >
                      <span className="block truncate text-sm font-semibold">{buildTitle(b)}</span>
                      <span className="mt-0.5 flex items-center justify-between gap-2 text-[11px] text-subtle tabular-nums">
                        <span>{fav ?? "Favoris non renseignés pour ce tri"}</span>
                        {b.updatedAt && <span>{formatDate(b.updatedAt)}</span>}
                      </span>
                      <span className="mt-2 flex gap-1" aria-hidden="true">
                        {preview.map((it, i) => (
                          <ItemThumb
                            key={`${it.itemId}-${i}`}
                            item={catalogById.get(it.itemId) ?? null}
                            size={26}
                          />
                        ))}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {selected && (
              <BuildDetail
                build={selected}
                sort={sort}
                heroId={heroId}
                catalog={catalogById}
                color={color}
              />
            )}
          </div>
        )}
      </div>
      {builds.data && <DataMetaNotice meta={builds.data.meta} />}
    </div>
  );
}
