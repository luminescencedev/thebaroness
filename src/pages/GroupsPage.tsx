import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { ErrorState } from "@/components/ErrorState";
import { PageHeader } from "@/components/PageHeader";
import { Button, Dialog, EmptyState, Skeleton } from "@/components/ui";
import { GroupForm } from "@/features/groups/GroupForm";
import { useCreateGroup, useGroups } from "@/features/groups/hooks";
import { useTrackedList } from "@/features/tracked-players/hooks";
import { formatDate } from "@/lib/format";

export function GroupsPage() {
  useDocumentTitle("Groupes");
  const groups = useGroups();
  const tracked = useTrackedList();
  const create = useCreateGroup();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Groupes"
        description="Comparez vos amis : classement, progression de rang et meilleures parties."
        actions={<Button onClick={() => setOpen(true)}>Nouveau groupe</Button>}
      />

      {groups.isPending ? (
        <div className="space-y-2" aria-busy="true" aria-label="Chargement des groupes">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-24 rounded-card" />
          ))}
        </div>
      ) : groups.isError ? (
        <ErrorState
          error={groups.error}
          title="Groupes indisponibles"
          reassure={false}
          onRetry={() => void groups.refetch()}
        />
      ) : groups.data.items.length === 0 ? (
        <EmptyState
          icon="plus"
          title="Aucun groupe"
          description="Créez un groupe avec au moins 2 joueurs pour les comparer."
          action={<Button onClick={() => setOpen(true)}>Nouveau groupe</Button>}
        />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {groups.data.items.map((g) => {
            const names = g.steamIds.map(
              (id) => tracked.data?.items.find((t) => t.steamId === id)?.alias || id,
            );
            return (
              <li key={g.id}>
                <Link
                  to={`/groups/${g.id}`}
                  className="pressable card block h-full p-5 hover:border-border-strong"
                >
                  <span className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-lg font-semibold tracking-[-0.03em]">{g.name}</span>
                    <span className="text-xs text-subtle">
                      Modifié le {formatDate(g.updatedAt)}
                    </span>
                  </span>
                  <span className="mt-1 line-clamp-2 text-sm text-muted">
                    {g.steamIds.length} joueur{g.steamIds.length > 1 ? "s" : ""} :{" "}
                    {names.slice(0, 4).join(", ")}
                    {names.length > 4 ? "…" : ""}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) create.reset();
        }}
        title="Nouveau groupe"
        description="Choisissez parmi vos suivis ou ajoutez un SteamID."
        className="max-w-lg"
      >
        <GroupForm
          tracked={tracked.data?.items ?? []}
          submitLabel="Créer le groupe"
          pending={create.isPending}
          error={create.error}
          onCancel={() => setOpen(false)}
          onSubmit={(v) =>
            create.mutate(v, {
              onSuccess: (g) => {
                setOpen(false);
                void navigate(`/groups/${g.id}`);
              },
            })
          }
        />
      </Dialog>
    </div>
  );
}
