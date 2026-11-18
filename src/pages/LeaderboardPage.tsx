import { Tabs } from "@base-ui/react/tabs";
import { useState } from "react";
import { Link } from "react-router";
import type { LeaderboardRegion } from "@/api";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { DataMetaNotice } from "@/components/DataMetaNotice";
import { ErrorState } from "@/components/ErrorState";
import { HeroPortrait } from "@/components/media/HeroPortrait";
import { RankBadge } from "@/components/media/RankBadge";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, Skeleton, cn } from "@/components/ui";
import { useLeaderboard } from "@/features/leaderboard/hooks";
import type { LeaderboardEntry } from "@/api";
import { rankLabel } from "@/lib/rank";

const REGIONS: { value: LeaderboardRegion; label: string }[] = [
  { value: "Europe", label: "Europe" },
  { value: "NAmerica", label: "Amérique du Nord" },
  { value: "SAmerica", label: "Amérique du Sud" },
  { value: "Asia", label: "Asie" },
  { value: "Oceania", label: "Océanie" },
];

/** Rang du joueur : celui du classement (le back le résout pour toute l'entrée). Aucune relecture du profil. */
function EntryRank({ entry, size = "md" }: { entry: LeaderboardEntry; size?: "md" | "lg" }) {
  if (!entry.badge) return null;
  // Le back livre déjà « Eternus 5 » : rankLabel retire le chiffre et met le sous-rang en romain, comme le profil.
  const name = rankLabel(entry.badge.name, entry.badge.subrank) ?? entry.badge.name;
  return (
    <span className="flex items-center gap-2">
      <RankBadge name={name} imageUrl={entry.badge.imageUrl} size={size === "lg" ? "lg" : "md"} />
      <span className="text-xs text-muted">{name}</span>
    </span>
  );
}

function Board({ region }: { region: LeaderboardRegion }) {
  const board = useLeaderboard(region);

  if (board.isPending) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Chargement du classement">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-14 rounded-card" />
        ))}
      </div>
    );
  }
  if (board.isError) {
    return (
      <ErrorState
        error={board.error}
        title="Classement indisponible"
        onRetry={() => void board.refetch()}
      />
    );
  }
  if (board.data.items.length === 0) {
    return (
      <EmptyState title="Classement vide" description="Aucun joueur classé pour cette région." />
    );
  }
  const top = board.data.items.slice(0, 3);
  const rest = board.data.items.slice(3);
  const MEDAL = ["#F5C451", "#C9CED8", "#D08A5A"];
  return (
    <div className="space-y-4">
      <ol className="grid gap-3 sm:grid-cols-3" aria-label="Podium">
        {top.map((e, i) => (
          <li
            key={e.rank}
            className="card-hero flex flex-col items-center gap-2 px-4 py-6 text-center"
            style={{ ["--hc" as string]: MEDAL[i] }}
          >
            <span
              className="text-4xl leading-none font-semibold tabular-nums"
              style={{ color: MEDAL[i] }}
            >
              {e.rank}
            </span>
            <EntryRank entry={e} size="lg" />
            {e.steamId ? (
              <Link
                to={`/players/${e.steamId}`}
                className="max-w-full truncate text-lg font-semibold hover:underline"
              >
                {e.displayName}
              </Link>
            ) : (
              <span className="max-w-full truncate text-lg font-semibold">{e.displayName}</span>
            )}
            {e.topHeroes.length > 0 && (
              <ul className="mt-1 flex -space-x-2" aria-label="Héros les plus joués">
                {e.topHeroes.map((h) => (
                  <li key={h.heroId} title={h.name}>
                    <HeroPortrait
                      name={h.name}
                      src={h.imageUrl}
                      rounded="full"
                      className="size-8 border-2 border-bg"
                    />
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
      <ol start={4} className="space-y-2">
        {rest.map((e) => (
          <li
            key={e.rank}
            className="card grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 px-3 py-2.5 sm:grid-cols-[3rem_1fr_auto_auto]"
          >
            <span
              className={cn(
                "text-center text-lg font-semibold tabular-nums",
                e.rank <= 3 ? "text-text" : "text-muted",
              )}
            >
              {e.rank}
            </span>
            <span className="flex min-w-0 items-center gap-3">
              <span className="min-w-0">
                {e.steamId ? (
                  <Link
                    to={`/players/${e.steamId}`}
                    className="block truncate font-medium hover:underline"
                  >
                    {e.displayName}
                  </Link>
                ) : (
                  <span className="block truncate font-medium">{e.displayName}</span>
                )}
                <span className="mt-0.5 block min-h-4">
                  <EntryRank entry={e} />
                </span>
              </span>
            </span>
            <ul
              className="hidden items-center -space-x-2 sm:flex"
              aria-label="Héros les plus joués"
            >
              {e.topHeroes.map((h) => (
                <li key={h.heroId} title={h.name}>
                  <HeroPortrait
                    name={h.name}
                    src={h.imageUrl}
                    rounded="full"
                    className="size-8 border-2 border-bg"
                  />
                  <span className="sr-only">{h.name}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <DataMetaNotice meta={board.data.meta} />
    </div>
  );
}

export function LeaderboardPage() {
  useDocumentTitle("Classement");
  const [region, setRegion] = useState<LeaderboardRegion>("Europe");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Classement" description="Les meilleurs joueurs classés, par région." />
      <Tabs.Root value={region} onValueChange={(v) => setRegion(v as LeaderboardRegion)}>
        <Tabs.List
          aria-label="Région"
          className="relative mb-6 flex gap-1 overflow-x-auto rounded-full border border-border bg-surface p-1"
        >
          <Tabs.Indicator className="absolute top-1 bottom-1 left-0 w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)] rounded-full bg-white/[0.09] shadow-[0_1px_2px_rgb(0_0_0/0.4)] transition-[translate,width] duration-[220ms] ease-[var(--ease-in-out)] motion-reduce:transition-none" />
          {REGIONS.map((r) => (
            <Tabs.Tab
              key={r.value}
              value={r.value}
              className="pressable hover-text relative z-10 shrink-0 rounded-full px-4 py-1.5 text-sm text-muted data-[selected]:text-text"
            >
              {r.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {REGIONS.map((r) => (
          <Tabs.Panel key={r.value} value={r.value}>
            <Board region={r.value} />
          </Tabs.Panel>
        ))}
      </Tabs.Root>
    </div>
  );
}
