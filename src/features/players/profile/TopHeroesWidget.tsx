import { Link } from "react-router";
import { BulletBar } from "@/components/charts";
import { HeroPortrait } from "@/components/media/HeroPortrait";
import { DoubleBezel } from "@/components/ui";
import { formatDecimal, formatPercent } from "@/lib/format";
import type { HeroSummary, OverviewHero } from "@/api";
import { Skeleton } from "@/components/ui";

export type TopHero = OverviewHero & { metaWinRate: number | null };

/** Trois héros par volume de parties : vrai portrait, parties, taux de victoire, KDA. */
export function TopHeroesWidget({
  rows,
  heroById,
  steamId,
  state,
  scopeQuery = "",
}: {
  rows: TopHero[];
  heroById: Map<number, HeroSummary>;
  steamId: string;
  state: "loading" | "error" | "ready";
  /** Scope courant reporté dans les liens (ex. "&period=7d"), pour garder le même périmètre. */
  scopeQuery?: string;
}) {
  const top = rows.slice(0, 3);
  return (
    <DoubleBezel size="md" innerClassName="p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[15px]">Héros les plus joués</h2>
        <Link
          to={`/players/${steamId}?tab=heroes${scopeQuery}`}
          className="text-xs text-accent-text underline-offset-4 hover:underline"
        >
          Tous les héros
        </Link>
      </div>
      {state === "loading" ? (
        <div className="mt-3 space-y-3" aria-busy="true">
          <Skeleton className="h-11 rounded-lg" />
          <Skeleton className="h-11 rounded-lg" />
        </div>
      ) : state === "error" ? (
        <p className="mt-3 text-sm text-subtle">Héros indisponibles pour le moment.</p>
      ) : top.length === 0 ? (
        <p className="mt-3 text-sm text-subtle">Aucun héros sur cette période.</p>
      ) : (
        <ul className="mt-3 space-y-3.5">
          {top.map((h) => {
            const color = heroById.get(h.heroId)?.color ?? "var(--accent)";
            return (
              <li key={h.heroId}>
                <Link
                  to={`/players/${steamId}?tab=heroes&hero=${h.heroId}${scopeQuery}`}
                  className="pressable flex items-center gap-3"
                >
                  <HeroPortrait
                    name={h.heroName}
                    src={h.heroImageUrl}
                    color={color}
                    rounded="xl"
                    className="size-11 ring-1 ring-white/10"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{h.heroName}</span>
                      <span className="text-xs text-muted tabular-nums">{h.matches} parties</span>
                    </span>
                    <span className="mt-1 flex items-center gap-2 text-xs text-subtle">
                      <span className="tabular-nums">{formatPercent(h.winRate)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">KDA {formatDecimal(h.kda)}</span>
                    </span>
                    <span className="mt-1.5 block">
                      <BulletBar
                        value={h.winRate}
                        mark={h.metaWinRate}
                        color={color}
                        label={`${h.heroName} : ${formatPercent(h.winRate)} de victoires`}
                      />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </DoubleBezel>
  );
}
