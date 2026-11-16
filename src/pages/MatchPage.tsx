import { Link, useParams } from "react-router";
import { isApiError, type MatchTeam } from "@/api";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { DataMetaNotice } from "@/components/DataMetaNotice";
import { ErrorState } from "@/components/ErrorState";
import { HeroPortrait } from "@/components/media/HeroPortrait";
import { Card, EmptyState, Skeleton, buttonStyles, cn } from "@/components/ui";
import { useMatch } from "@/features/leaderboard/hooks";
import { NA, formatDateTime, formatDuration, formatInt } from "@/lib/format";

const TEAM_NAMES = { amber: "Amber Hand", sapphire: "Sapphire Flame" } as const;

function Team({ team }: { team: MatchTeam }) {
  const win = team.outcome === "win";
  return (
    <section aria-label={TEAM_NAMES[team.side]}>
      <h2 className="mb-3 flex items-center gap-3 text-xl">
        <span
          aria-hidden="true"
          className="size-2.5 rounded-full"
          style={{ backgroundColor: team.side === "amber" ? "#f5b14c" : "#5b9dff" }}
        />
        {TEAM_NAMES[team.side]}
        <span className={cn("text-sm font-semibold", win ? "text-win" : "text-loss")}>
          {win ? "Victoire" : "Défaite"}
        </span>
      </h2>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[34rem] text-sm">
          <caption className="sr-only">Joueurs de la {TEAM_NAMES[team.side]}</caption>
          <thead>
            <tr className="border-b border-border text-left text-xs text-subtle">
              <th scope="col" className="px-4 py-2.5 font-medium">
                Joueur
              </th>
              <th scope="col" className="px-2 py-2.5 font-medium">
                Niv.
              </th>
              <th scope="col" className="px-2 py-2.5 font-medium">
                É / M / A
              </th>
              <th scope="col" className="px-2 py-2.5 font-medium">
                Valeur nette
              </th>
              <th scope="col" className="px-2 py-2.5 font-medium">
                Derniers coups
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Dénis
              </th>
            </tr>
          </thead>
          <tbody>
            {team.players.map((p, i) => (
              <tr key={`${p.displayName}-${i}`} className="border-b border-border last:border-0">
                <th scope="row" className="px-4 py-2.5 text-left font-normal">
                  <span className="flex items-center gap-3">
                    <HeroPortrait
                      name={p.heroName}
                      src={p.heroImageUrl}
                      rounded="full"
                      className="size-8"
                    />
                    <span className="min-w-0">
                      {p.steamId ? (
                        <Link
                          to={`/players/${p.steamId}`}
                          className="block truncate font-medium hover:underline"
                        >
                          {p.displayName}
                        </Link>
                      ) : (
                        <span className="block truncate font-medium">{p.displayName}</span>
                      )}
                      <span className="block text-xs text-subtle">{p.heroName}</span>
                    </span>
                  </span>
                </th>
                <td className="px-2 py-2.5 text-muted">{formatInt(p.level)}</td>
                <td className="px-2 py-2.5 text-muted">
                  {p.kills === null || p.deaths === null || p.assists === null
                    ? NA
                    : `${p.kills} / ${p.deaths} / ${p.assists}`}
                </td>
                <td className="px-2 py-2.5 text-muted">{formatInt(p.netWorth)}</td>
                <td className="px-2 py-2.5 text-muted">{formatInt(p.lastHits)}</td>
                <td className="px-4 py-2.5 text-muted">{formatInt(p.denies)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function MatchPage() {
  const { matchId = "" } = useParams();
  const query = useMatch(matchId);
  useDocumentTitle(`Partie ${matchId}`);

  if (query.isPending) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-24 rounded-card" />
        <Skeleton className="h-64 rounded-card" />
      </div>
    );
  }
  if (query.isError) {
    if (isApiError(query.error) && (query.error.status === 404 || query.error.status === 400)) {
      return (
        <EmptyState
          title="Partie introuvable"
          description="Cette partie n'est pas disponible."
          action={
            <Link to="/search" className={buttonStyles("secondary")}>
              Rechercher un joueur
            </Link>
          }
        />
      );
    }
    return (
      <ErrorState
        error={query.error}
        title="Partie indisponible"
        onRetry={() => void query.refetch()}
      />
    );
  }

  const { match, meta } = query.data;
  return (
    <div className="space-y-8">
      <Card className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mono text-xs text-subtle">Partie {match.matchId}</p>
          <h1 className="mt-1 text-3xl sm:text-4xl">
            Victoire de la {TEAM_NAMES[match.winningSide]}
          </h1>
        </div>
        <dl className="flex gap-8 text-sm">
          <div>
            <dt className="text-xs text-subtle">Date</dt>
            <dd className="mt-0.5 text-muted">{formatDateTime(match.playedAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-subtle">Durée</dt>
            <dd className="mt-0.5 text-muted">{formatDuration(match.durationSeconds)}</dd>
          </div>
        </dl>
      </Card>
      {match.teams.map((t) => (
        <Team key={t.side} team={t} />
      ))}
      <DataMetaNotice meta={meta} />
    </div>
  );
}
