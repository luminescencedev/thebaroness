import { useMemo, useState } from "react";
import type { HeroSummary } from "@/api";
import { AreaChart, ChartFrame, DeltaChip, type AreaPoint } from "@/components/charts";
import { DoubleBezel, Segmented, Skeleton } from "@/components/ui";
import type { ProfileScope } from "@/api";
import { usePlayerTrends, type usePlayerOverview } from "@/features/players/hooks";
import { formatDate, formatDecimal, formatDuration, formatInt, formatPercent } from "@/lib/format";

type Metric = "kda" | "winRate" | "net";
type Window = "10" | "20" | "50";

function Kpi({
  label,
  value,
  hint,
  delta,
}: {
  label: string;
  value: string;
  hint: string;
  delta?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl bg-white/[0.03] px-4 py-3">
      <p className="text-xs text-subtle">{label}</p>
      <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-2xl leading-none font-semibold tracking-[-0.03em] tabular-nums">
          {value}
        </span>
        {delta}
      </p>
      <p className="mt-1.5 text-[11px] text-subtle">{hint}</p>
    </div>
  );
}

/** Tendance officielle N dernières contre N précédentes : tout l'historique du format et du type du scope, hors période. */
function TrendRow({ trends, size }: { trends: ReturnType<typeof usePlayerTrends>; size: number }) {
  const d = trends.data;
  if (trends.isPending || trends.isError || !d) return null;
  return (
    <div
      className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-subtle"
      aria-label={`Tendance : ${size} dernières parties contre les ${size} précédentes`}
    >
      <span>
        Tendance : {size} dernières contre {size} précédentes
        {d.filters.period === undefined || d.filters.period === null ? (
          <span className="text-subtle"> (tout l'historique)</span>
        ) : null}
      </span>
      {d.delta === null ? (
        <span>
          Pas assez de parties pour comparer {size} contre {size}.
        </span>
      ) : (
        <>
          <span className="inline-flex items-center gap-1.5">
            Victoires
            <DeltaChip
              value={d.delta.winRate}
              unit=" pts"
              digits={1}
              threshold={0.5}
              context="face aux parties précédentes"
            />
          </span>
          <span className="inline-flex items-center gap-1.5">
            KDA
            <DeltaChip
              value={d.delta.kda}
              digits={2}
              threshold={0.05}
              context="face aux parties précédentes"
            />
          </span>
          <span className="inline-flex items-center gap-1.5">
            Net/min
            <DeltaChip
              value={d.delta.avgNetWorthPerMinute}
              digits={0}
              threshold={10}
              context="face aux parties précédentes"
            />
          </span>
        </>
      )}
    </div>
  );
}

/**
 * Synthèse officielle du back pour le périmètre choisi (4 KPI), puis courbe des N dernières parties de ce
 * même périmètre. Les KPI ne dépendent jamais de la fenêtre 10 / 20 / 50 de la courbe.
 */
export function RecentPerformance({
  heroById,
  overview,
  scopeText,
  steamId,
  scope,
}: {
  steamId: string;
  scope: ProfileScope;
  heroById: Map<number, HeroSummary>;
  overview: ReturnType<typeof usePlayerOverview>;
  scopeText: string;
}) {
  const [win, setWin] = useState<Window>("20");
  const [metric, setMetric] = useState<Metric>("kda");
  const size = Number(win);
  const sum = overview.data?.summary;
  const trends = usePlayerTrends(steamId, scope, size);
  // La série vient du back (KDA, valeur nette par minute, winrate glissant) : aucune formule ici.
  const chrono = useMemo(() => trends.data?.series ?? [], [trends.data]);
  const nameOf = (id: number) => heroById.get(id)?.name ?? `Héros ${id}`;

  const points: AreaPoint[] = useMemo(
    () =>
      chrono.map((m) => {
        const value =
          metric === "kda" ? m.kda : metric === "net" ? m.netWorthPerMinute : m.rollingWinRate;
        return {
          value,
          title: `${nameOf(m.heroId)} · ${m.win ? "Victoire" : "Défaite"}`,
          lines: [
            formatDate(m.at),
            `${m.kills ?? "n/d"} / ${m.deaths ?? "n/d"} / ${m.assists ?? "n/d"} · ${formatDuration(m.durationSeconds)}`,
            ...(metric === "winRate" && m.rollingWinRate === null
              ? [`Échantillon insuffisant (${m.rollingSampleSize} sur 10)`]
              : []),
          ],
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chrono, metric, heroById],
  );

  const defined = points.map((p) => p.value).filter((v): v is number => v !== null);
  const avg = defined.length ? defined.reduce((s, v) => s + v, 0) / defined.length : 0;
  const max =
    metric === "winRate"
      ? 100
      : metric === "kda"
        ? Math.max(4, Math.ceil(Math.max(...defined, 1) / 2) * 2)
        : Math.max(1000, Math.ceil(Math.max(...defined, 1) / 250) * 250);
  const fmt = (v: number) =>
    metric === "winRate"
      ? `${Math.round(v)} %`
      : metric === "kda"
        ? formatDecimal(v)
        : formatInt(v);
  const metricName =
    metric === "kda"
      ? "KDA par partie"
      : metric === "winRate"
        ? "Victoires glissantes (10 parties)"
        : "Valeur nette par minute";

  return (
    <DoubleBezel size="lg" innerClassName="p-4 sm:p-5">
      <div>
        <h2 className="text-[15px]">Performance</h2>
        <p className="text-xs text-subtle">
          {scopeText}
          {sum ? ` · ${sum.matches} partie${sum.matches > 1 ? "s" : ""}` : ""}
        </p>
      </div>

      {overview.isPending ? (
        <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[104px] rounded-2xl" />
          ))}
        </div>
      ) : overview.isError || !sum ? (
        <p className="mt-4 text-sm text-subtle">
          Synthèse indisponible pour le moment.{" "}
          <button
            type="button"
            onClick={() => void overview.refetch()}
            className="text-accent-text underline-offset-4 hover:underline"
          >
            Réessayer
          </button>
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <Kpi
            label="Victoires"
            value={formatPercent(sum.winRate)}
            hint={`${sum.wins} V · ${sum.losses} D`}
          />
          <Kpi
            label="KDA"
            value={formatDecimal(sum.kda)}
            hint={
              sum.kdaSampleSize < sum.matches
                ? `calculé sur ${sum.kdaSampleSize} partie${sum.kdaSampleSize > 1 ? "s" : ""} sur ${sum.matches}`
                : "(K + A) / max(D, 1), sur les sommes"
            }
          />
          <Kpi
            label="Parties"
            value={String(sum.matches)}
            hint={
              sum.avgDurationSeconds === null
                ? "durée n/d"
                : `durée moyenne ${formatDuration(sum.avgDurationSeconds)}`
            }
          />
          <Kpi
            label="Valeur nette / min"
            value={formatInt(
              sum.avgNetWorthPerMinute === null ? null : Math.round(sum.avgNetWorthPerMinute),
            )}
            hint={
              sum.netWorthPerMinuteSampleSize < sum.matches
                ? `moyenne par partie, ${sum.netWorthPerMinuteSampleSize} sur ${sum.matches}`
                : "moyenne par partie"
            }
          />
        </div>
      )}

      {trends.isPending ? (
        <Skeleton className="mt-5 h-52 rounded-2xl" aria-busy="true" />
      ) : trends.isError || !trends.data ? (
        <p className="mt-5 text-sm text-subtle">
          Courbe indisponible pour le moment.{" "}
          <button
            type="button"
            onClick={() => void trends.refetch()}
            className="text-accent-text underline-offset-4 hover:underline"
          >
            Réessayer
          </button>
        </p>
      ) : trends.data.series === undefined ? (
        <p className="mt-5 text-sm text-subtle">
          La série de parties n'est pas fournie par cette version du back : pas de courbe.
        </p>
      ) : chrono.length === 0 ? (
        <p className="mt-5 text-sm text-subtle">Aucune partie sur cette période : pas de courbe.</p>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-subtle">
              Courbe : {chrono.length} dernière{chrono.length > 1 ? "s" : ""} partie
              {chrono.length > 1 ? "s" : ""} de la période
              {chrono.length < size ? ` (moins de ${size} disponibles)` : ""}
            </p>
            <Segmented<Window>
              ariaLabel="Fenêtre de la courbe"
              size="sm"
              value={win}
              onChange={setWin}
              options={[
                { value: "10", label: "10" },
                { value: "20", label: "20" },
                { value: "50", label: "50" },
              ]}
            />
          </div>
          <TrendRow trends={trends} size={size} />
          <div className="mt-3">
            <ChartFrame
              id={`recent-${win}-${metric}`}
              title={metricName}
              subtitle="Une partie sans valeur interrompt la courbe"
              summary={`${metricName} sur ${chrono.length} parties, moyenne ${fmt(avg)}.`}
              points={defined.length}
              table={{
                headers: ["Date", "Héros", "Résultat", "Valeur"],
                rows: chrono.map((m, i) => [
                  formatDate(m.at),
                  nameOf(m.heroId),
                  m.win ? "Victoire" : "Défaite",
                  points[i]?.value != null ? fmt(points[i]!.value as number) : "n/d",
                ]),
              }}
              actions={
                <Segmented<Metric>
                  ariaLabel="Mesure du graphique"
                  size="sm"
                  value={metric}
                  onChange={setMetric}
                  options={[
                    { value: "kda", label: "KDA" },
                    { value: "winRate", label: "Victoires" },
                    { value: "net", label: "Net/min" },
                  ]}
                />
              }
              className="!bg-transparent !p-0 !shadow-none !border-0"
            >
              <AreaChart
                points={points}
                format={fmt}
                ariaLabel={`${metricName} sur ${chrono.length} parties, moyenne ${fmt(avg)}`}
                max={max}
                height={190}
                reference={{
                  value: metric === "winRate" ? 50 : avg,
                  label: metric === "winRate" ? "50 %" : `moy. ${fmt(avg)}`,
                }}
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
                    style={{ background: m.win ? "var(--win)" : "var(--loss)" }}
                  />
                ))}
              </ul>
            </ChartFrame>
          </div>
        </>
      )}
    </DoubleBezel>
  );
}
