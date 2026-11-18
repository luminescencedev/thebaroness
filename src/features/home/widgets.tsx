import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import type { HeroSummary, LeaderboardRegion } from "@/api";
import { smoothPath } from "@/components/charts";
import { HeroPortrait } from "@/components/media/HeroPortrait";
import { RankBadge } from "@/components/media/RankBadge";
import { Avatar, DoubleBezel, Skeleton, cn } from "@/components/ui";
import { useHeroesMeta, useHeroes } from "@/features/heroes/hooks";
import type { HeroMetaStats } from "@/api";
import { useLeaderboard } from "@/features/leaderboard/hooks";
import { useRecentPlayers } from "@/features/search/recents";
import { formatPercent } from "@/lib/format";

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-[15px]">
      <path
        d="M5 12h14m-6-6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WidgetHead({ title, to, cta }: { title: string; to: string; cta: string }) {
  return (
    <div className="flex items-center justify-between gap-2 px-[18px] pt-[17px] pb-3.5">
      <h3 className="text-[14px] font-bold tracking-[-0.02em]">{title}</h3>
      <Link
        to={to}
        className="pressable hover-text inline-flex items-center gap-1.5 rounded-md py-1 text-[11px] whitespace-nowrap text-[#c9c5ee]"
      >
        {cta}
        <Arrow />
      </Link>
    </div>
  );
}

function Foot({ children }: { children: ReactNode }) {
  return <p className="mt-auto px-[18px] pt-3 pb-3.5 text-[10px] text-subtle">{children}</p>;
}

/* ---------- A. Découverte de joueurs ---------- */

// Aperçu de produit : valeurs d'exemple, signalées comme telles dans le widget.
const SAMPLE_KDA = [
  2.4, 3.1, 1.6, 2.9, 3.8, 2.2, 1.9, 3.3, 4.4, 2.6, 1.4, 3.0, 2.83, 1.78, 5.5, 2.25, 3.4, 6.67,
  2.57, 5.0,
];

export function PlayersWidget({ className }: { className?: string }) {
  const recents = useRecentPlayers();
  const { line, area } = smoothPath(SAMPLE_KDA, 355, 83, 6);
  return (
    <DoubleBezel
      as="article"
      size="lg"
      className={cn("min-h-[350px]", className)}
      innerClassName="flex flex-col after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:bg-[linear-gradient(90deg,#6f5ff0,#fff3)] widget-glow [--wg:rgb(111_95_240_/_0.34)]"
    >
      <WidgetHead title="Un joueur, tout son parcours" to="/search" cta="Explorer" />
      <div className="px-[18px] pb-4">
        <div role="img" aria-label="Aperçu d'un profil avec des données d'exemple">
          <div className="mb-4 flex items-center gap-3">
            <Avatar name="Corvid" src={null} className="size-11 rounded-[13px]" />
            <div>
              <p className="text-sm font-semibold">Corvid</p>
              <p className="text-[10.5px] text-subtle">Profil d&apos;exemple</p>
            </div>
            <span className="ml-auto rounded-full border border-[rgb(241_186_115/0.18)] bg-[rgb(241_186_115/0.07)] px-2.5 py-1.5 text-[11px] text-data-amber">
              Oracle 4
            </span>
          </div>
          <dl className="grid grid-cols-3 border-y border-divider py-3.5">
            {[
              ["Victoires", "57,1 %"],
              ["KDA", "2,84"],
              ["Parties", "42"],
            ].map(([k, v], i) => (
              <div key={k} className={cn(i > 0 && "border-l border-divider pl-3.5")}>
                <dt className="text-[10px] text-subtle">{k}</dt>
                <dd className="mt-0.5 text-[19px] font-semibold tracking-[-0.035em]">{v}</dd>
              </div>
            ))}
          </dl>
          <svg
            viewBox="0 0 355 83"
            preserveAspectRatio="none"
            aria-hidden="true"
            className="mt-4 h-[79px] w-full overflow-visible"
          >
            <defs>
              <linearGradient id="home-area" x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="oklch(0.78 0.13 285)" stopOpacity=".28" />
                <stop offset="1" stopColor="oklch(0.78 0.13 285)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 72H355M0 40H355M0 9H355" stroke="white" strokeOpacity=".06" />
            <path d={area} fill="url(#home-area)" />
            <path
              d={line}
              fill="none"
              stroke="oklch(0.78 0.13 285)"
              strokeWidth="2.4"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <p className="mt-1.5 text-[10.5px] text-subtle">KDA des 20 dernières parties, exemple</p>
        </div>

        {recents.length > 0 && (
          <div className="mt-4 border-t border-divider pt-3.5">
            <p className="mb-2 text-[10.5px] text-subtle">Consultés récemment</p>
            <ul className="flex flex-wrap gap-1.5">
              {recents.slice(0, 4).map((p) => (
                <li key={p.steamId} className="max-w-full min-w-0">
                  <Link
                    to={`/players/${p.steamId}`}
                    className="pressable inline-flex h-8 max-w-full items-center gap-2 rounded-full border border-border bg-surface py-0.5 pr-3 pl-0.5 text-[12px] text-muted hover:bg-surface-strong hover:text-text"
                  >
                    <Avatar
                      name={p.displayName}
                      src={p.avatarUrl}
                      className="size-7 shrink-0 text-[10px]"
                    />
                    <span className="truncate">{p.displayName}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <Foot>Aperçu d&apos;exemple : le produit affiche les données de Deadlock API.</Foot>
    </DoubleBezel>
  );
}

/* ---------- B. Héros et méta ---------- */

const FEATURED = [
  "Haze",
  "Wraith",
  "Seven",
  "Vindicta",
  "Infernus",
  "Lady Geist",
  "Pocket",
  "Abrams",
  "Dynamo",
];

function HeroLine({
  hero,
  meta,
}: {
  hero: HeroSummary;
  meta: { stats: HeroMetaStats | undefined; isPending: boolean } | undefined;
}) {
  const s = meta?.stats;
  const pending = meta?.isPending ?? true;
  return (
    <li>
      <Link
        to={`/heroes/${hero.id}`}
        className="pressable grid grid-cols-[1fr_58px_58px] items-center rounded-[10px] py-1.5 sm:grid-cols-[1fr_72px_72px] pl-1 hover:bg-[rgb(255_255_255/0.04)]"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <HeroPortrait
            name={hero.name}
            src={hero.images.small}
            color={hero.color}
            rounded="lg"
            className="size-9 sm:size-10"
          />
          <span className="truncate text-[14px] font-bold">{hero.name}</span>
        </span>
        <span
          className={cn(
            "pr-1 text-right text-[14px] font-bold tabular-nums",
            s?.winRate != null &&
              (s.winRate >= 52
                ? "text-data-win"
                : s.winRate <= 48
                  ? "text-data-loss"
                  : "text-text"),
          )}
        >
          {pending ? <Skeleton className="ml-auto h-3 w-10" /> : formatPercent(s?.winRate)}
        </span>
        <span className="pr-1 text-right text-[12.5px] font-medium text-[#c5c8d4] tabular-nums">
          {pending ? <Skeleton className="ml-auto h-3 w-10" /> : formatPercent(s?.pickRate)}
        </span>
      </Link>
    </li>
  );
}

export function MetaWidget({ className }: { className?: string }) {
  const heroes = useHeroes();
  const picked = heroes.data
    ? FEATURED.map((n) => heroes.data.items.find((h) => h.name === n))
        .filter((h): h is HeroSummary => Boolean(h))
        .slice(0, 7)
    : [];
  const list = picked.length >= 3 ? picked : (heroes.data?.items.slice(0, 7) ?? []);
  const meta = useHeroesMeta(list.map((h) => h.id));

  return (
    <DoubleBezel
      as="article"
      size="lg"
      className={cn("min-h-[350px]", className)}
      innerClassName="flex flex-col after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:bg-[linear-gradient(90deg,#c3b6ff,#fff3)] widget-glow [--wg:rgb(214_98_220_/_0.3)]"
    >
      <WidgetHead title="Héros et méta" to="/heroes" cta="Voir les héros" />
      <div className="px-[18px] pb-3">
        <div className="grid grid-cols-[1fr_58px_58px] pb-2 pl-1 sm:grid-cols-[1fr_72px_72px] text-[10px] text-subtle">
          <span>Héros</span>
          <span className="pr-1 text-right">Victoires</span>
          <span className="pr-1 text-right">Sélection</span>
        </div>
        {heroes.isPending ? (
          <div className="space-y-2" aria-label="Chargement">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[38px] rounded-[10px]" />
            ))}
          </div>
        ) : heroes.isError ? (
          <p className="py-6 text-[12px] text-muted">Catalogue indisponible pour le moment.</p>
        ) : (
          <ul>
            {list.map((h) => (
              <HeroLine key={h.id} hero={h} meta={meta.get(h.id)} />
            ))}
          </ul>
        )}
      </div>
      <Foot>Sélection de héros, statistiques de Deadlock API (n/d si indisponibles).</Foot>
    </DoubleBezel>
  );
}

/* ---------- C. Classement ---------- */

const REGIONS: { value: LeaderboardRegion; label: string }[] = [
  { value: "Europe", label: "Europe" },
  { value: "NAmerica", label: "Amérique N." },
  { value: "Asia", label: "Asie" },
];

export function LeaderboardWidget({ className }: { className?: string }) {
  const [region, setRegion] = useState<LeaderboardRegion>("Europe");
  const lb = useLeaderboard(region);
  const rows = lb.data?.items.slice(0, 5) ?? [];

  return (
    <DoubleBezel
      as="article"
      size="lg"
      className={cn("widget-card [--wc:#3ec3e8] min-h-[350px] md:max-lg:col-span-2", className)}
      innerClassName="flex flex-col after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:bg-[linear-gradient(90deg,#7fd6e6,#fff3)] widget-glow [--wg:rgb(60_190_230_/_0.3)]"
    >
      <WidgetHead title="Classement régional" to="/leaderboard" cta="Voir tout" />
      <div className="px-[18px] pb-3">
        <div
          role="tablist"
          aria-label="Région"
          className="mb-3 flex gap-0.5 rounded-full border border-border bg-surface p-[3px]"
        >
          {REGIONS.map((r) => (
            <button
              key={r.value}
              type="button"
              role="tab"
              aria-selected={region === r.value}
              onClick={() => setRegion(r.value)}
              className={cn(
                "pressable h-7 flex-1 rounded-full text-[10.5px] font-semibold",
                region === r.value
                  ? "bg-[rgb(255_255_255/0.1)] text-text shadow-[0_1px_2px_rgb(0_0_0/0.2)]"
                  : "text-subtle hover:text-muted",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        {lb.isPending ? (
          <div className="space-y-2" aria-label="Chargement">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-9 rounded-[10px]" />
            ))}
          </div>
        ) : lb.isError ? (
          <p className="py-6 text-[12px] text-muted">Classement indisponible pour le moment.</p>
        ) : rows.length === 0 ? (
          <p className="py-6 text-[12px] text-muted">Aucun joueur classé dans cette région.</p>
        ) : (
          <ol>
            {rows.map((e) => {
              const content = (
                <>
                  <span
                    className={cn(
                      "text-[15px] font-extrabold tabular-nums",
                      e.rank === 1
                        ? "text-[#ffd45e]"
                        : e.rank === 2
                          ? "text-[#d6dbe8]"
                          : e.rank === 3
                            ? "text-[#e59a62]"
                            : "text-subtle",
                    )}
                  >
                    {String(e.rank).padStart(2, "0")}
                  </span>
                  <span className="truncate text-[14px] font-bold">{e.displayName}</span>
                  {e.badge ? (
                    <RankBadge
                      name={e.badge.name}
                      imageUrl={e.badge.imageUrl}
                      size="sm"
                      label
                      className="text-[12px] font-semibold text-data-cyan"
                    />
                  ) : (
                    <span className="text-[10.5px] text-subtle">n/d</span>
                  )}
                </>
              );
              const cls =
                "grid grid-cols-[28px_1fr_auto] items-center gap-2.5 border-b border-divider px-0.5 py-2";
              return (
                <li key={e.rank} className="last:[&>*]:border-0">
                  {e.steamId ? (
                    <Link
                      to={`/players/${e.steamId}`}
                      className={cn(cls, "pressable hover:bg-[rgb(255_255_255/0.03)]")}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div className={cls}>{content}</div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
      <Foot>Top 5 de la région, source Deadlock API.</Foot>
    </DoubleBezel>
  );
}
