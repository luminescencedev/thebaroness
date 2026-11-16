import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { isApiError, type TrackedPlayer } from "@/api";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { ErrorState } from "@/components/ErrorState";
import { RankBadge } from "@/components/media/RankBadge";
import {
  Avatar,
  Button,
  Card,
  Dialog,
  EmptyState,
  Field,
  Input,
  Skeleton,
  Textarea,
  buttonStyles,
  cn,
} from "@/components/ui";
import { usePlayer } from "@/features/players/hooks";
import { TagsInput } from "@/features/tracked-players/TagsInput";
import { useDeleteTracked, useTracked, useUpdateTracked } from "@/features/tracked-players/hooks";
import { validateTracked, type TrackedValues } from "@/features/tracked-players/validation";
import { formatDate, formatDateTime, formatDecimal, formatPercent, timeAgo } from "@/lib/format";

const counter = (n: number, max: number) =>
  `${n.toLocaleString("fr-FR")} / ${max.toLocaleString("fr-FR")}`;

/** Formulaire d'édition : une barre « modifications non enregistrées » apparaît dès qu'un champ change. */
function EditForm({ tracked }: { tracked: TrackedPlayer }) {
  const update = useUpdateTracked(tracked.id);
  const initial: TrackedValues = { alias: tracked.alias, note: tracked.note, tags: tracked.tags };
  const [values, setValues] = useState<TrackedValues>(initial);
  const [errors, setErrors] = useState<ReturnType<typeof validateTracked>>({});

  const patch = {
    ...(values.alias.trim() !== initial.alias && { alias: values.alias.trim() }),
    ...(values.note.trim() !== initial.note && { note: values.note.trim() }),
    ...(JSON.stringify(values.tags) !== JSON.stringify(initial.tags) && { tags: values.tags }),
  };
  const dirty = Object.keys(patch).length > 0;
  const serverMessage =
    isApiError(update.error) && update.error.status === 400 ? update.error.message : null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found = validateTracked(values);
    setErrors(found);
    // PATCH partiel : seulement les champs modifiés, jamais un objet vide.
    if (Object.keys(found).length === 0 && dirty) update.mutate(patch);
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Field
        label="Alias"
        error={errors.alias}
        hint="Le nom qui s'affiche dans votre liste."
        aside={counter(values.alias.length, 80)}
      >
        {(p) => (
          <Input
            {...p}
            value={values.alias}
            onChange={(e) => setValues({ ...values, alias: e.target.value })}
          />
        )}
      </Field>
      <Field
        label="Note"
        error={errors.note}
        hint="Habitudes, héros favoris, disponibilités."
        aside={counter(values.note.length, 1000)}
      >
        {(p) => (
          <Textarea
            {...p}
            value={values.note}
            onChange={(e) => setValues({ ...values, note: e.target.value })}
          />
        )}
      </Field>
      <Field
        label="Tags"
        error={errors.tags}
        hint="10 maximum, 24 caractères chacun."
        aside={counter(values.tags.length, 10)}
      >
        {(p) => (
          <TagsInput
            id={p.id}
            invalid={p.invalid}
            aria-describedby={p["aria-describedby"]}
            value={values.tags}
            onChange={(tags) => setValues({ ...values, tags })}
          />
        )}
      </Field>
      <Field label="SteamID64" hint="Fixé à la création du suivi.">
        {(p) => <Input {...p} readOnly value={tracked.steamId} className="mono text-muted" />}
      </Field>
      {serverMessage && (
        <p role="alert" className="text-[13px] text-loss">
          {serverMessage}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2 border-t border-divider pt-4">
        <span
          role="status"
          className={cn(
            "basis-full text-[13px] transition-colors duration-150 sm:mr-auto sm:basis-auto",
            dirty ? "text-[#d2ccff]" : "text-subtle",
          )}
        >
          {dirty ? "Modifications non enregistrées" : "Aucune modification"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          disabled={!dirty || update.isPending}
          onClick={() => {
            setValues(initial);
            setErrors({});
            update.reset();
          }}
        >
          Annuler
        </Button>
        <Button type="submit" size="sm" disabled={!dirty} loading={update.isPending}>
          Enregistrer
        </Button>
      </div>
    </form>
  );
}

export function TrackedDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const tracked = useTracked(id);
  const profile = usePlayer(tracked.data?.steamId ?? "");
  const remove = useDeleteTracked(id);
  const [confirming, setConfirming] = useState(false);
  useDocumentTitle(tracked.data?.alias || "Détail d'un suivi");

  if (tracked.isPending) {
    return (
      <Skeleton className="mx-auto h-96 max-w-[1100px] rounded-card" aria-label="Chargement" />
    );
  }
  if (tracked.isError) {
    const notFound = isApiError(tracked.error) && [400, 404].includes(tracked.error.status);
    return notFound ? (
      <EmptyState
        icon="search"
        title="Suivi introuvable"
        description="Ce suivi n'existe pas, ou ne vous appartient pas."
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
  const player = profile.data;
  const name = player?.player.displayName ?? t.steamId;
  const title = t.alias || name;

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      {/* Le fil d'Ariane du header masque le parent sous 640 px : lien de retour équivalent. */}
      <Link
        to="/tracked"
        className="hover-text pressable -mb-2 inline-flex items-center gap-1 rounded-md text-[13px] text-muted sm:hidden"
      >
        <span aria-hidden="true">‹</span> Mes suivis
      </Link>

      <header className="flex flex-wrap items-center gap-4">
        <Avatar
          name={name}
          src={player?.player.avatarUrl}
          className="size-14 rounded-[14px] text-xl"
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-3xl">{title}</h1>
          <p className="mt-1 text-[13px] text-muted">
            {name} · suivi depuis le {formatDate(t.createdAt)}
          </p>
        </div>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card className="p-6">
          {/* Après un enregistrement, updatedAt change : le formulaire repart de l'état serveur. */}
          <EditForm key={t.updatedAt} tracked={t} />
        </Card>

        <div className="space-y-4">
          <Card className="space-y-4 p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[15px]">Profil lié</h2>
              {player && (
                <span className="text-xs text-subtle">{timeAgo(player.meta.fetchedAt)}</span>
              )}
            </div>
            {profile.isPending ? (
              <Skeleton className="h-24" />
            ) : player ? (
              <dl className="grid grid-cols-3 gap-2">
                <div>
                  <dt className="text-xs text-subtle">Rang</dt>
                  <dd className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
                    <RankBadge name={player.rank.name} imageUrl={player.rank.imageUrl} size="sm" />
                    {player.rank.name ?? "n/d"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-subtle">Victoires</dt>
                  <dd className="mt-1 text-sm font-semibold tabular-nums">
                    {formatPercent(player.stats.winRate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-subtle">KDA</dt>
                  <dd className="mt-1 text-sm font-semibold tabular-nums">
                    {formatDecimal(player.stats.kda)}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-muted">
                Le profil public est indisponible pour le moment.
              </p>
            )}
            <Link to={`/players/${t.steamId}`} className={`${buttonStyles("secondary")} w-full`}>
              Voir le profil public
            </Link>
          </Card>

          <Card className="space-y-3 p-5">
            <p className="text-xs text-subtle">
              Créé le {formatDateTime(t.createdAt)}
              <br />
              Modifié {timeAgo(t.updatedAt)}
            </p>
            <Button variant="danger" className="w-full" onClick={() => setConfirming(true)}>
              Ne plus suivre {name}
            </Button>
            <p className="text-xs text-subtle">
              L&apos;alias, la note et les tags seront supprimés définitivement.
            </p>
          </Card>
        </div>
      </div>

      <Dialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Ne plus suivre ${name} ?`}
        description="L'alias, la note et les tags seront supprimés. Le profil public reste consultable."
      >
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirming(false)}>
            Garder
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
            Ne plus suivre
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
