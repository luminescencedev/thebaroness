import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { isApiError, type CompareScope, type GroupUnavailableReason } from "@/api";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { DataMetaNotice } from "@/components/DataMetaNotice";
import { ErrorState } from "@/components/ErrorState";
import { Alert, Button, Dialog, EmptyState, Skeleton, buttonStyles, cn } from "@/components/ui";
import { BestMatches } from "@/features/groups/BestMatches";
import {
  DEFAULT_MIN_MATCHES,
  highlightRows,
  unavailableIds,
  unavailableReasonText,
  type SortKey,
} from "@/features/groups/compare";
import { ComparisonTable } from "@/features/groups/ComparisonTable";
import { FactsList } from "@/features/groups/FactsList";
import { GroupForm } from "@/features/groups/GroupForm";
import { GroupMenu } from "@/features/groups/GroupMenu";
import { PairsSection } from "@/features/groups/PairsSection";
import {
  useDeleteGroup,
  useGroupCompare,
  useRefreshGroup,
  useUpdateGroup,
} from "@/features/groups/hooks";
import { RankProgress } from "@/features/groups/RankProgress";
import { useRanks } from "@/features/heroes/hooks";
import { useProfileScope } from "@/features/players/scope";
import { ScopeBar } from "@/features/players/profile/ScopeBar";
import { scopeLabel } from "@/features/players/profile/scopeText";
import { useTrackedList } from "@/features/tracked-players/hooks";
import { formatDate, formatDateTime } from "@/lib/format";
import { errorMessage } from "@/lib/messages";

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="text-lg">
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * Comparaison d'un groupe. Ordre : le tableau comparatif d'abord (la raison d'être de la page), puis les
 * faits marquants, la progression de rang, les meilleures parties et la méthode. Tout vient du back.
 */
export function GroupDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  // Période et modes dans l'URL (comme le profil) : retour arrière, lien partageable.
  const { scope, setScope } = useProfileScope();
  const [sort, setSort] = useState<SortKey>("rank");
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const compare = useGroupCompare(id, scope as CompareScope);
  const ranks = useRanks();
  const tracked = useTrackedList();
  const update = useUpdateGroup(id);
  const remove = useDeleteGroup(id);
  const refresh = useRefreshGroup(id, scope as CompareScope);
  useDocumentTitle(compare.data?.group.name ?? "Groupe");

  const members = useMemo(() => compare.data?.members ?? [], [compare.data]);
  const rows = useMemo(
    () => highlightRows(compare.data?.highlights, members, ranks.data?.items),
    [compare.data, members, ranks.data],
  );

  if (compare.isPending) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Chargement de la comparaison">
        <Skeleton className="h-20 rounded-card" />
        <Skeleton className="h-72 rounded-card" />
      </div>
    );
  }
  if (compare.isError && !compare.data) {
    if (isApiError(compare.error) && [400, 404].includes(compare.error.status)) {
      return (
        <EmptyState
          title="Groupe introuvable"
          description="Ce groupe n'existe pas ou a été supprimé."
          action={
            <Link to="/groups" className={buttonStyles("secondary")}>
              Mes groupes
            </Link>
          }
        />
      );
    }
    // La période reste modifiable : une période qui échoue ne doit pas enfermer sur la page d'erreur.
    return (
      <div className="space-y-5">
        <ScopeBar scope={scope} onChange={setScope} />
        <ErrorState
          error={compare.error}
          title="Comparaison indisponible"
          reassure={false}
          onRetry={() => void compare.refetch()}
        />
      </div>
    );
  }

  const { group, meta, methodology } = compare.data;
  const stale = compare.isPlaceholderData;
  const minMatches = methodology?.highlightMinMatches ?? DEFAULT_MIN_MATCHES;
  // Membres absents : nommés par le back avec la raison (v1.15.0) ; sinon déduits (back plus ancien).
  const missing: { steamId: string; reason?: GroupUnavailableReason }[] =
    compare.data.unavailable ??
    unavailableIds(group.steamIds, members).map((steamId) => ({ steamId }));
  const nameOf = (steamId: string) =>
    tracked.data?.items.find((t) => t.steamId === steamId)?.alias || steamId;
  // Périmètre RÉELLEMENT servi (la réponse affichée peut dater de la sélection précédente).
  // Un back plus ancien (sans `appliedFilters`) ne connaît ni les modes ni de filtre : « tous », sur la période servie.
  const served = compare.data.appliedFilters ?? {
    period: compare.data.period,
    gameMode: "all" as const,
    matchMode: "all" as const,
  };
  const servedLabel = scopeLabel(served);
  const requestedLabel = scopeLabel(scope);
  const people = group.steamIds.map((steamId) => {
    const m = members.find((x) => x.steamId === steamId);
    return {
      steamId,
      name: nameOf(steamId) !== steamId ? nameOf(steamId) : (m?.displayName ?? steamId),
      avatarUrl: m?.avatarUrl ?? null,
    };
  });
  const prev = methodology?.previousPeriod;
  const previousLabel = prev ? `${formatDate(prev.from)} au ${formatDate(prev.to)}` : null;
  const excluded = members.reduce((n, m) => n + (m.excludedUnknownModeMatches ?? 0), 0);

  return (
    <div className="space-y-9">
      <div className="space-y-3">
        {/* Le fil d'Ariane du header masque le parent sous 640 px : lien de retour équivalent. */}
        <Link
          to="/groups"
          className="hover-text pressable inline-flex items-center gap-1 rounded-md text-[13px] text-muted sm:hidden"
        >
          <span aria-hidden="true">‹</span> Groupes
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl break-words sm:text-4xl">{group.name}</h1>
            <p className="mt-1.5 text-sm text-muted">
              {group.steamIds.length} joueurs · {servedLabel} · collecté le{" "}
              {formatDateTime(meta.fetchedAt)}
            </p>
            <p role="status" className="mt-1 text-xs text-subtle">
              {stale
                ? `Chargement de « ${requestedLabel} » : les chiffres affichés sont ceux de « ${servedLabel} ».`
                : compare.isFetching
                  ? "Actualisation en cours : les chiffres affichés peuvent changer."
                  : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ScopeBar scope={scope} onChange={setScope} />
            <Button
              variant="secondary"
              size="sm"
              loading={refresh.isPending}
              onClick={() => refresh.mutate()}
            >
              Actualiser
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              Modifier
            </Button>
            <GroupMenu onDelete={() => setConfirming(true)} />
          </div>
        </div>
      </div>

      <div
        className={cn("space-y-9 transition-opacity duration-150", stale && "opacity-60")}
        aria-busy={stale}
      >
        {(missing.length > 0 || meta.isPartial) && (
          <Alert tone="warning" className="space-y-1">
            {missing.length > 0 ? (
              <>
                <p>
                  {missing.length === 1 ? "Un joueur n'a" : `${missing.length} joueurs n'ont`} pas
                  pu être chargé{missing.length > 1 ? "s" : ""}. Les autres restent comparables,
                  mais cette comparaison est partielle.
                </p>
                <ul className="list-disc space-y-0.5 pl-5">
                  {missing.map((u) => (
                    <li key={u.steamId}>
                      {nameOf(u.steamId)}
                      {u.reason ? ` : ${unavailableReasonText(u.reason)}` : ""}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p>
                Données partielles : certaines informations (rangs ou héros) sont indisponibles pour
                le moment.
              </p>
            )}
          </Alert>
        )}
        {compare.isError && (
          <Alert tone="info" role="status">
            {errorMessage(compare.error)} Les données affichées datent du{" "}
            {formatDateTime(meta.fetchedAt)}.
          </Alert>
        )}

        <Section id="comparaison" title="Comparaison">
          {members.length === 0 ? (
            <EmptyState
              title="Aucune donnée"
              description="Aucun joueur du groupe n'a de données sur cette période."
            />
          ) : (
            <ComparisonTable
              members={members}
              groupIds={group.steamIds}
              sort={sort}
              onSort={setSort}
              minMatches={minMatches}
              ranks={ranks.data?.items}
              previousLabel={previousLabel}
            />
          )}
        </Section>

        {members.length > 0 && (
          <>
            <Section id="faits" title="Faits marquants">
              <FactsList rows={rows} />
            </Section>
            <RankProgress
              groupId={group.id}
              members={members}
              groupIds={group.steamIds}
              ranks={ranks.data?.items}
              seasons={methodology?.seasons}
              seasonBoundariesKnown={methodology?.seasonBoundariesKnown}
            />
            <Section id="ensemble" title="Jouer ensemble">
              <PairsSection pairs={compare.data.pairs} stale={stale} people={people} />
            </Section>
            <Section id="parties" title="Meilleures parties">
              <BestMatches members={members} />
              <p className="text-[12.5px] text-subtle">
                Meilleure partie de chaque joueur sur la période, selon le KDA.
              </p>
            </Section>
          </>
        )}

        <details className="group text-[13px] text-muted">
          <summary className="cursor-pointer select-none">Méthode et limites</summary>
          <div className="mt-2 max-w-2xl space-y-1.5 leading-relaxed text-subtle">
            <p>
              Rang : tier × 6 + sous-rang, tel que fourni par le back. Progression : dernier moins
              premier rang observé en parties classées{" "}
              {methodology?.rankDeltaScope === "latest_season_in_period"
                ? "pendant la dernière saison classée de la période"
                : "sur la période"}
              , « n/d » sous 2 observations.
              {methodology?.seasonBoundariesKnown === false &&
                " Les saisons classées sont indisponibles : la progression porte sur toute la période et peut mélanger deux saisons."}
            </p>
            <p>
              KDA : (K + A) / max(D, 1) sur les parties où kills, morts et assistances sont connus.
              Taux de victoire et KDA : un titre n'est attribué qu'à partir de {minMatches} parties
              ; en dessous, la valeur est signalée « échantillon faible ».
            </p>
            <p>
              Sélection : {servedLabel}.{" "}
              {served.gameMode === "all" && served.matchMode === "all"
                ? "Les modes de jeu sont confondus. "
                : ""}
              Les joueurs n'ont pas forcément le même nombre de parties : comparez les effectifs
              avant de conclure. Les ex æquo gardent tous la distinction.
              {methodology?.periodFrom &&
                ` Période : depuis le ${formatDateTime(methodology.periodFrom)}.`}
              {excluded > 0 &&
                ` ${excluded} partie${excluded > 1 ? "s" : ""} au mode inconnu écartée${excluded > 1 ? "s" : ""} par le filtre de mode.`}
            </p>
            {previousLabel && (
              <p>
                Les écarts « face à la période précédente » comparent à la fenêtre de même durée
                juste avant ({previousLabel}), avec les mêmes filtres.
              </p>
            )}
          </div>
        </details>

        <DataMetaNotice meta={{ ...meta, isPartial: false }} showDate={false} />
      </div>

      <Dialog
        open={editing}
        onOpenChange={(next) => {
          setEditing(next);
          if (!next) update.reset();
        }}
        title="Modifier le groupe"
        description="Renommez le groupe ou changez ses joueurs."
        className="max-w-lg"
      >
        <GroupForm
          tracked={tracked.data?.items ?? []}
          initial={{ name: group.name, steamIds: group.steamIds }}
          submitLabel="Enregistrer"
          pending={update.isPending}
          error={update.error}
          onCancel={() => setEditing(false)}
          onSubmit={(v) => update.mutate(v, { onSuccess: () => setEditing(false) })}
        />
      </Dialog>

      <Dialog
        open={confirming}
        onOpenChange={(next) => {
          setConfirming(next);
          if (!next) remove.reset();
        }}
        title="Supprimer ce groupe ?"
        description="Les joueurs restent dans vos suivis. Seul le groupe est supprimé."
      >
        {remove.isError && (
          <p role="alert" className="mt-3 text-[13px] text-loss">
            {errorMessage(remove.error)}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirming(false)}>
            Annuler
          </Button>
          <Button
            variant="danger"
            loading={remove.isPending}
            onClick={() =>
              remove.mutate(undefined, {
                onSuccess: () => {
                  setConfirming(false);
                  void navigate("/groups", { replace: true });
                },
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
