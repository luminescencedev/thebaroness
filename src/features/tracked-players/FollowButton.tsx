import { useState } from "react";
import { Link, useLocation } from "react-router";
import { toast } from "sonner";
import { isApiError } from "@/api";
import { Button, Dialog, buttonStyles } from "@/components/ui";
import { useSession } from "@/features/auth/useSession";
import { TrackedForm } from "./TrackedForm";
import { useCreateTracked, useTrackedList } from "./hooks";

export function FollowButton({ steamId, name }: { steamId: string; name: string }) {
  const session = useSession();
  const location = useLocation();
  const list = useTrackedList();
  const create = useCreateTracked();
  const [open, setOpen] = useState(false);

  if (!session) {
    return (
      <Link to="/login" state={{ from: location.pathname }} className={buttonStyles("secondary")}>
        Se connecter pour suivre
      </Link>
    );
  }

  const existing = list.data?.items.find((t) => t.steamId === steamId);
  if (existing) {
    return (
      <Link to={`/tracked/${existing.id}`} className={buttonStyles("secondary")}>
        Voir le suivi
      </Link>
    );
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={list.isPending}>
        Suivre
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) create.reset();
        }}
        title={`Suivre ${name}`}
        description="Ajoutez un alias, une note ou des tags pour retrouver ce joueur."
      >
        <TrackedForm
          submitLabel="Suivre ce joueur"
          pending={create.isPending}
          error={create.error}
          onCancel={() => setOpen(false)}
          onSubmit={(v) =>
            create.mutate(
              { steamId, alias: v.alias.trim(), note: v.note.trim(), tags: v.tags },
              {
                onSuccess: () => setOpen(false),
                onError: (error) => {
                  if (isApiError(error) && error.code === "ALREADY_TRACKED") {
                    setOpen(false);
                    void list.refetch();
                    toast.info("Ce joueur est déjà dans vos suivis.");
                  }
                },
              },
            )
          }
        />
      </Dialog>
    </>
  );
}
