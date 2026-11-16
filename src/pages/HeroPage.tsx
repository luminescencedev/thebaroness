import { Link, useParams } from "react-router";
import { isApiError } from "@/api";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { BarList } from "@/components/charts";
import { DataMetaNotice } from "@/components/DataMetaNotice";
import { ErrorState } from "@/components/ErrorState";
import { HeroPortrait } from "@/components/media/HeroPortrait";
import { RankBadge } from "@/components/media/RankBadge";
import { Card, EmptyState, Skeleton, Tag, buttonStyles } from "@/components/ui";
import { useHero, useHeroStats, useRanks } from "@/features/heroes/hooks";
import { ROLE_LABELS, complexityLabel } from "@/features/heroes/roles";
import { formatDecimal, formatInt, formatPercent } from "@/lib/format";

function MetaStats({ heroId }: { heroId: string }) {
  const stats = useHeroStats(heroId);
  const ranks = useRanks();

  if (stats.isPending) return <Skeleton className="h-48 rounded-card" />;
  if (stats.isError)
    return (
      <ErrorState
        error={stats.error}
        title="Statistiques indisponibles"
        onRetry={() => void stats.refetch()}
      />
    );

  const s = stats.data.stats;
  const tiers = s.winRateByTier.filter((t) => t.winRate !== null);
  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Parties analysées", formatInt(s.matches)],
          ["Taux de victoire", formatPercent(s.winRate)],
          ["Taux de choix", formatPercent(s.pickRate)],
          [
            "KDA moyen",
            s.avgKills !== null && s.avgDeaths && s.avgAssists !== null
              ? formatDecimal((s.avgKills + s.avgAssists) / s.avgDeaths)
              : "n/d",
          ],
        ].map(([label, value]) => (
          <Card key={label} className="p-4">
            <dt className="text-xs text-subtle">{label}</dt>
            <dd className="mt-1 text-2xl font-semibold tracking-[-0.03em]">{value}</dd>
          </Card>
        ))}
      </dl>

      {tiers.length > 0 && (
        <Card>
          <h3 className="text-base">Taux de victoire par rang</h3>
          <p className="mt-1 mb-4 text-sm text-muted">Rangs avec un échantillon suffisant.</p>
          <BarList
            max={60}
            items={tiers.map((t) => {
              const rank = ranks.data?.items.find((r) => r.tier === t.tier);
              return {
                key: String(t.tier),
                value: t.winRate ?? 0,
                display: formatPercent(t.winRate),
                color: rank?.color,
                label: (
                  <>
                    <RankBadge name={rank?.name} imageUrl={rank?.imageUrl} size="sm" />
                    {rank?.name ?? `Rang ${t.tier}`}
                  </>
                ),
              };
            })}
          />
        </Card>
      )}
      <DataMetaNotice meta={stats.data.meta} />
    </div>
  );
}

export function HeroPage() {
  const { heroId = "" } = useParams();
  const query = useHero(heroId);
  useDocumentTitle(query.data?.hero.name ?? "Héros");

  if (query.isPending) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-64 rounded-card" />
        <Skeleton className="h-40 rounded-card" />
      </div>
    );
  }
  if (query.isError) {
    if (isApiError(query.error) && (query.error.status === 404 || query.error.status === 400)) {
      return (
        <EmptyState
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

  return (
    <div className="space-y-12">
      <Link to="/heroes" className="text-sm text-muted underline underline-offset-4 hover-text">
        Tous les héros
      </Link>

      <header
        className="card relative isolate overflow-hidden"
        style={{ ["--hero" as string]: hero.color }}
      >
        <img
          src={hero.images.background}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-10 size-full object-cover object-top opacity-40"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-r from-bg via-bg/80 to-transparent"
        />
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:p-10">
          <HeroPortrait
            name={hero.name}
            src={hero.images.card}
            color={hero.color}
            className="aspect-[4/5] w-36 border border-border-strong sm:w-44"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap gap-1.5">
              <Tag style={{ borderColor: `${hero.color}66`, color: hero.color }}>
                {ROLE_LABELS[hero.role]}
              </Tag>
              {hero.gunTag && <Tag>{hero.gunTag}</Tag>}
              <Tag>Complexité : {complexityLabel(hero.complexity)}</Tag>
            </div>
            <h1 className="mt-3 text-4xl sm:text-6xl">{hero.name}</h1>
            {hero.tags.length > 0 && (
              <p className="mt-2 text-sm text-muted">{hero.tags.join(" · ")}</p>
            )}
          </div>
        </div>
      </header>

      {hero.lore && (
        <section aria-labelledby="lore" className="max-w-3xl">
          <h2 id="lore" className="text-xl">
            Histoire
          </h2>
          <p className="mt-3 leading-relaxed text-muted">{hero.lore}</p>
        </section>
      )}

      <section aria-labelledby="capacites" className="space-y-4">
        <h2 id="capacites" className="text-xl">
          Capacités
        </h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {hero.abilities.map((a) => (
            <li key={a.id}>
              <Card className="flex h-full gap-4">
                <HeroPortrait name={a.name} src={a.imageUrl} className="size-14" rounded="lg" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <h3 className="text-base">{a.name}</h3>
                    {a.type === "ultimate" && (
                      <span className="text-xs text-accent-text">Ultime</span>
                    )}
                    {a.cooldownSeconds ? (
                      <span className="text-xs text-subtle">
                        Recharge : {formatInt(a.cooldownSeconds)} s
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{a.description}</p>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {hero.stats.length > 0 && (
        <section aria-labelledby="base" className="space-y-4">
          <h2 id="base" className="text-xl">
            Statistiques de base
          </h2>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {hero.stats.map((s) => (
              <Card key={s.key} className="p-4">
                <dt className="text-xs text-subtle">{s.label}</dt>
                <dd className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                  {formatDecimal(s.value).replace(/,00$/, "")}
                </dd>
              </Card>
            ))}
          </dl>
        </section>
      )}

      <section aria-labelledby="meta" className="space-y-4">
        <h2 id="meta" className="text-xl">
          Statistiques de méta
        </h2>
        <MetaStats heroId={heroId} />
      </section>
    </div>
  );
}
