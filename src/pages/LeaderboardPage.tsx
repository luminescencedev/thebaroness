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

const REGIONS: { value: LeaderboardRegion; label: string }[] = [
  { value: "Europe", label: "Europe" },
  { value: "NAmerica", label: "Amérique du Nord" },
  { value: "SAmerica", label: "Amérique du Sud" },
  { value: "Asia", label: "Asie" },
  { value: "Oceania", label: "Océanie" },
];

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
  return (
    <div className="space-y-4">
      <ol className="space-y-2">
        {board.data.items.map((e) => (
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
              <RankBadge name={e.badge?.name} imageUrl={e.badge?.imageUrl} size="md" />
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
                <span className="block text-xs text-subtle">
                  {e.badge ? `${e.badge.name} ${e.badge.subrank}` : "Rang non communiqué"}
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
          className="mb-6 flex gap-1 overflow-x-auto rounded-full border border-border bg-surface p-1"
        >
          {REGIONS.map((r) => (
            <Tabs.Tab
              key={r.value}
              value={r.value}
              className="pressable hover-text shrink-0 rounded-full px-4 py-1.5 text-sm text-muted data-[selected]:bg-surface-strong data-[selected]:text-text"
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
