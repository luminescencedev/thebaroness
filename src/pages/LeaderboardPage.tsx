import { Tabs } from "@base-ui/react/tabs";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import type { LeaderboardRegion, LeaderboardResponse } from "@/api";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { DataMetaNotice } from "@/components/DataMetaNotice";
import { ErrorState } from "@/components/ErrorState";
import { PageHeader } from "@/components/PageHeader";
import { Alert, EmptyState, Skeleton, Spinner } from "@/components/ui";
import { useLeaderboard } from "@/features/leaderboard/hooks";
import { LeaderboardRow } from "@/features/leaderboard/LeaderboardRow";
import { isTied, parseRegion, REGIONS } from "@/features/leaderboard/model";
import { formatDateTime } from "@/lib/format";

/** Vrai après `ms` tant que `active` : sert à annoncer un premier chargement long (jusqu'à 10 s côté back). */
function useAfter(ms: number, active: boolean): boolean {
  const [late, setLate] = useState(false);
  useEffect(() => {
    if (!active) return;
    const id = setTimeout(() => setLate(true), ms);
    return () => clearTimeout(id);
  }, [ms, active]);
  return active && late;
}

function ListSkeleton() {
  return (
    <div
      className="card @container overflow-hidden"
      aria-busy="true"
      aria-label="Chargement du classement"
    >
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          className="grid h-[60px] grid-cols-[34px_36px_minmax(0,1fr)] items-center gap-x-2.5 border-t border-divider pr-3 pl-2 first:border-t-0 @[640px]:h-[62px] @[640px]:grid-cols-[52px_40px_minmax(0,1fr)] @[640px]:gap-x-3"
        >
          <Skeleton className="mx-auto !h-[18px] !w-[22px]" />
          <Skeleton className="!h-9 !w-9 !rounded-full @[640px]:!h-10 @[640px]:!w-10" />
          <span className="flex flex-col gap-2">
            <Skeleton className="!h-3.5 w-[46%]" />
            <Skeleton className="!h-2.5 w-[28%]" />
          </span>
        </div>
      ))}
    </div>
  );
}

function CoverageLine({ data }: { data: LeaderboardResponse }) {
  const c = data.coverage;
  return (
    <p className="mt-3.5 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-subtle">
      {c && (
        <>
          <span>
            <b className="font-medium text-muted tabular-nums">{c.withSteamId}</b> comptes
            identifiés sur {c.entries}
            {c.inferredSteamId > 0 && `, dont ${c.inferredSteamId} déduits`}
          </span>
          <span>{c.ranksComplete ? "Rangs complets" : "Rangs incomplets"}</span>
        </>
      )}
      <span>Collecté le {formatDateTime(data.meta.fetchedAt)}</span>
    </p>
  );
}

function Board({ region }: { region: LeaderboardRegion }) {
  const board = useLeaderboard(region);
  const slow = useAfter(3000, board.isPending);

  if (board.isPending) {
    return (
      <div>
        {slow && (
          <p className="mb-3.5 flex items-center gap-2.5 text-[13px] text-muted" role="status">
            <Spinner className="shrink-0" />
            Premier chargement de la région : cela peut prendre jusqu'à 10 s. Les prochaines visites
            seront instantanées.
          </p>
        )}
        <ListSkeleton />
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
  const { items, meta } = board.data;
  if (items.length === 0) {
    return (
      <EmptyState title="Classement vide" description="Aucun joueur classé pour cette région." />
    );
  }
  return (
    <div className="fade-in">
      {meta.isPartial && (
        <Alert tone="info" className="mb-3.5">
          Rangs incomplets : certains joueurs affichent « Rang n/d ». La source des rangs répond
          lentement, actualisation automatique dans 1 min.
        </Alert>
      )}
      <div className="card @container overflow-hidden">
        <div
          aria-hidden="true"
          className="hidden grid-cols-[52px_40px_minmax(0,1fr)_190px_104px_14px] gap-x-3 border-b border-divider py-2.5 pr-4 pl-2 text-[11px] font-semibold text-subtle @[640px]:grid"
        >
          <span className="text-center">Rang</span>
          <span />
          <span>Joueur</span>
          <span>Rang Deadlock</span>
          <span>Héros</span>
          <span />
        </div>
        <ol aria-label="Joueurs classés">
          {items.map((entry, i) => (
            <LeaderboardRow
              key={`${entry.rank}-${entry.steamId ?? entry.displayName}-${i}`}
              entry={entry}
              tied={isTied(items, i)}
            />
          ))}
        </ol>
      </div>
      <CoverageLine data={board.data} />
      <div className="mt-2">
        <DataMetaNotice
          meta={{ ...meta, isPartial: false }}
          showDate={false}
          onRetry={() => void board.refetch()}
        />
      </div>
    </div>
  );
}

export function LeaderboardPage() {
  useDocumentTitle("Classement");
  const [params, setParams] = useSearchParams();
  const region = parseRegion(params.get("region"));

  return (
    <div className="mx-auto max-w-[880px]">
      <PageHeader title="Classement" description="Les meilleurs joueurs classés, par région." />
      <Tabs.Root
        value={region}
        onValueChange={(v) => setParams({ region: v as LeaderboardRegion }, { replace: true })}
      >
        <Tabs.List
          aria-label="Région"
          className="relative mb-5 flex gap-1 overflow-x-auto rounded-full border border-border bg-surface p-1 [scrollbar-width:none]"
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
