import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { isApiError } from "@/api";
import { Button, Dialog, buttonStyles, cn } from "@/components/ui";
import { useSession } from "@/features/auth/useSession";
import { TrackedForm } from "./TrackedForm";
import { useCreateTracked, useTrackedList } from "./hooks";

export function FollowButton({
  steamId,
  name,
  block = false,
}: {
  steamId: string;
  name: string;
  /** Pleine largeur (barre d'action mobile). */
  block?: boolean;
}) {
  const session = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const list = useTrackedList();
  const create = useCreateTracked();
  const [open, setOpen] = useState(false);

  if (!session) {
    return (
      <Link to="/login" state={{ from: location.pathname }} className={buttonStyles("secondary")}>
        Se connecter avec Steam pour suivre
      </Link>
    );
  }

  const existing = list.data?.items.find((t) => t.steamId === steamId);
  if (existing) {
    return (
      <Link
        to={`/tracked/${existing.id}`}
        className={cn(
          buttonStyles("secondary"),
          block && "!h-[50px] !w-full !rounded-[14px] !text-base",
        )}
      >
        Voir le suivi
      </Link>
    );
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        disabled={list.isPending}
        className={block ? "!h-[50px] !w-full !rounded-[14px] !text-base" : undefined}
      >
        Suivre{block ? ` ${name}` : ""}
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
                onSuccess: (created) => {
                  setOpen(false);
                  toast.success(`${name} ajouté à vos suivis`, {
                    action: {
                      label: "Ajouter une note",
                      onClick: () => void navigate(`/tracked/${created.id}`),
                    },
                  });
                },
                onError: (error) => {
                  if (isApiError(error) && error.code === "ALREADY_TRACKED") {
                    setOpen(false);
                    void list.refetch().then((r) => {
                      const existing = r.data?.items.find((t) => t.steamId === steamId);
                      toast.info("Déjà dans vos suivis", {
                        action: existing
                          ? {
                              label: "Ouvrir",
                              onClick: () => void navigate(`/tracked/${existing.id}`),
                            }
                          : undefined,
                      });
                    });
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
