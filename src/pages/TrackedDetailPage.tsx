import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { isApiError } from "@/api";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { ErrorState } from "@/components/ErrorState";
import {
  Avatar,
  Button,
  Card,
  Dialog,
  EmptyState,
  Skeleton,
  Tag,
  buttonStyles,
} from "@/components/ui";
import { usePlayer } from "@/features/players/hooks";
import { TrackedForm } from "@/features/tracked-players/TrackedForm";
import { useDeleteTracked, useTracked, useUpdateTracked } from "@/features/tracked-players/hooks";
import { formatDateTime } from "@/lib/format";

export function TrackedDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const tracked = useTracked(id);
  const profile = usePlayer(tracked.data?.steamId ?? "");
  const update = useUpdateTracked(id);
  const remove = useDeleteTracked(id);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  useDocumentTitle(tracked.data?.alias || "Détail d'un suivi");

  if (tracked.isPending) {
    return <Skeleton className="mx-auto h-64 max-w-2xl rounded-card" aria-label="Chargement" />;
  }
  if (tracked.isError) {
    const notFound =
      isApiError(tracked.error) && (tracked.error.status === 404 || tracked.error.status === 400);
    return notFound ? (
      <EmptyState
        title="Suivi introuvable"
        description="Ce suivi n'existe pas ou a été supprimé."
        action={
          <Link to="/tracked" className={buttonStyles("secondary")}>
            Retour à mes suivis
          </Link>
        }
      />
    ) : (
      <ErrorState error={tracked.error} onRetry={() => void tracked.refetch()} />
    );
  }

  const t = tracked.data;
  const player = profile.data?.player;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link to="/tracked" className="text-sm text-muted underline underline-offset-4 hover-text">
        Mes suivis
      </Link>

      <Card className="space-y-5">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar
            name={player?.displayName ?? t.alias ?? "?"}
            src={player?.avatarUrl}
            className="size-14"
          />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl">{t.alias || "Sans alias"}</h1>
            <p className="mono mt-1 text-xs text-subtle">{t.steamId}</p>
            {player && <p className="mt-0.5 text-sm text-muted">{player.displayName}</p>}
          </div>
          <Link to={`/players/${t.steamId}`} className={buttonStyles("secondary", "sm")}>
            Voir le profil
          </Link>
        </div>

        {editing ? (
          <TrackedForm
            initial={{ alias: t.alias, note: t.note, tags: t.tags }}
            submitLabel="Enregistrer"
            pending={update.isPending}
            error={update.error}
            onCancel={() => setEditing(false)}
            onSubmit={(v) => {
              // PATCH partiel : seulement les champs modifiés, jamais un objet vide.
              const patch = {
                ...(v.alias.trim() !== t.alias && { alias: v.alias.trim() }),
                ...(v.note.trim() !== t.note && { note: v.note.trim() }),
                ...(JSON.stringify(v.tags) !== JSON.stringify(t.tags) && { tags: v.tags }),
              };
              if (Object.keys(patch).length === 0) return setEditing(false);
              update.mutate(patch, { onSuccess: () => setEditing(false) });
            }}
          />
        ) : (
          <>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs text-subtle">Note</dt>
                <dd className="mt-1 whitespace-pre-wrap text-muted">{t.note || "Aucune note."}</dd>
              </div>
              <div>
                <dt className="text-xs text-subtle">Tags</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {t.tags.length > 0 ? (
                    t.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)
                  ) : (
                    <span className="text-muted">Aucun tag.</span>
                  )}
                </dd>
              </div>
              <div className="flex gap-8 text-xs text-subtle">
                <span>Créé le {formatDateTime(t.createdAt)}</span>
                <span>Modifié le {formatDateTime(t.updatedAt)}</span>
              </div>
            </dl>
            <div className="flex justify-end gap-2">
              <Button variant="danger" onClick={() => setConfirming(true)}>
                Supprimer
              </Button>
              <Button variant="secondary" onClick={() => setEditing(true)}>
                Modifier
              </Button>
            </div>
          </>
        )}
      </Card>

      <Dialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Supprimer ce suivi ?"
        description="Le joueur sera retiré de votre liste. Cette action est définitive."
      >
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirming(false)}>
            Annuler
          </Button>
          <Button
            variant="danger"
            loading={remove.isPending}
            onClick={() =>
              remove.mutate(undefined, {
                onSuccess: () => void navigate("/tracked", { replace: true }),
                onSettled: () => setConfirming(false),
              })
            }
          >
            Supprimer
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
