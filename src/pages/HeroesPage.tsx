import { useMemo, useState } from "react";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { DataMetaNotice } from "@/components/DataMetaNotice";
import { ErrorState } from "@/components/ErrorState";
import { PageHeader } from "@/components/PageHeader";
import { Button, EmptyState, Input, Skeleton } from "@/components/ui";
import { HeroCard } from "@/features/heroes/HeroCard";
import { useHeroes } from "@/features/heroes/hooks";
import { ROLES, ROLE_LABELS } from "@/features/heroes/roles";
import { Segmented } from "@/components/ui";
import type { HeroRole } from "@/api";

export function HeroesPage() {
  useDocumentTitle("Héros");
  const heroes = useHeroes();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<HeroRole | null>(null);
  const [sort, setSort] = useState<"name" | "role" | "complexity">("name");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = (heroes.data?.items ?? []).filter(
      (h) => (!role || h.role === role) && (!needle || h.name.toLowerCase().includes(needle)),
    );
    return [...list].sort((a, b) =>
      sort === "role"
        ? a.role.localeCompare(b.role) || a.name.localeCompare(b.name)
        : sort === "complexity"
          ? (a.complexity ?? 9) - (b.complexity ?? 9) || a.name.localeCompare(b.name)
          : a.name.localeCompare(b.name),
    );
  }, [heroes.data, query, role, sort]);

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
          {[null, ...ROLES].map((r) => {
            const color = r ? `var(--role-${r})` : "var(--text)";
            return (
              <button
                key={r ?? "all"}
                type="button"
                aria-pressed={role === r}
                onClick={() => setRole(r)}
                className="pressable hover-text h-9 rounded-full border px-3.5 text-sm"
                style={
                  role === r
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
        <Segmented
          ariaLabel="Trier les héros"
          className="ml-auto"
          value={sort}
          onChange={setSort}
          options={[
            { value: "name", label: "Nom" },
            { value: "role", label: "Rôle" },
            { value: "complexity", label: "Complexité" },
          ]}
        />
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
        <EmptyState
          title="Aucun héros"
          description="Aucun héros ne correspond à ces filtres."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setQuery("");
                setRole(null);
              }}
            >
              Réinitialiser les filtres
            </Button>
          }
        />
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
