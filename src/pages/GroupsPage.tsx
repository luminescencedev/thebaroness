import { useState } from "react";
import { Link, useNavigate } from "react-router";
import type { GroupWithMembers, MemberIdentity, TrackedPlayer } from "@/api";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { ErrorState } from "@/components/ErrorState";
import { PageHeader } from "@/components/PageHeader";
import { Avatar, Button, Dialog, EmptyState, Skeleton } from "@/components/ui";
import { GroupForm } from "@/features/groups/GroupForm";
import { useCreateGroup, useGroups } from "@/features/groups/hooks";
import { useTrackedList } from "@/features/tracked-players/hooks";
import { timeAgo } from "@/lib/format";

/** Nom d'un membre : alias de vos suivis d'abord, puis le pseudo résolu par le back, sinon le SteamID abrégé. */
function memberName(m: MemberIdentity, tracked: TrackedPlayer[]): { name: string; known: boolean } {
  const alias = tracked.find((t) => t.steamId === m.steamId)?.alias;
  if (alias) return { name: alias, known: true };
  if (m.resolved) return { name: m.displayName, known: true };
  return { name: `Joueur ${m.steamId.slice(-4)}`, known: false };
}

/**
 * Aperçu des membres : identités fournies par le back avec `GET /groups?include=members` (une seule requête
 * pour toute la liste). Sans elles (back plus ancien), seulement les alias de vos suivis et le nombre de joueurs.
 */
function memberPreview(group: GroupWithMembers, tracked: TrackedPlayer[]) {
  const total = group.steamIds.length;
  const members = group.members ?? [];
  const named = members.map((m) => ({ m, ...memberName(m, tracked) }));
  if (named.length === 0) {
    const names = group.steamIds
      .map((id) => tracked.find((t) => t.steamId === id)?.alias)
      .filter((n): n is string => Boolean(n))
      .slice(0, 3);
    const rest = total - names.length;
    return {
      avatars: [] as typeof named,
      text:
        names.length === 0
          ? `${total} joueurs`
          : `${total} joueurs · ${names.join(", ")}${rest > 0 ? ` et ${rest} autre${rest > 1 ? "s" : ""}` : ""}`,
    };
  }
  const shown = named.slice(0, 3);
  const rest = total - shown.length;
  const list = shown.map((n) => n.name).join(", ");
  return {
    avatars: shown,
    text: rest > 0 ? `${list} et ${rest} autre${rest > 1 ? "s" : ""}` : list,
  };
}

function GroupRow({ group, tracked }: { group: GroupWithMembers; tracked: TrackedPlayer[] }) {
  const preview = memberPreview(group, tracked);
  return (
    <li className="border-t border-divider first:border-t-0">
      <Link
        to={`/groups/${group.id}`}
        className="row-link flex min-h-[68px] items-center gap-3.5 px-4 py-3"
      >
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-strong text-sm font-semibold tabular-nums"
        >
          {group.steamIds.length}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-medium tracking-[-0.012em]">
            {group.name}
          </span>
          <span className="mt-1 flex min-w-0 items-center gap-2 text-[12.5px] text-subtle">
            {preview.avatars.length > 0 && (
              <span aria-hidden="true" className="flex shrink-0 -space-x-1.5">
                {preview.avatars.map(({ m, name }) => (
                  <Avatar
                    key={m.steamId}
                    name={name}
                    src={m.avatarUrl}
                    className="size-5 overflow-hidden text-[8px] ring-2 ring-[var(--surface-1)]"
                  />
                ))}
              </span>
            )}
            <span className="truncate">
              <span className="sr-only">{group.steamIds.length} joueurs : </span>
              {preview.text}
            </span>
          </span>
        </span>
        <span className="hidden text-xs whitespace-nowrap text-subtle sm:block">
          Modifié {timeAgo(group.updatedAt)}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="row-chevron size-3.5 shrink-0 text-subtle"
        >
          <path
            d="m9 6 6 6-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
    </li>
  );
}

const FILTER_FROM = 8;

export function GroupsPage() {
  useDocumentTitle("Groupes");
  const groups = useGroups();
  const tracked = useTrackedList();
  const create = useCreateGroup();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");

  const items = groups.data?.items ?? [];
  const needle = filter.trim().toLowerCase();
  const visible = needle ? items.filter((g) => g.name.toLowerCase().includes(needle)) : items;

  return (
    <div className="mx-auto max-w-[880px]">
      <PageHeader
        title="Groupes"
        description="Comparez vos amis : classement, progression de rang et meilleures parties."
        actions={
          items.length > 0 ? (
            <Button onClick={() => setOpen(true)}>Nouveau groupe</Button>
          ) : undefined
        }
      />

      {groups.isPending ? (
        <div className="card overflow-hidden" aria-busy="true" aria-label="Chargement des groupes">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex h-[68px] items-center gap-3.5 border-t border-divider px-4 first:border-t-0"
            >
              <Skeleton className="!h-10 !w-10 shrink-0 !rounded-xl" />
              <span className="flex flex-1 flex-col gap-2">
                <Skeleton className="!h-3.5 w-[40%]" />
                <Skeleton className="!h-2.5 w-[60%]" />
              </span>
            </div>
          ))}
        </div>
      ) : groups.isError ? (
        <ErrorState
          error={groups.error}
          title="Groupes indisponibles"
          reassure={false}
          onRetry={() => void groups.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon="plus"
          title="Aucun groupe"
          description="Créez un groupe de 2 à 20 joueurs pour comparer leur classement, leur progression de rang et leurs meilleures parties."
          action={<Button onClick={() => setOpen(true)}>Nouveau groupe</Button>}
        />
      ) : (
        <>
          {items.length >= FILTER_FROM && (
            <label className="search-field mb-3 max-w-xs">
              <span className="sr-only">Filtrer les groupes</span>
              <input
                type="search"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filtrer par nom"
                autoComplete="off"
                className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-subtle"
              />
            </label>
          )}
          {visible.length === 0 ? (
            <EmptyState
              icon="search"
              title="Aucun groupe de ce nom"
              description={`Aucun résultat pour « ${filter.trim()} ».`}
            />
          ) : (
            <ul className="card overflow-hidden" aria-label="Vos groupes">
              {visible.map((g) => (
                <GroupRow key={g.id} group={g} tracked={tracked.data?.items ?? []} />
              ))}
            </ul>
          )}
        </>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) create.reset();
        }}
        title="Nouveau groupe"
        description="Choisissez 2 à 20 joueurs : par pseudo, parmi vos suivis ou par SteamID64."
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
