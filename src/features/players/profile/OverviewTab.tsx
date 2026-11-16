import { useMemo, useState } from "react";
import { Link } from "react-router";
import type { HeroRole, HeroSummary, MatchSummary, PlayerProfile } from "@/api";
import {
  AreaChart,
  BulletBar,
  CalendarHeatmap,
  ChartFrame,
  DeltaChip,
  Donut,
  FormStrip,
  Histogram,
  HourBars,
  RadialGauge,
  Sparkline,
  StackedKDA,
  type AreaPoint,
} from "@/components/charts";
import { HeroPortrait } from "@/components/media/HeroPortrait";
import { Button, Card, Segmented, cn } from "@/components/ui";
import { ROLE_LABELS } from "@/features/heroes/roles";
import { MatchesTable } from "@/features/matches/MatchesTable";
import { formatDate, formatDecimal, formatDuration, formatInt, formatPercent } from "@/lib/format";
import {
  calendar,
  hourDistribution,
  kdaBinIndex,
  kdaDistribution,
  matchKda,
  netPerMinute,
  recentDelta,
  rollingWinRate,
  streaks,
  winRateByDuration,
  type Aggregate,
  type HeroRow,
  type RoleRow,
} from "@/lib/stats";

const ROLE_COLOR: Record<HeroRole | "unknown", string> = {
  mystic: "var(--role-mystic)",
  marksman: "var(--role-marksman)",
  brawler: "var(--role-brawler)",
  assassin: "var(--role-assassin)",
  healer: "var(--role-healer)",
  unknown: "var(--subtle)",
};

type Metric = "winRate" | "kda" | "net";
type HeroSort = "matches" | "wins" | "kda";

function KpiCard({
  label,
  accent,
  children,
  className,
}: {
  label: string;
  accent: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("card-hero flex flex-col gap-3 p-[18px]", className)}
      style={{ ["--hc" as string]: accent }}
    >
      <span className="flex items-center gap-2 text-xs text-muted">
        <span className="size-1.5 rounded-full" style={{ background: accent }} aria-hidden="true" />
        {label}
      </span>
      {children}
    </div>
  );
}

const big =
  "text-[28px] leading-none font-semibold tracking-[-0.035em] whitespace-nowrap tabular-nums";

export function OverviewTab({
  profile,
  matches,
  stats,
  roles,
  rows,
  heroById,
  coverage,
  onSeeMatches,
}: {
  profile: PlayerProfile;
  matches: MatchSummary[];
  stats: Aggregate;
  roles: RoleRow[];
  rows: HeroRow[];
  heroById: Map<number, HeroSummary>;
  coverage: string;
  onSeeMatches: () => void;
}) {
  void profile;
  const [metric, setMetric] = useState<Metric>("winRate");
  const [heroSort, setHeroSort] = useState<HeroSort>("matches");

  const delta = useMemo(() => recentDelta(matches), [matches]);
  const streak = useMemo(() => streaks(matches), [matches]);
  const chrono = useMemo(() => [...matches].reverse(), [matches]);
  const rolling = useMemo(() => rollingWinRate(matches), [matches]);
  const kdaDist = useMemo(() => kdaDistribution(matches), [matches]);
  const byDuration = useMemo(() => winRateByDuration(matches), [matches]);
  const weeks = useMemo(() => calendar(matches), [matches]);
  const hours = useMemo(() => hourDistribution(matches), [matches]);

  const kdaSeries = chrono.map(matchKda);
  const npmSeries = chrono.map(netPerMinute);
  const sparkNpm = npmSeries.filter((v): v is number => v !== null).slice(-20);
  const perMatch = stats.matches || 1;

  const startAt = metric === "winRate" ? Math.min(4, Math.max(0, chrono.length - 2)) : 0;
  const chartPoints: AreaPoint[] = chrono.slice(startAt).map((m, k) => {
    const i = k + startAt;
    const lines = [
      `${m.outcome === "win" ? "Victoire" : "Défaite"} · ${formatDate(m.playedAt)}`,
      `${m.kills ?? "n/d"} / ${m.deaths ?? "n/d"} / ${m.assists ?? "n/d"} · ${formatDuration(m.durationSeconds)}`,
    ];
    const value =
      metric === "winRate"
        ? (rolling[i]?.value ?? null)
        : metric === "kda"
          ? (kdaSeries[i] ?? null)
          : (npmSeries[i] ?? null);
    return { value, title: m.heroName, lines };
  });
  const defined = chartPoints.map((p) => p.value).filter((v): v is number => v !== null);
  const avg = defined.length ? defined.reduce((s, v) => s + v, 0) / defined.length : 0;
  const maxValue =
    metric === "winRate"
      ? 100
      : metric === "kda"
        ? Math.max(4, Math.ceil(Math.max(...defined, 1) / 2) * 2)
        : Math.ceil(Math.max(...defined, 1000) / 500) * 500;
  const bestIndex =
    metric === "kda"
      ? kdaSeries.reduce<number>((b, v, i) => (v !== null && v > (kdaSeries[b] ?? -1) ? i : b), 0)
      : undefined;
  const fmt = (v: number) =>
    metric === "winRate"
      ? `${formatDecimal(v).replace(/,00$/, "")} %`
      : metric === "kda"
        ? formatDecimal(v)
        : formatInt(v);

  const sortedRows = [...rows].sort((a, b) =>
    heroSort === "matches"
      ? b.matches - a.matches
      : heroSort === "wins"
        ? b.wins - a.wins
        : (b.kda ?? -1) - (a.kda ?? -1),
  );

  const roleSegments = roles.map((r) => ({
    key: r.role,
    label: r.role === "unknown" ? "Rôle inconnu" : ROLE_LABELS[r.role],
    value: r.matches,
    color: ROLE_COLOR[r.role],
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard label="Victoires" accent="#3DD68C">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <RadialGauge
              value={stats.winRate}
              mark={50}
              label={`Taux de victoire ${formatPercent(stats.winRate)}, repère à 50 %`}
            >
              <span className="text-sm font-semibold tabular-nums">
                {stats.winRate === null ? "n/d" : `${Math.round(stats.winRate)} %`}
              </span>
            </RadialGauge>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm whitespace-nowrap text-text tabular-nums">
                {stats.wins} V · {stats.losses} D
              </span>
              <DeltaChip
                value={delta?.winRate ?? null}
                unit=" pts"
                threshold={0.5}
                context="sur 20 parties"
              />
            </div>
          </div>
        </KpiCard>

        <KpiCard label="KDA" accent="#8B7CFF">
          <div className="flex items-end justify-between gap-2">
            <span className={big}>{formatDecimal(stats.kda)}</span>
            <DeltaChip
              value={delta?.kda ?? null}
              digits={2}
              threshold={0.05}
              context="sur 20 parties"
            />
          </div>
          <StackedKDA k={stats.kills} d={stats.deaths} a={stats.assists} />
          <span className="text-[11px] text-subtle tabular-nums">
            Moyenne {formatDecimal(stats.kills / perMatch)} /{" "}
            {formatDecimal(stats.deaths / perMatch)} / {formatDecimal(stats.assists / perMatch)}
          </span>
        </KpiCard>

        <KpiCard label="Valeur nette par minute" accent="#F5B14C">
          <div className="flex items-end justify-between gap-2">
            <span className={big}>{formatInt(stats.avgNetPerMinute)}</span>
            <DeltaChip
              value={delta?.netPerMinute ?? null}
              digits={0}
              threshold={10}
              context="sur 20 parties"
            />
          </div>
          <Sparkline values={sparkNpm} className="h-9 w-full" />
        </KpiCard>

        <KpiCard label="Durée moyenne" accent="#6FB7FF">
          <span className={big}>{formatDuration(stats.avgDuration)}</span>
          <dl className="grid grid-cols-3 gap-1 text-[11px]">
            {[
              ["Min", stats.minDuration],
              ["Médiane", stats.medianDuration],
              ["Max", stats.maxDuration],
            ].map(([l, v]) => (
              <div key={String(l)}>
                <dt className="text-subtle">{l}</dt>
                <dd className="text-muted tabular-nums">{formatDuration(v as number | null)}</dd>
              </div>
            ))}
          </dl>
        </KpiCard>

        <KpiCard
          label="Série"
          accent={streak.current?.type === "loss" ? "#FF6B6F" : "#3DD68C"}
          className="min-[480px]:col-span-2 md:col-span-1"
        >
          <span className={cn(big, streak.current?.type === "loss" ? "text-loss" : "text-win")}>
            {streak.current
              ? `${streak.current.length} ${streak.current.type === "win" ? "V" : "D"}`
              : "n/d"}
          </span>
          <span className="text-[11px] text-muted">
            {streak.current
              ? `${streak.current.length} ${streak.current.type === "win" ? "victoire" : "défaite"}${streak.current.length > 1 ? "s" : ""} d'affilée · record ${streak.bestWin} V`
              : "Aucune partie"}
          </span>
          <FormStrip matches={matches} size={10} compact />
        </KpiCard>
      </div>

      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ChartFrame
          id={`form-${matches.length}`}
          title="Forme"
          subtitle={`${matches.length} parties · survolez la courbe, ou parcourez-la aux flèches`}
          summary={`Courbe ${metric === "winRate" ? "des victoires glissantes sur 10 parties" : metric === "kda" ? "du KDA" : "de la valeur nette par minute"} sur ${matches.length} parties, moyenne ${fmt(avg)}.`}
          points={defined.length}
          table={{
            headers: ["Date", "Héros", "Résultat", "Valeur"],
            rows: chrono.map((m, i) => [
              formatDate(m.playedAt),
              m.heroName,
              m.outcome === "win" ? "Victoire" : "Défaite",
              chartPoints[i]?.value != null ? fmt(chartPoints[i]!.value as number) : "n/d",
            ]),
          }}
          actions={
            <Segmented<Metric>
              ariaLabel="Métrique"
              size="sm"
              className="w-full sm:w-auto"
              value={metric}
              onChange={setMetric}
              options={[
                { value: "winRate", label: "Victoires" },
                { value: "kda", label: "KDA" },
                { value: "net", label: "Valeur nette" },
              ]}
            />
          }
        >
          <AreaChart
            points={chartPoints}
            format={fmt}
            ariaLabel={`Courbe de forme sur ${matches.length} parties, moyenne ${fmt(avg)}`}
            max={maxValue}
            reference={{
              value: metric === "winRate" ? 50 : avg,
              label: metric === "winRate" ? "50 %" : `moy. ${fmt(avg)}`,
            }}
            best={bestIndex}
          />
          <ul
            className="mt-3 grid gap-[2px]"
            aria-hidden="true"
            style={{
              gridTemplateColumns: `repeat(${chrono.length}, minmax(0, 1fr))`,
              paddingLeft: 44,
            }}
          >
            {chrono.map((m) => (
              <li
                key={m.matchId}
                className="h-1.5 rounded-sm"
                style={{ background: m.outcome === "win" ? "var(--win)" : "var(--loss)" }}
              />
            ))}
          </ul>
          <div
            className="mt-1.5 flex justify-between text-[11px] text-subtle"
            aria-hidden="true"
            style={{ paddingLeft: 44 }}
          >
            <span>Partie la plus ancienne</span>
            <span>La plus récente</span>
          </div>
        </ChartFrame>

        <ChartFrame
          id={`roles-${matches.length}`}
          title="Rôles joués"
          subtitle="Parties par rôle du héros"
          summary={`Rôles joués : ${roleSegments.map((s) => `${s.label} ${s.value}`).join(", ")}.`}
          points={roles.length ? 5 : 0}
        >
          <Donut segments={roleSegments} centerLabel="parties" />
        </ChartFrame>
      </div>

      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="flex min-w-0 flex-col gap-4 p-5">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col">
              <h2 className="text-[15px]">Héros joués</h2>
              <span className="text-xs text-subtle">
                Trait blanc : taux de victoire moyen du héros dans le jeu (30 jours)
              </span>
            </div>
            <Segmented<HeroSort>
              ariaLabel="Trier les héros"
              size="sm"
              className="w-full sm:w-auto"
              value={heroSort}
              onChange={setHeroSort}
              options={[
                { value: "matches", label: "Parties" },
                { value: "wins", label: "Victoires" },
                { value: "kda", label: "KDA" },
              ]}
            />
          </header>
          <ul className="flex flex-col gap-3">
            {sortedRows.length === 0 && (
              <li className="text-sm text-subtle">Aucun héros disponible.</li>
            )}
            {sortedRows.slice(0, 8).map((h) => (
              <li key={h.heroId} className={cn("flex flex-col gap-1.5", h.few && "opacity-60")}>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm">
                  <HeroPortrait
                    name={h.heroName}
                    src={h.heroImageUrl}
                    color={heroById.get(h.heroId)?.color}
                    rounded="lg"
                    className="size-8 shrink-0"
                  />
                  <Link to={`/heroes/${h.heroId}`} className="font-medium hover:underline">
                    {h.heroName}
                  </Link>
                  {h.few && (
                    <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] whitespace-nowrap text-subtle">
                      peu de parties
                    </span>
                  )}
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted tabular-nums sm:ml-auto">
                    <span className="whitespace-nowrap">
                      {h.matches} parties · {formatPercent(h.winRate)}
                    </span>
                    <DeltaChip
                      value={h.delta}
                      unit=" pts"
                      threshold={0.5}
                      context="face à la méta"
                    />
                    <span className="hidden whitespace-nowrap sm:inline">
                      KDA {formatDecimal(h.kda)}
                    </span>
                  </span>
                </div>
                <BulletBar
                  value={h.winRate}
                  mark={h.metaWinRate}
                  color={heroById.get(h.heroId)?.color ?? "var(--accent)"}
                  label={`${h.heroName} : taux de victoire ${formatPercent(h.winRate)}, méta ${formatPercent(h.metaWinRate)}`}
                />
              </li>
            ))}
          </ul>
        </Card>

        <ChartFrame
          id={`activity-${matches.length}`}
          title="Activité"
          subtitle="12 semaines et heures de jeu"
          summary={`Activité sur 12 semaines. Pic d'activité : ${hours.peak === null ? "aucun" : `${hours.peak} h`}.`}
          points={matches.length}
          minPoints={1}
        >
          <div className="space-y-6">
            <CalendarHeatmap weeks={weeks} />
            <HourBars counts={hours.counts} peak={hours.peak} />
          </div>
        </ChartFrame>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <ChartFrame
          id={`kda-dist-${matches.length}`}
          title="Distribution du KDA"
          subtitle="Nombre de parties par classe de KDA"
          summary={`Médiane du KDA : ${formatDecimal(kdaDist.median)}.`}
          points={matches.length}
        >
          <Histogram
            bins={kdaDist.bins}
            median={kdaDist.median === null ? null : kdaBinIndex(kdaDist.median)}
            medianLabel={`médiane ${formatDecimal(kdaDist.median)}`}
          />
        </ChartFrame>

        <ChartFrame
          id={`duration-${matches.length}`}
          title="Victoires selon la durée"
          subtitle="Taux de victoire par tranche de durée de partie"
          summary={byDuration
            .map(
              (b) =>
                `${b.label} : ${b.winRate === null ? "n/d" : `${b.winRate} %`} sur ${b.matches} parties`,
            )
            .join(". ")}
          points={matches.length}
        >
          <ul className="space-y-3">
            {byDuration.map((b) => (
              <li
                key={b.label}
                className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 text-xs min-[420px]:grid-cols-[110px_minmax(0,1fr)_auto]"
              >
                <span className="text-muted">{b.label}</span>
                <span className="order-2 text-right whitespace-nowrap text-muted tabular-nums min-[420px]:order-3 min-[420px]:w-24">
                  {b.winRate === null ? "n/d" : `${Math.round(b.winRate)} %`} · {b.matches} p.
                </span>
                <div className="order-3 col-span-2 min-[420px]:order-2 min-[420px]:col-span-1">
                  <BulletBar
                    value={b.winRate}
                    mark={50}
                    color={b.winRate !== null && b.winRate >= 50 ? "var(--win)" : "var(--loss)"}
                    label={`${b.label} : ${formatPercent(b.winRate)}`}
                  />
                </div>
              </li>
            ))}
          </ul>
        </ChartFrame>
      </div>

      <section aria-labelledby="recent" className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 id="recent" className="text-[15px]">
            Parties récentes
          </h2>
          <Button variant="ghost" size="sm" onClick={onSeeMatches}>
            Tout l&apos;historique
          </Button>
        </div>
        <MatchesTable matches={matches.slice(0, 6)} />
      </section>

      <p className="text-xs text-subtle">{coverage}</p>
    </div>
  );
}
