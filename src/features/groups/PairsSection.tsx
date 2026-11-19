import { Link } from "react-router";
import type { GroupPairItem, GroupPairs } from "@/api";
import { Avatar, cn } from "@/components/ui";
import { formatPercent, timeAgo } from "@/lib/format";
import { scopeLabel } from "@/features/players/profile/scopeText";

/** Sous ce nombre de parties communes, le taux n'est pas fiable (même repère que les titres du groupe). */
const LOW_TOGETHER = 5;

export interface PairMember {
  steamId: string;
  name: string;
  avatarUrl: string | null;
}

function Person({ m }: { m: PairMember }) {
  return (
    <Link
      to={`/players/${m.steamId}`}
      className="flex min-w-0 items-center gap-1.5 hover:underline"
    >
      <Avatar name={m.name} src={m.avatarUrl} className="size-6 text-[10px]" />
      <span className="truncate text-sm font-medium">{m.name}</span>
    </Link>
  );
}

function PairRow({ pair, people }: { pair: GroupPairItem; people: Map<string, PairMember> }) {
  const [a, b] = pair.steamIds.map(
    (id) => people.get(id) ?? { steamId: id, name: id, avatarUrl: null },
  ) as [PairMember, PairMember];
  const t = pair.together;
  const low = t.matches < LOW_TOGETHER;
  return (
    <li className="grid min-h-[56px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-t border-divider px-4 py-2.5 first:border-t-0">
      <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <Person m={a} />
        <span aria-hidden="true" className="text-subtle">
          +
        </span>
        <span className="sr-only"> et </span>
        <Person m={b} />
      </span>
      <span className="text-right">
        <span className="block text-sm font-medium whitespace-nowrap tabular-nums">
          {t.matches} partie{t.matches > 1 ? "s" : ""} · {t.wins} V / {t.losses} D
        </span>
        <span
          className={cn("block text-[11.5px] tabular-nums", low ? "text-warning" : "text-subtle")}
        >
          {t.winRate === null ? "Taux n/d" : `Taux ${formatPercent(t.winRate)}`}
          {low && " · échantillon faible"}
          {t.lastPlayedAt && ` · dernière ${timeAgo(t.lastPlayedAt)}`}
        </span>
        {pair.against.matches > 0 && (
          <span className="block text-[11.5px] text-subtle tabular-nums">
            {pair.against.matches} partie{pair.against.matches > 1 ? "s" : ""} l'un contre l'autre
          </span>
        )}
      </span>
    </li>
  );
}

/**
 * Parties jouées ensemble : « dans la même équipe », JAMAIS « en escouade » (le back ne peut pas confirmer une
 * escouade). Reçues avec la comparaison (`include=pairs`) : aucune requête de plus. Un membre absent de la
 * couverture est « non évalué », pas « 0 partie ». Sans `pairs` (back plus ancien), la section le dit.
 */
export function PairsSection({
  pairs,
  stale,
  people,
}: {
  pairs: GroupPairs | undefined;
  /** La comparaison affichée est celle de la sélection précédente. */
  stale: boolean;
  people: PairMember[];
}) {
  const byId = new Map(people.map((p) => [p.steamId, p]));
  const nameOf = (id: string) => byId.get(id)?.name ?? id;
  const intro = (
    <p className="max-w-2xl text-[12.5px] leading-relaxed text-subtle">
      Parties communes dans la même équipe, d'après l'intersection des historiques de deux membres.
      Une escouade de matchmaking n'est pas détectable : on ne parle jamais de partie « en groupe ».
    </p>
  );
  if (!pairs) {
    return (
      <div className="space-y-3">
        {intro}
        <p className="card px-5 py-5 text-[13px] text-muted">
          Cette version du back ne fournit pas les parties communes : aucune donnée à afficher.
        </p>
      </div>
    );
  }
  const served = scopeLabel({
    period: pairs.scope.period,
    gameMode: pairs.scope.gameMode,
    matchMode: pairs.scope.matchMode,
  });
  return (
    <div className="space-y-3">
      {intro}
      <div className="space-y-2.5">
        <p role="status" className="text-xs text-subtle">
          {served}
          {stale ? " · actualisation en cours : chiffres de la sélection précédente" : ""}
        </p>
        {pairs.items.length === 0 ? (
          <p className="card px-5 py-5 text-[13px] leading-relaxed text-muted">
            Aucune partie commune observée dans la même équipe sur cette sélection
            {pairs.coverage.membersMissing.length > 0
              ? `, pour les ${pairs.coverage.membersIncluded} joueurs évalués`
              : ""}
            .
          </p>
        ) : (
          <ul className="card overflow-hidden" aria-label="Parties jouées ensemble">
            {pairs.items.map((it) => (
              <PairRow key={it.steamIds.join("-")} pair={it} people={byId} />
            ))}
          </ul>
        )}
        {pairs.coverage.membersMissing.length > 0 && (
          <p className="text-[12.5px] leading-relaxed text-warning">
            Non évalués : {pairs.coverage.membersMissing.map(nameOf).join(", ")}. Leurs paires n'ont
            pas été calculées : l'absence d'une paire ne veut rien dire pour eux.
          </p>
        )}
        <p className="text-[11.5px] text-subtle tabular-nums">
          {pairs.coverage.pairsWithCommonMatches} paire
          {pairs.coverage.pairsWithCommonMatches > 1 ? "s" : ""} avec au moins une partie commune
          sur {pairs.coverage.pairsEvaluated} évaluée{pairs.coverage.pairsEvaluated > 1 ? "s" : ""}.
          Les parties abandonnées ou non scorées ne sont pas comptées.
        </p>
      </div>
    </div>
  );
}
