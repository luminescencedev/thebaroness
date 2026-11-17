import { useState } from "react";
import { Link } from "react-router";
import type { RelatedPlayer } from "@/api";
import { Avatar, DoubleBezel, Segmented, Skeleton } from "@/components/ui";
import type { usePlayerRelationships } from "@/features/players/hooks";
import { formatPercent } from "@/lib/format";

type Side = "with" | "against";

function Row({ p, side }: { p: RelatedPlayer; side: Side }) {
  return (
    <li>
      <Link
        to={`/players/${p.steamId}`}
        className="pressable flex items-center gap-3 rounded-lg py-1"
      >
        <Avatar name={p.displayName} src={p.avatarUrl} className="size-8 text-[11px]" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{p.displayName}</span>
          <span className="text-xs text-subtle tabular-nums">
            {p.matches} parties · {p.wins} V · {p.losses} D
          </span>
        </span>
        <span
          className="text-sm tabular-nums"
          title={`Victoires du joueur ${side === "with" ? "avec" : "contre"} ${p.displayName}`}
        >
          {formatPercent(p.winRate)}
        </span>
      </Link>
    </li>
  );
}

/** Joués avec / contre : parties communes sur la période du scope (jamais « amis Steam »). */
export function RelationshipsWidget({
  relationships,
  gameModeNote,
}: {
  relationships: ReturnType<typeof usePlayerRelationships>;
  /** Précise le format réellement utilisé quand le scope est « tous les formats ». */
  gameModeNote: string | null;
}) {
  const [side, setSide] = useState<Side>("with");
  const data = relationships.data;
  const list = side === "with" ? data?.teammates : data?.opponents;
  return (
    <DoubleBezel size="md" innerClassName="p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[15px]">Joués avec et contre</h2>
        <Segmented<Side>
          ariaLabel="Coéquipiers ou adversaires"
          size="sm"
          value={side}
          onChange={setSide}
          options={[
            { value: "with", label: "Avec" },
            { value: "against", label: "Contre" },
          ]}
        />
      </div>
      {relationships.isPending ? (
        <div className="mt-3 space-y-2" aria-busy="true">
          <Skeleton className="h-9 rounded-lg" />
          <Skeleton className="h-9 rounded-lg" />
        </div>
      ) : relationships.isError || !data ? (
        <p className="mt-3 text-sm text-subtle">Données indisponibles pour le moment.</p>
      ) : list === null || list === undefined ? (
        <p className="mt-3 text-sm text-subtle">
          Cette liste est indisponible : la source n&apos;a pas répondu.
        </p>
      ) : list.length === 0 ? (
        <p className="mt-3 text-sm text-subtle">
          Aucun joueur croisé au moins {data.appliedFilters.minMatches} fois sur cette période.
        </p>
      ) : (
        <ul
          className="mt-3 space-y-1.5"
          aria-label={side === "with" ? "Coéquipiers" : "Adversaires"}
        >
          {list.map((p) => (
            <Row key={p.steamId} p={p} side={side} />
          ))}
        </ul>
      )}
      {gameModeNote && <p className="mt-2 text-[11px] text-subtle">{gameModeNote}</p>}
    </DoubleBezel>
  );
}
