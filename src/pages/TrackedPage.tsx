import { Link } from "react-router";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { ErrorState } from "@/components/ErrorState";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, Skeleton, Tag, buttonStyles } from "@/components/ui";
import { useTrackedList } from "@/features/tracked-players/hooks";
import { formatDate } from "@/lib/format";

export function TrackedPage() {
  useDocumentTitle("Mes suivis");
  const list = useTrackedList();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Mes suivis"
        description="Vos joueurs suivis. Cette liste est privée."
        actions={
          <Link to="/search" className={buttonStyles("secondary")}>
            Rechercher un joueur
          </Link>
        }
      />
      {list.isPending ? (
        <div className="space-y-2" aria-busy="true" aria-label="Chargement des suivis">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-card" />
          ))}
        </div>
      ) : list.isError ? (
        <ErrorState
          error={list.error}
          title="Suivis indisponibles"
          onRetry={() => void list.refetch()}
        />
      ) : list.data.items.length === 0 ? (
        <EmptyState
          title="Aucun joueur suivi"
          description="Recherchez un joueur puis choisissez « Suivre » depuis son profil."
          action={
            <Link to="/search" className={buttonStyles("primary")}>
              Rechercher un joueur
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2">
          {list.data.items.map((t) => (
            <li key={t.id}>
              <Link
                to={`/tracked/${t.id}`}
                className="pressable card block p-4 hover:border-border-strong"
              >
                <span className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">{t.alias || "Sans alias"}</span>
                  <span className="text-xs text-subtle">Modifié le {formatDate(t.updatedAt)}</span>
                </span>
                <span className="mono mt-0.5 block text-xs text-subtle">{t.steamId}</span>
                {t.tags.length > 0 && (
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    {t.tags.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
