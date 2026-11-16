import { Link } from "react-router";
import { ErrorState } from "@/components/ErrorState";
import { HeroPortrait } from "@/components/media/HeroPortrait";
import { Card, EmptyState, Skeleton } from "@/components/ui";
import { usePlayerHeroes } from "@/features/leaderboard/hooks";
import { formatDecimal, formatPercent } from "@/lib/format";

export function HeroesTab({ steamId }: { steamId: string }) {
  const q = usePlayerHeroes(steamId);
  if (q.isPending) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-36 rounded-card" />
        ))}
      </div>
    );
  }
  if (q.isError)
    return (
      <ErrorState error={q.error} title="Héros indisponibles" onRetry={() => void q.refetch()} />
    );
  if (q.data.items.length === 0) {
    return (
      <EmptyState
        title="Aucun héros"
        description="Aucune partie disponible pour établir les héros joués."
      />
    );
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {q.data.items.map((h) => (
        <li key={h.heroId}>
          <Card className="flex flex-col gap-4 p-5">
            <div className="flex items-center gap-3">
              <HeroPortrait
                name={h.heroName}
                src={h.heroImageUrl}
                rounded="xl"
                className="size-12"
              />
              <div className="min-w-0">
                <Link
                  to={`/heroes/${h.heroId}`}
                  className="block truncate font-semibold hover:underline"
                >
                  {h.heroName}
                </Link>
                <span className="text-xs text-subtle">{h.matches} parties</span>
              </div>
            </div>
            <dl className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <dt className="text-xs text-subtle">Victoires</dt>
                <dd className="mt-0.5 font-semibold tabular-nums">{formatPercent(h.winRate)}</dd>
              </div>
              <div>
                <dt className="text-xs text-subtle">Bilan</dt>
                <dd className="mt-0.5 font-semibold tabular-nums">
                  {h.wins} V {h.matches - h.wins} D
                </dd>
              </div>
              <div>
                <dt className="text-xs text-subtle">KDA</dt>
                <dd className="mt-0.5 font-semibold tabular-nums">{formatDecimal(h.kda)}</dd>
              </div>
            </dl>
          </Card>
        </li>
      ))}
    </ul>
  );
}
