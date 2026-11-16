import { useMemo, useState } from "react";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { DataMetaNotice } from "@/components/DataMetaNotice";
import { ErrorState } from "@/components/ErrorState";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, Input, Skeleton, cn } from "@/components/ui";
import { HeroCard } from "@/features/heroes/HeroCard";
import { useHeroes } from "@/features/heroes/hooks";
import { ROLES, ROLE_LABELS } from "@/features/heroes/roles";
import type { HeroRole } from "@/api";

export function HeroesPage() {
  useDocumentTitle("Héros");
  const heroes = useHeroes();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<HeroRole | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (heroes.data?.items ?? []).filter(
      (h) => (!role || h.role === role) && (!needle || h.name.toLowerCase().includes(needle)),
    );
  }, [heroes.data, query, role]);

  return (
    <div>
      <PageHeader
        title="Héros"
        description="Le catalogue des héros jouables : rôle, capacités et statistiques de méta."
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-72">
          <Input
            type="search"
            aria-label="Filtrer les héros par nom"
            placeholder="Filtrer par nom"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div role="group" aria-label="Filtrer par rôle" className="flex flex-wrap gap-1.5">
          {[null, ...ROLES].map((r) => (
            <button
              key={r ?? "all"}
              type="button"
              aria-pressed={role === r}
              onClick={() => setRole(r)}
              className={cn(
                "pressable hover-text h-9 rounded-full border px-3.5 text-sm",
                role === r
                  ? "border-border-strong bg-surface-strong text-text"
                  : "border-border bg-transparent text-muted",
              )}
            >
              {r ? ROLE_LABELS[r] : "Tous"}
            </button>
          ))}
        </div>
      </div>

      {heroes.isPending ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-busy="true">
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-card" />
          ))}
        </div>
      ) : heroes.isError ? (
        <ErrorState
          error={heroes.error}
          title="Catalogue indisponible"
          onRetry={() => void heroes.refetch()}
        />
      ) : visible.length === 0 ? (
        <EmptyState title="Aucun héros" description="Aucun héros ne correspond à ces filtres." />
      ) : (
        <>
          <p className="mb-3 text-sm text-muted" aria-live="polite">
            {visible.length} héros
          </p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
