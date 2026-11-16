import { useState } from "react";
import { Link } from "react-router";
import type { MatchSummary, PlayerProfile } from "@/api";
import { PerformanceChart, Sparkline } from "@/components/charts";
import { HeroPortrait } from "@/components/media/HeroPortrait";
import { Card, EmptyState, cn } from "@/components/ui";
import { usePlayerHeroes } from "@/features/leaderboard/hooks";
import { formatDate, formatDecimal, formatInt, formatPercent } from "@/lib/format";

const ratio = (m: MatchSummary) => ((m.kills ?? 0) + (m.assists ?? 0)) / Math.max(1, m.deaths ?? 1);

/** Pour les sparklines : taux de victoire cumulé et KDA glissant, du plus ancien au plus récent. */
function trends(matches: MatchSummary[]) {
  const ordered = [...matches].reverse();
  let wins = 0;
  const winRate = ordered.map((m, i) => {
    if (m.outcome === "win") wins += 1;
    return (wins / (i + 1)) * 100;
  });
  const kda = ordered.map((_, i) => {
    const slice = ordered.slice(Math.max(0, i - 4), i + 1);
    return slice.reduce((s, m) => s + ratio(m), 0) / slice.length;
  });
  const games = ordered.map((_, i) => i + 1);
  return { winRate, kda, games };
}

function Kpi({
  label,
  value,
  sub,
  spark,
}: {
  label: string;
  value: string;
  sub?: string;
  spark?: number[];
}) {
  return (
    <div className="card flex flex-col gap-2.5 p-[18px]">
      <span className="text-xs text-subtle">{label}</span>
      <div className="flex items-end justify-between gap-3">
        <span className="text-2xl leading-none font-semibold tracking-[-0.035em] whitespace-nowrap tabular-nums sm:text-[28px]">
          {value}
        </span>
        {spark && spark.length > 1 && <Sparkline values={spark} className="h-8 w-24" />}
      </div>
      {sub && <span className="text-xs text-muted tabular-nums">{sub}</span>}
    </div>
  );
}

type Metric = "kda" | "net";

export function PlayerOverview({
  profile,
  matches,
  steamId,
}: {
  profile: PlayerProfile;
  matches: MatchSummary[];
  steamId: string;
}) {
  const [metric, setMetric] = useState<Metric>("kda");
  const heroes = usePlayerHeroes(steamId);
  const { stats, rank } = profile;
  const t = trends(matches);

  const recent = matches.slice(0, 20).reverse();
  const values = metric === "kda" ? recent.map(ratio) : recent.map((m) => m.netWorth ?? 0);
  const maxRaw = Math.max(...values, 1);
  const max = metric === "kda" ? Math.ceil(maxRaw / 2) * 2 : Math.ceil(maxRaw / 10000) * 10000;
  const wins = recent.filter((m) => m.outcome === "win").length;
  const top = heroes.data?.items.slice(0, 5) ?? [];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Victoires"
          value={formatPercent(stats.winRate)}
          sub={`${formatInt(stats.wins)} V · ${formatInt(stats.losses)} D`}
          spark={t.winRate}
        />
        <Kpi
          label="KDA moyen"
          value={formatDecimal(stats.kda)}
          sub={`sur ${formatInt(stats.matchesPlayed)} parties`}
          spark={t.kda}
        />
        <Kpi
          label="Parties disponibles"
          value={formatInt(stats.matchesPlayed)}
          sub={`${formatInt(stats.kills)} éliminations · ${formatInt(stats.deaths)} morts`}
          spark={t.games}
        />
        <Kpi
          label="Rang"
          value={rank.name ?? "Non classé"}
          sub={rank.name ? "Rang classé actuel" : "Aucun rang disponible"}
        />
      </div>

      <div className="flex flex-wrap items-stretch gap-3">
        {matches.length >= 2 ? (
          <section
            className="card flex min-w-0 flex-[999_1_600px] flex-col gap-4 p-5"
            aria-labelledby="perf-t"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col">
                <h2 id="perf-t" className="text-[15px]">
                  Performance
                </h2>
                <span className="text-xs text-subtle">
                  {recent.length} dernières parties · survolez la courbe
                </span>
              </div>
              <div
                role="group"
                aria-label="Métrique"
                className="inline-flex rounded-[9px] bg-surface p-[3px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]"
              >
                {(
                  [
                    ["kda", "KDA"],
                    ["net", "Valeur nette"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={metric === key}
                    onClick={() => setMetric(key)}
                    className={cn(
                      "pressable hover-text h-7 rounded-[7px] px-3 text-xs font-medium",
                      metric === key
                        ? "bg-white/[0.09] text-text shadow-[0_1px_2px_rgb(0_0_0/0.4)]"
                        : "text-subtle",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <PerformanceChart
              values={values}
              hints={recent.map((m) => `${m.heroName} · ${formatDate(m.playedAt)}`)}
              format={(v) => (metric === "kda" ? formatDecimal(v) : formatInt(v))}
              ariaLabel={`${metric === "kda" ? "KDA" : "Valeur nette"} sur les ${recent.length} dernières parties`}
              max={max}
            />
            <div className="flex items-center gap-2.5 pl-11">
              <ul
                aria-label={`${wins} victoires et ${recent.length - wins} défaites sur les ${recent.length} dernières parties`}
                className="grid flex-1 gap-[3px]"
                style={{ gridTemplateColumns: `repeat(${recent.length}, minmax(0, 1fr))` }}
              >
                {recent.map((m) => (
                  <li
                    key={m.matchId}
                    className="h-1.5 rounded-sm"
                    style={{ background: m.outcome === "win" ? "var(--win)" : "var(--loss)" }}
                  >
                    <span className="sr-only">{m.outcome === "win" ? "Victoire" : "Défaite"}</span>
                  </li>
                ))}
              </ul>
              <span className="text-xs text-muted tabular-nums">
                {wins} V · {recent.length - wins} D
              </span>
            </div>
          </section>
        ) : (
          <EmptyState
            className="min-w-0 flex-[999_1_600px]"
            title="Pas assez de parties"
            description="Il faut au moins deux parties disponibles pour afficher les tendances."
          />
        )}

        <Card className="flex min-w-0 flex-[1_1_280px] flex-col gap-4 p-5">
          <div className="flex flex-col">
            <h2 className="text-[15px]">Héros principaux</h2>
            <span className="text-xs text-subtle">
              sur {formatInt(stats.matchesPlayed)} parties
            </span>
          </div>
          <ul className="flex flex-1 flex-col gap-3">
            {top.length === 0 && <li className="text-sm text-subtle">Aucun héros disponible.</li>}
            {top.map((h) => {
              const share = stats.matchesPlayed ? (h.matches / stats.matchesPlayed) * 100 : 0;
              return (
                <li key={h.heroId} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2.5 text-sm">
                    <HeroPortrait
                      name={h.heroName}
                      src={h.heroImageUrl}
                      rounded="lg"
                      className="size-7"
                    />
                    <Link to={`/heroes/${h.heroId}`} className="font-medium hover:underline">
                      {h.heroName}
                    </Link>
                    <span className="ml-auto text-xs text-muted tabular-nums">
                      {h.matches} parties · {formatPercent(h.winRate)}
                    </span>
                  </div>
                  <div
                    className="h-1 overflow-hidden rounded-full bg-surface-strong"
                    aria-hidden="true"
                  >
                    <div className="h-full rounded-full bg-accent" style={{ width: `${share}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
