import { Popover } from "@base-ui/react/popover";
import { useState } from "react";
import { Link, useParams } from "react-router";
import {
  isApiError,
  type HeroAbility,
  type HeroDetail,
  type HeroMetaStats,
  type RankTier,
} from "@/api";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { BrandLoader } from "@/components/brand";
import { ChartFrame, DeltaChip, RadialGauge } from "@/components/charts";
import { DataMetaNotice } from "@/components/DataMetaNotice";
import { ErrorState } from "@/components/ErrorState";
import { HeroPortrait } from "@/components/media/HeroPortrait";
import { RankBadge } from "@/components/media/RankBadge";
import { Button, EmptyState, Skeleton, buttonStyles } from "@/components/ui";
import { useHero, useHeroStats, useRanks } from "@/features/heroes/hooks";
import { ROLE_LABELS, complexityLabel } from "@/features/heroes/roles";
import { formatDecimal, formatInt, formatPercent } from "@/lib/format";
import { kda } from "@/lib/stats";

function AbilityRow({ ability, color }: { ability: HeroAbility; color: string }) {
  return (
    <Popover.Root>
      <Popover.Trigger
        className="pressable card-hero flex w-full items-center gap-4 p-4 text-left hover:brightness-110"
        style={{ ["--hc" as string]: color }}
      >
        <HeroPortrait
          name={ability.name}
          src={ability.imageUrl}
          rounded="xl"
          className="size-14 ring-2"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{ability.name}</span>
          <span className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            {ability.type === "ultimate" && (
              <span
                className="rounded-full px-2 py-0.5 font-medium"
                style={{ background: `color-mix(in srgb, ${color} 22%, transparent)`, color }}
              >
                Ultime
              </span>
            )}
            {ability.cooldownSeconds ? (
              <span className="text-muted tabular-nums">
                Recharge {formatInt(ability.cooldownSeconds)} s
              </span>
            ) : (
              <span className="text-subtle">Passive</span>
            )}
          </span>
        </span>
        <span className="text-xs text-subtle">Détails</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} className="z-50">
          <Popover.Popup className="surface-solid max-w-sm p-4 text-sm leading-relaxed text-muted outline-none">
            <p className="mb-1.5 font-semibold text-text">{ability.name}</p>
            {ability.description || "Description indisponible."}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function TierBars({
  stats,
  ranks,
  color,
}: {
  stats: HeroMetaStats;
  ranks: RankTier[] | undefined;
  color: string;
}) {
  const rows = stats.winRateByTier;
  const known = rows.filter((r) => r.winRate !== null);
  const lo = Math.min(40, ...known.map((r) => r.winRate as number)) - 2;
  const hi = Math.max(60, ...known.map((r) => r.winRate as number)) + 2;
  return (
    <div>
      <div className="relative flex h-44 items-end gap-1.5">
        <span
          aria-hidden="true"
          className="absolute inset-x-0 border-t border-dashed border-white/30"
          style={{ bottom: `${((50 - lo) / (hi - lo)) * 100}%` }}
        >
          <span className="absolute -top-4 right-0 text-[10px] text-subtle">50 %</span>
        </span>
        {rows.map((r) => {
          const rank = ranks?.find((x) => x.tier === r.tier);
          const h = r.winRate === null ? 6 : ((r.winRate - lo) / (hi - lo)) * 100;
          return (
            <div
              key={r.tier}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1"
              title={`${rank?.name ?? r.tier} : ${r.winRate === null ? "échantillon trop faible" : `${r.winRate} %`}`}
            >
              {r.winRate !== null && (
                <span className="text-[10px] text-muted tabular-nums">{Math.round(r.winRate)}</span>
              )}
              <span
                className="w-full rounded-t-md"
                style={{
                  height: `${h}%`,
                  background:
                    r.winRate === null
                      ? "repeating-linear-gradient(45deg, rgb(255 255 255 / .08) 0 4px, transparent 4px 8px)"
                      : `linear-gradient(180deg, ${rank?.color ?? color}, color-mix(in srgb, ${rank?.color ?? color} 35%, transparent))`,
                  border: r.winRate === null ? "1px dashed rgb(255 255 255 / .15)" : undefined,
                }}
              />
              <RankBadge name={rank?.name} imageUrl={rank?.imageUrl} size="sm" />
              <span className="sr-only">
                {rank?.name} : {r.winRate === null ? "échantillon trop faible" : `${r.winRate} %`}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-subtle">
        Paliers sans barre pleine : échantillon trop faible (moins de 200 parties).
      </p>
    </div>
  );
}

function MetaSection({ hero }: { hero: HeroDetail }) {
  const stats = useHeroStats(String(hero.id));
  const ranks = useRanks();
  if (stats.isPending) return <Skeleton className="h-64 rounded-card" />;
  if (stats.isError)
    return (
      <ErrorState
        error={stats.error}
        title="Statistiques indisponibles"
        onRetry={() => void stats.refetch()}
      />
    );
  const s = stats.data.stats;
  const heroKda = kda(s.avgKills, s.avgDeaths, s.avgAssists);
  const known = s.winRateByTier.filter((t) => t.winRate !== null);
  const best = known.sort((a, b) => (b.winRate as number) - (a.winRate as number))[0];
  const bestRank = ranks.data?.items.find((r) => r.tier === best?.tier);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div
          className="card-hero flex items-center gap-4 p-5"
          style={{ ["--hc" as string]: "#3DD68C" }}
        >
          <RadialGauge
            value={s.winRate}
            mark={50}
            size={72}
            label={`Taux de victoire ${formatPercent(s.winRate)}`}
          >
            <span className="text-xs font-semibold tabular-nums">
              {s.winRate === null ? "n/d" : `${Math.round(s.winRate)} %`}
            </span>
          </RadialGauge>
          <div>
            <p className="text-xs text-muted">Taux de victoire</p>
            <DeltaChip
              value={s.winRate === null ? null : s.winRate - 50}
              unit=" pts"
              threshold={0.5}
              context="face à 50 %"
            />
          </div>
        </div>
        <div className="card-hero p-5" style={{ ["--hc" as string]: hero.color }}>
          <p className="text-xs text-muted">Taux de choix</p>
          <p className="mt-2 text-[28px] leading-none font-semibold tabular-nums">
            {formatPercent(s.pickRate)}
          </p>
          <p className="mt-2 text-xs text-subtle">des parties des 30 derniers jours</p>
        </div>
        <div className="card-hero p-5" style={{ ["--hc" as string]: "#8B7CFF" }}>
          <p className="text-xs text-muted">KDA moyen</p>
          <p className="mt-2 text-[28px] leading-none font-semibold tabular-nums">
            {formatDecimal(heroKda)}
          </p>
          <p className="mt-2 text-xs text-subtle tabular-nums">
            {formatDecimal(s.avgKills)} / {formatDecimal(s.avgDeaths)} /{" "}
            {formatDecimal(s.avgAssists)}
          </p>
        </div>
        <div className="card-hero p-5" style={{ ["--hc" as string]: "#F5B14C" }}>
          <p className="text-xs text-muted">Parties analysées</p>
          <p className="mt-2 text-[28px] leading-none font-semibold tabular-nums">
            {formatInt(s.matches)}
          </p>
          {best && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-subtle">
              Meilleur palier :{" "}
              <RankBadge name={bestRank?.name} imageUrl={bestRank?.imageUrl} size="sm" label />
            </p>
          )}
        </div>
      </div>
      <ChartFrame
        id={`tiers-${hero.id}`}
        title="Taux de victoire par rang"
        subtitle="30 derniers jours, par palier de rang"
        summary={s.winRateByTier
          .map(
            (t) =>
              `${ranks.data?.items.find((r) => r.tier === t.tier)?.name ?? t.tier} : ${t.winRate === null ? "n/d" : `${t.winRate} %`}`,
          )
          .join(", ")}
        points={known.length ? 5 : 0}
      >
        <TierBars stats={stats.data.stats} ranks={ranks.data?.items} color={hero.color} />
      </ChartFrame>
      <DataMetaNotice meta={stats.data.meta} />
    </div>
  );
}

export function HeroPage() {
  const { heroId = "" } = useParams();
  const query = useHero(heroId);
  const [loreOpen, setLoreOpen] = useState(false);
  useDocumentTitle(query.data?.hero.name ?? "Héros");

  if (query.isPending) return <BrandLoader message="Le Doorman range le catalogue" />;
  if (query.isError) {
    if (isApiError(query.error) && (query.error.status === 404 || query.error.status === 400)) {
      return (
        <EmptyState
          icon="search"
          title="Héros introuvable"
          description="Ce héros n'existe pas dans le catalogue."
          action={
            <Link to="/heroes" className={buttonStyles("secondary")}>
              Tous les héros
            </Link>
          }
        />
      );
    }
    return (
      <ErrorState
        error={query.error}
        title="Héros indisponible"
        onRetry={() => void query.refetch()}
      />
    );
  }

  const { hero } = query.data;
  const lore = hero.lore;
  const short = lore.length > 320 && !loreOpen ? `${lore.slice(0, 320).trimEnd()}…` : lore;

  return (
    <div className="space-y-10" style={{ ["--hc" as string]: hero.color }}>
      <Link to="/heroes" className="text-sm text-muted underline underline-offset-4 hover-text">
        Tous les héros
      </Link>

      <header className="card-hero relative min-h-[260px]">
        <img
          src={hero.images.background}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-10 size-full object-cover object-top opacity-45"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-r from-bg/90 via-bg/55 to-transparent"
        />
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:p-10">
          <HeroPortrait
            name={hero.name}
            src={hero.images.card}
            color={hero.color}
            className="aspect-[4/5] w-36 border-2 sm:w-44"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap gap-1.5 text-xs font-medium">
              <span
                className="rounded-full px-2.5 py-1"
                style={{
                  background: `color-mix(in srgb, ${hero.color} 24%, transparent)`,
                  color: hero.color,
                }}
              >
                {ROLE_LABELS[hero.role]}
              </span>
              {hero.gunTag && (
                <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-text">
                  {hero.gunTag}
                </span>
              )}
              <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-text">
                Complexité : {complexityLabel(hero.complexity)}
              </span>
            </div>
            <h1
              className="mt-3 text-5xl sm:text-6xl"
              style={{ textShadow: `0 0 40px color-mix(in srgb, ${hero.color} 40%, transparent)` }}
            >
              {hero.name}
            </h1>
            {hero.tags.length > 0 && (
              <p className="mt-2 text-sm text-muted">{hero.tags.join(" · ")}</p>
            )}
          </div>
        </div>
      </header>

      {lore && (
        <section aria-labelledby="lore" className="max-w-3xl">
          <h2 id="lore" className="text-xl">
            Histoire
          </h2>
          <p className="mt-3 leading-relaxed text-muted">{short}</p>
          {lore.length > 320 && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => setLoreOpen((v) => !v)}
            >
              {loreOpen ? "Réduire" : "Lire la suite"}
            </Button>
          )}
        </section>
      )}

      <section aria-labelledby="capacites" className="space-y-4">
        <h2 id="capacites" className="text-xl">
          Capacités
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {hero.abilities.map((a) => (
            <AbilityRow key={a.id} ability={a} color={hero.color} />
          ))}
        </div>
      </section>

      {hero.stats.length > 0 && (
        <section aria-labelledby="base" className="space-y-4">
          <h2 id="base" className="text-xl">
            Statistiques de base
          </h2>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {hero.stats.map((s) => (
              <div key={s.key} className="card-hero p-4">
                <dt className="text-xs text-muted">{s.label}</dt>
                <dd className="mt-1 text-2xl font-semibold tracking-[-0.03em] tabular-nums">
                  {formatDecimal(s.value).replace(/,00$/, "")}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section aria-labelledby="meta" className="space-y-4">
        <h2 id="meta" className="text-xl">
          Méta
        </h2>
        <MetaSection hero={hero} />
      </section>
    </div>
  );
}
