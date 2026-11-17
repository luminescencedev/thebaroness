import type { PlayerProfile } from "@/api";
import { RankBadge } from "@/components/media/RankBadge";
import { DoubleBezel, Skeleton } from "@/components/ui";
import { formatPercent } from "@/lib/format";
import { modeComboLabel } from "@/lib/modes";
import { rankLabel } from "@/lib/rank";
import type { usePlayerOverview } from "@/features/players/hooks";
import { periodLong } from "./scopeText";
import type { ProfileScope } from "@/api";

/**
 * Rang officiel (indépendant des filtres) et bilan par combinaison format x type, calculé par le back
 * pour le périmètre choisi.
 */
export function RankModesWidget({
  profile,
  overview,
  scope,
}: {
  profile: PlayerProfile;
  overview: ReturnType<typeof usePlayerOverview>;
  scope: ProfileScope;
}) {
  const { rank } = profile;
  const label = rankLabel(rank.name, rank.subrank);
  const data = overview.data;
  return (
    <DoubleBezel size="md" innerClassName="p-4">
      <h2 className="text-[15px]">Rang et modes</h2>
      <div className="mt-3 flex items-center gap-3">
        {label ? (
          <>
            <RankBadge name={label} imageUrl={rank.imageUrl} size="lg" />
            <div>
              <p className="text-xs text-subtle">Rang classé actuel</p>
              <p
                className="text-lg font-semibold tracking-[-0.03em]"
                style={{ color: rank.color ?? undefined }}
              >
                {label}
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted">Aucun rang classé connu.</p>
        )}
      </div>

      {overview.isPending ? (
        <div className="mt-4 space-y-3" aria-busy="true" aria-label="Chargement des modes">
          <Skeleton className="h-9 rounded-lg" />
          <Skeleton className="h-9 rounded-lg" />
        </div>
      ) : overview.isError || !data ? (
        <p className="mt-4 text-xs text-subtle">Bilan par mode indisponible pour le moment.</p>
      ) : data.modes.length === 0 ? (
        <p className="mt-4 text-xs text-subtle">
          Aucune partie à mode connu sur les {periodLong(scope)}.
        </p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {data.modes.map((r) => {
            const name = modeComboLabel(r.gameMode, r.matchMode);
            return (
              <li key={`${r.gameMode}|${r.matchMode}`} className="text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-text">{name}</span>
                  <span className="text-xs text-muted tabular-nums">
                    {r.wins} V · {r.losses} D · {formatPercent(r.winRate)}
                  </span>
                </div>
                <div
                  className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.07]"
                  role="img"
                  aria-label={`${name} : ${r.matches} parties, ${formatPercent(r.winRate)} de victoires`}
                >
                  <span
                    className="block h-full rounded-full bg-win"
                    style={{ width: `${r.winRate}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {data && (
        <p className="mt-3 text-[11px] leading-relaxed text-subtle">
          {periodLong(scope)} : {data.coverage.includedMatches} partie
          {data.coverage.includedMatches > 1 ? "s" : ""}. Le rang ne dépend pas de ce filtre.
        </p>
      )}
    </DoubleBezel>
  );
}
