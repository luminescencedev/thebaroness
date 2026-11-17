import type { HeroSummary, OutcomeFilter } from "@/api";
import { ErrorState } from "@/components/ErrorState";
import { Button, DoubleBezel, EmptyState, Segmented, Skeleton } from "@/components/ui";
import { usePlayerMatches } from "@/features/players/hooks";
import { OUTCOMES, type MatchFilters } from "../scope";
import { MatchRow } from "./MatchRow";

const select =
  "h-10 rounded-[10px] border border-border-strong bg-surface px-3 text-[13px] text-muted outline-none focus-visible:outline-2 focus-visible:outline-focus";

/**
 * Historique filtré PAR LE SERVEUR (période, format, type, héros, résultat) avant pagination :
 * le curseur appartient à la sélection, un filtre modifié repart de la première page (clé de requête).
 * Le serveur trie du plus récent au plus ancien : aucun autre tri n'est proposé.
 */
export function MatchesTab({
  steamId,
  filters,
  heroOptions,
  heroById,
  scopeText,
  onFilters,
}: {
  steamId: string;
  filters: MatchFilters;
  heroOptions: { id: number; name: string; n: number }[];
  heroById: Map<number, HeroSummary>;
  scopeText: string;
  onFilters: (patch: { outcome?: OutcomeFilter; heroId?: number | null }) => void;
}) {
  const q = usePlayerMatches(steamId, filters);
  const matches = q.data?.pages.flatMap((p) => p.items) ?? [];
  const filtersOn = filters.outcome !== "all" || filters.heroId !== null;
  const reset = () => onFilters({ outcome: "all", heroId: null });

  // Le héros filtré reste sélectionnable même s'il n'a aucune partie dans le scope courant.
  const options =
    filters.heroId !== null && !heroOptions.some((h) => h.id === filters.heroId)
      ? [
          ...heroOptions,
          {
            id: filters.heroId,
            name: heroById.get(filters.heroId)?.name ?? `Héros ${filters.heroId}`,
            n: 0,
          },
        ]
      : heroOptions;

  return (
    <div className="space-y-4">
      <DoubleBezel size="md" innerClassName="flex flex-wrap items-center gap-x-4 gap-y-3 p-3.5">
        <Segmented<OutcomeFilter>
          ariaLabel="Résultat"
          value={filters.outcome}
          onChange={(outcome) => onFilters({ outcome })}
          options={OUTCOMES}
        />
        <label className="sr-only" htmlFor="f-hero">
          Héros
        </label>
        <select
          id="f-hero"
          className={select}
          value={filters.heroId ?? ""}
          onChange={(e) => onFilters({ heroId: e.target.value ? Number(e.target.value) : null })}
        >
          <option value="">Tous les héros</option>
          {options.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
              {h.n > 0 ? ` (${h.n})` : ""}
            </option>
          ))}
        </select>
        {filtersOn && (
          <Button variant="ghost" size="sm" onClick={reset}>
            Réinitialiser
          </Button>
        )}
      </DoubleBezel>

      <p className="text-xs text-subtle tabular-nums" aria-live="polite">
        {q.isPending
          ? "Chargement des parties"
          : `${matches.length} partie${matches.length > 1 ? "s" : ""} chargée${matches.length > 1 ? "s" : ""}${q.hasNextPage ? ", d'autres sont disponibles" : ", toute la sélection est chargée"}`}{" "}
        · {scopeText}. Filtré et paginé par le serveur.
      </p>

      {q.isPending ? (
        <div className="space-y-2" aria-busy="true" aria-label="Chargement des parties">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[76px] rounded-card" />
          ))}
        </div>
      ) : q.isError && matches.length === 0 ? (
        <ErrorState
          error={q.error}
          title="Parties indisponibles"
          onRetry={() => void q.refetch()}
        />
      ) : matches.length === 0 ? (
        <EmptyState
          title="Aucune partie ne correspond"
          description="Aucune partie pour ce périmètre et ces filtres. Élargissez la période ou changez de mode."
          action={
            filtersOn ? (
              <Button variant="secondary" onClick={reset}>
                Réinitialiser
              </Button>
            ) : undefined
          }
        />
      ) : (
        <DoubleBezel size="lg" innerClassName="p-0">
          <ul aria-label="Parties">
            {matches.map((m) => (
              <MatchRow key={m.matchId} match={m} heroById={heroById} ownerSteamId={steamId} />
            ))}
          </ul>
        </DoubleBezel>
      )}

      {q.isError && matches.length > 0 && (
        <p role="alert" className="text-center text-xs text-loss">
          La page suivante n'a pas pu être chargée.
        </p>
      )}
      {q.hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            loading={q.isFetchingNextPage}
            onClick={() => void q.fetchNextPage()}
          >
            Charger plus de parties
          </Button>
        </div>
      )}
    </div>
  );
}
