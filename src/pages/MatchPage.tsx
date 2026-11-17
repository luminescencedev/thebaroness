import { Link, useParams } from "react-router";
import { isApiError } from "@/api";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { BrandLoader } from "@/components/brand";
import { DataMetaNotice } from "@/components/DataMetaNotice";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState, buttonStyles } from "@/components/ui";
import { MatchDetailView } from "@/features/matches/detail/MatchDetailView";
import { useMatch } from "@/features/leaderboard/hooks";

export function MatchPage() {
  const { matchId = "" } = useParams();
  const query = useMatch(matchId);
  useDocumentTitle(`Partie ${matchId}`);

  if (query.isPending) return <BrandLoader message="Le Doorman descend chercher la partie" />;
  if (query.isError) {
    if (isApiError(query.error) && (query.error.status === 404 || query.error.status === 400)) {
      return (
        <EmptyState
          icon="search"
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
    <div className="space-y-4">
      <MatchDetailView match={match} />
      <DataMetaNotice meta={meta} />
    </div>
  );
}
