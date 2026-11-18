import { useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataMetaNotice } from "@/components/DataMetaNotice";
import { ErrorState } from "@/components/ErrorState";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { HeroCard } from "@/features/heroes/HeroCard";
import { useHeroes } from "@/features/heroes/hooks";
import { ROLES, ROLE_LABELS } from "@/features/heroes/roles";
import { useHeroFilters } from "@/features/heroes/useHeroFilters";
import { Button, EmptyState, SearchField, Segmented, Skeleton } from "@/components/ui";

const GRID = "grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))]";

export function HeroesPage() {
  useDocumentTitle("Héros");
  const heroes = useHeroes();
  const f = useHeroFilters();

  const visible = useMemo(() => {
    const needle = f.q.trim().toLowerCase();
    const list = (heroes.data?.items ?? []).filter(
      (h) => (!f.role || h.role === f.role) && (!needle || h.name.toLowerCase().includes(needle)),
    );
    return [...list].sort((a, b) =>
      f.sort === "role"
        ? a.role.localeCompare(b.role) || a.name.localeCompare(b.name)
        : f.sort === "complexity"
          ? (a.complexity ?? 9) - (b.complexity ?? 9) || a.name.localeCompare(b.name)
          : a.name.localeCompare(b.name),
    );
  }, [heroes.data, f.q, f.role, f.sort]);

  return (
    <div>
      <PageHeader
        title="Héros"
        description="Le catalogue des héros jouables. Ouvrez une fiche pour ses capacités, ses builds et ses statistiques de méta."
      />

      <div className="mb-5 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <SearchField
            label="Filtrer les héros par nom"
            placeholder="Filtrer par nom"
            value={f.q}
            onChange={(e) => f.setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && f.setQ("")}
            className="w-full sm:w-72"
          />
          <Segmented
            ariaLabel="Trier les héros"
            className="sm:ml-auto"
            value={f.sort}
            onChange={f.setSort}
            options={[
              { value: "name", label: "Nom" },
              { value: "role", label: "Rôle" },
              { value: "complexity", label: "Complexité" },
            ]}
          />
        </div>
        <div role="group" aria-label="Filtrer par rôle" className="flex flex-wrap gap-1.5">
          {[null, ...ROLES].map((r) => {
            const color = r ? `var(--role-${r})` : "var(--text)";
            return (
              <button
                key={r ?? "all"}
                type="button"
                aria-pressed={f.role === r}
                onClick={() => f.setRole(r)}
                className="pressable hover-text h-9 rounded-full border px-3.5 text-sm"
                style={
                  f.role === r
                    ? {
                        borderColor: `color-mix(in srgb, ${color} 55%, transparent)`,
                        background: `color-mix(in srgb, ${color} 16%, transparent)`,
                        color,
                      }
                    : { borderColor: "var(--border)", color: "var(--muted)" }
                }
              >
                {r ? ROLE_LABELS[r] : "Tous"}
              </button>
            );
          })}
        </div>
      </div>

      {heroes.isPending ? (
        <div className={GRID} aria-busy="true">
          {Array.from({ length: 14 }, (_, i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
          ))}
        </div>
      ) : heroes.isError ? (
        <ErrorState
          error={heroes.error}
          title="Catalogue indisponible"
          onRetry={() => void heroes.refetch()}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title="Aucun héros"
          description="Aucun héros ne correspond à ces filtres."
          action={
            <Button variant="secondary" onClick={f.reset}>
              Réinitialiser les filtres
            </Button>
          }
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-muted tabular-nums" aria-live="polite">
            {visible.length} héros
            {f.active && heroes.data ? ` sur ${heroes.data.items.length}` : ""}
          </p>
          <ul className={GRID}>
            {visible.map((h) => (
              <li key={h.id}>
                <HeroCard hero={h} />
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <DataMetaNotice meta={heroes.data.meta} />
          </div>
        </>
      )}
    </div>
  );
}
