import { useMemo, useState } from "react";
import { Link } from "react-router";
import type { HeroSummary } from "@/api";
import { BulletBar, DeltaChip } from "@/components/charts";
import { HeroPortrait } from "@/components/media/HeroPortrait";
import { DoubleBezel, EmptyState, Input, Segmented, Skeleton, cn } from "@/components/ui";
import { formatDecimal, formatPercent } from "@/lib/format";
import type { HeroRow } from "@/lib/stats";

type Sort = "matches" | "winRate" | "kda";

/** Liste comparative des héros joués : recherche, tri, écart face à la méta. Les chiffres portent sur l'historique observé. */
export function HeroesTab({
  rows,
  heroById,
  selected,
  scopeText,
  state,
}: {
  rows: HeroRow[];
  heroById: Map<number, HeroSummary>;
  selected: number | null;
  scopeText: string;
  state: "loading" | "error" | "ready";
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("matches");

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = rows.filter((h) => !needle || h.heroName.toLowerCase().includes(needle));
    return [...list].sort((a, b) =>
      sort === "matches"
        ? b.matches - a.matches
        : sort === "winRate"
          ? (b.winRate ?? -1) - (a.winRate ?? -1)
          : (b.kda ?? -1) - (a.kda ?? -1),
    );
  }, [rows, q, sort]);

  if (state === "loading")
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Chargement des héros">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[68px] rounded-card" />
        ))}
      </div>
    );
  if (state === "error")
    return (
      <EmptyState
        title="Héros indisponibles"
        description="Les statistiques par héros sont indisponibles pour le moment."
      />
    );
  if (rows.length === 0) {
    return (
      <EmptyState
        title="Aucun héros"
        description="Aucune partie sur ce périmètre : changez la période ou le mode."
      />
    );
  }

  return (
    <div className="space-y-4">
      <DoubleBezel size="md" innerClassName="flex flex-wrap items-center gap-3 p-3.5">
        <div className="w-full sm:w-72">
          <label className="sr-only" htmlFor="hero-q">
            Rechercher un héros
          </label>
          <Input
            id="hero-q"
            type="search"
            placeholder="Rechercher un héros"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Segmented<Sort>
          ariaLabel="Trier les héros"
          value={sort}
          onChange={setSort}
          options={[
            { value: "matches", label: "Parties" },
            { value: "winRate", label: "Victoires" },
            { value: "kda", label: "KDA" },
          ]}
        />
        <span className="ml-auto text-xs text-subtle">
          {shown.length} héros · {scopeText}
        </span>
      </DoubleBezel>

      <DoubleBezel size="lg" innerClassName="p-0">
        <ul aria-label="Héros joués">
          {shown.map((h) => {
            const hero = heroById.get(h.heroId);
            const color = hero?.color ?? "var(--accent)";
            return (
              <li
                key={h.heroId}
                id={`hero-${h.heroId}`}
                className={cn(
                  "border-t border-divider first:border-t-0",
                  selected === h.heroId && "bg-accent/10",
                )}
                aria-current={selected === h.heroId ? "true" : undefined}
              >
                <div className="grid min-h-[68px] grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-2.5 sm:grid-cols-[minmax(0,1.4fr)_90px_minmax(0,1.2fr)_90px_120px]">
                  <Link
                    to={`/heroes/${h.heroId}`}
                    className="pressable flex min-w-0 items-center gap-3"
                  >
                    <HeroPortrait
                      name={h.heroName}
                      src={hero?.images.small ?? h.heroImageUrl}
                      color={color}
                      rounded="xl"
                      className="size-11 ring-1 ring-white/10"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{h.heroName}</span>
                      {h.few && (
                        <span className="text-[11px] text-subtle">
                          peu de parties : écart peu fiable
                        </span>
                      )}
                    </span>
                  </Link>
                  <span className="hidden text-sm tabular-nums sm:block">
                    {h.matches}
                    <span className="block text-xs text-subtle">
                      {h.wins} V · {h.losses} D
                    </span>
                  </span>
                  <span className="hidden sm:block">
                    <span className="text-sm tabular-nums">{formatPercent(h.winRate)}</span>
                    <span className="mt-1.5 block">
                      <BulletBar
                        value={h.winRate}
                        mark={h.metaWinRate}
                        color={color}
                        label={`${h.heroName} : ${formatPercent(h.winRate)}, méta ${formatPercent(h.metaWinRate)}`}
                      />
                    </span>
                  </span>
                  <span className="hidden text-sm tabular-nums sm:block">
                    {formatDecimal(h.kda)}
                    <span className="block text-xs text-subtle">
                      KDA
                      {h.kdaSampleSize < h.matches ? ` (${h.kdaSampleSize} sur ${h.matches})` : ""}
                    </span>
                  </span>
                  <span className="flex flex-col items-end gap-1 text-right">
                    <span className="text-sm tabular-nums sm:hidden">
                      {h.matches} parties · {formatPercent(h.winRate)}
                    </span>
                    <DeltaChip
                      value={h.delta}
                      unit=" pts"
                      threshold={0.5}
                      context="face à la méta"
                    />
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </DoubleBezel>
    </div>
  );
}
