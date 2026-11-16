import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { isApiError, type ComparePeriod, type GroupMemberStats } from "@/api";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { MultiLineChart, type Series } from "@/components/charts";
import { DataMetaNotice } from "@/components/DataMetaNotice";
import { ErrorState } from "@/components/ErrorState";
import { HeroPortrait } from "@/components/media/HeroPortrait";
import { RankBadge } from "@/components/media/RankBadge";
import {
  Avatar,
  Button,
  Card,
  Dialog,
  EmptyState,
  Skeleton,
  buttonStyles,
  cn,
} from "@/components/ui";
import { useRanks } from "@/features/heroes/hooks";
import { GroupForm } from "@/features/groups/GroupForm";
import {
  SORTS,
  buildHighlights,
  rankDelta,
  scoreLabel,
  sortMembers,
  type SortKey,
} from "@/features/groups/compare";
import { useDeleteGroup, useGroupCompare, useUpdateGroup } from "@/features/groups/hooks";
import { useTrackedList } from "@/features/tracked-players/hooks";
import { formatDecimal, formatPercent } from "@/lib/format";

const PERIODS: { value: ComparePeriod; label: string }[] = [
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "season", label: "Saison" },
];

const COLORS = [
  "#b4abff",
  "#3dd68c",
  "#f5b14c",
  "#ff6b6f",
  "#5b9dff",
  "#e879f9",
  "#2dd4bf",
  "#fb923c",
];

function Climb({ member }: { member: GroupMemberStats }) {
  const d = rankDelta(member);
  if (d === null) return <span className="text-subtle">n/d</span>;
  if (d === 0) return <span className="text-muted">Stable</span>;
  const up = d > 0;
  return (
    <span className={cn("font-medium", up ? "text-win" : "text-loss")}>
      {up ? "En hausse" : "En baisse"} ({up ? "+" : ""}
      {d})
    </span>
  );
}

export function GroupDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<ComparePeriod>("30d");
  const [sort, setSort] = useState<SortKey>("rank");
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const compare = useGroupCompare(id, period);
  const ranks = useRanks();
  const tracked = useTrackedList();
  const update = useUpdateGroup(id);
  const remove = useDeleteGroup(id);
  useDocumentTitle(compare.data?.group.name ?? "Groupe");

  const members = useMemo(() => compare.data?.members ?? [], [compare.data]);
  const sorted = useMemo(() => sortMembers(members, sort), [members, sort]);
  const highlights = useMemo(
    () => buildHighlights(members, ranks.data?.items),
    [members, ranks.data],
  );
  const series: Series[] = useMemo(
    () =>
      members
        .filter((m) => m.rankHistory.length > 1)
        .map((m, i) => ({
          key: m.steamId,
          label: m.displayName,
          color: COLORS[i % COLORS.length] ?? "#fff",
          points: m.rankHistory.map((p) => ({ at: Date.parse(p.at), value: p.score })),
        })),
    [members],
  );

  if (compare.isPending) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-24 rounded-card" />
        <Skeleton className="h-64 rounded-card" />
      </div>
    );
  }
  if (compare.isError && !compare.data) {
    if (
      isApiError(compare.error) &&
      (compare.error.status === 404 || compare.error.status === 400)
    ) {
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
    return <ErrorState error={compare.error} onRetry={() => void compare.refetch()} />;
  }

  const { group, meta } = compare.data;
  const stale = compare.isPlaceholderData;

  return (
    <div className="space-y-12">
      <div className="space-y-3">
        <Link to="/groups" className="text-sm text-muted underline underline-offset-4 hover-text">
          Mes groupes
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl">{group.name}</h1>
            <p className="mt-1.5 text-sm text-muted">{group.steamIds.length} joueurs comparés</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div
              role="radiogroup"
              aria-label="Période"
              className="flex rounded-full border border-border bg-surface p-1"
            >
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  role="radio"
                  aria-checked={period === p.value}
                  onClick={() => setPeriod(p.value)}
                  className={cn(
                    "pressable hover-text rounded-full px-3.5 py-1.5 text-sm",
                    period === p.value ? "bg-surface-strong text-text" : "text-muted",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              Modifier
            </Button>
            <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
              Supprimer
            </Button>
          </div>
        </div>
      </div>

      <div
        className={cn("space-y-12 transition-opacity duration-150", stale && "opacity-60")}
        aria-busy={stale}
      >
        {highlights.length > 0 && (
          <section aria-labelledby="titres" className="space-y-4">
            <h2 id="titres" className="text-xl">
              Les titres de la période
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {highlights.map((h) => (
                <li key={h.id}>
                  <Card className="h-full">
                    <p className="text-xs text-subtle">{h.title}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <Avatar
                        name={h.member.displayName}
                        src={h.member.avatarUrl}
                        className="size-10"
                      />
                      <div className="min-w-0">
                        <Link
                          to={`/players/${h.member.steamId}`}
                          className="block truncate font-medium hover:underline"
                        >
                          {h.member.displayName}
                        </Link>
                        <p className="text-sm text-text">{h.value}</p>
                      </div>
                    </div>
                    {h.detail && <p className="mt-2 text-xs text-muted">{h.detail}</p>}
                    {h.matchId && (
                      <Link
                        to={`/matches/${h.matchId}`}
                        className="mt-2 inline-block text-xs text-accent-text underline underline-offset-4"
                      >
                        Voir la partie
                      </Link>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="classement" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="classement" className="text-xl">
              Classement du groupe
            </h2>
            <div role="group" aria-label="Trier par" className="flex flex-wrap gap-1.5">
              {SORTS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  aria-pressed={sort === s.key}
                  onClick={() => setSort(s.key)}
                  className={cn(
                    "pressable hover-text h-8 rounded-full border px-3 text-[13px]",
                    sort === s.key
                      ? "border-border-strong bg-surface-strong text-text"
                      : "border-border text-muted",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <ol className="space-y-2 md:hidden" aria-label="Classement du groupe">
            {sorted.map((m, i) => (
              <li key={m.steamId} className="card flex flex-col gap-3 p-4">
                <div className="flex items-center gap-3">
                  <span className="w-5 text-base font-semibold text-muted tabular-nums">
                    {i + 1}
                  </span>
                  <Avatar name={m.displayName} src={m.avatarUrl} className="size-9 text-xs" />
                  <Link
                    to={`/players/${m.steamId}`}
                    className="min-w-0 flex-1 truncate font-medium hover:underline"
                  >
                    {m.displayName}
                  </Link>
                  <Climb member={m} />
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pl-8 text-xs text-muted">
                  <RankBadge name={m.rank?.name} imageUrl={m.rank?.imageUrl} size="sm" label />
                  <span className="tabular-nums">
                    {m.wins} V / {m.losses} D
                  </span>
                  <span className="tabular-nums">{formatPercent(m.winRate)}</span>
                  <span className="tabular-nums">KDA {formatDecimal(m.kda)}</span>
                </div>
              </li>
            ))}
          </ol>
          <div className="card hidden overflow-x-auto md:block">
            <table className="w-full min-w-[40rem] text-sm">
              <caption className="sr-only">
                Classement des joueurs du groupe, trié par{" "}
                {SORTS.find((s) => s.key === sort)?.label}
              </caption>
              <thead>
                <tr className="border-b border-border text-left text-xs text-subtle">
                  <th scope="col" className="w-12 px-4 py-2.5 font-medium">
                    #
                  </th>
                  <th scope="col" className="px-2 py-2.5 font-medium">
                    Joueur
                  </th>
                  <th scope="col" className="px-2 py-2.5 font-medium">
                    Rang
                  </th>
                  <th scope="col" className="px-2 py-2.5 font-medium">
                    Progression
                  </th>
                  <th scope="col" className="px-2 py-2.5 font-medium">
                    Victoires
                  </th>
                  <th scope="col" className="px-2 py-2.5 font-medium">
                    Taux
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    KDA
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((m, i) => (
                  <tr key={m.steamId} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-base font-semibold tabular-nums text-muted">
                      {i + 1}
                    </td>
                    <th scope="row" className="px-2 py-3 text-left font-normal">
                      <span className="flex items-center gap-3">
                        <Avatar name={m.displayName} src={m.avatarUrl} className="size-9 text-xs" />
                        <Link
                          to={`/players/${m.steamId}`}
                          className="truncate font-medium hover:underline"
                        >
                          {m.displayName}
                        </Link>
                      </span>
                    </th>
                    <td className="px-2 py-3">
                      <RankBadge name={m.rank?.name} imageUrl={m.rank?.imageUrl} size="md" label />
                    </td>
                    <td className="px-2 py-3">
                      <Climb member={m} />
                    </td>
                    <td className="px-2 py-3 text-muted">
                      {m.wins} V / {m.losses} D
                    </td>
                    <td className="px-2 py-3 text-muted">{formatPercent(m.winRate)}</td>
                    <td className="px-4 py-3 text-muted">{formatDecimal(m.kda)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-subtle">
            Progression : sous-rangs gagnés ou perdus sur la période (un rang compte 6 sous-rangs).
          </p>
        </section>

        {series.length > 0 && (
          <section aria-labelledby="courbe" className="space-y-4">
            <h2 id="courbe" className="text-xl">
              Progression de rang
            </h2>
            <Card>
              <MultiLineChart
                series={series}
                title="Progression de rang de chaque joueur du groupe"
                format={(v) => scoreLabel(Math.round(v), ranks.data?.items)}
              />
            </Card>
          </section>
        )}

        <section aria-labelledby="exploits" className="space-y-4">
          <h2 id="exploits" className="text-xl">
            Meilleures parties
          </h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {sortMembers(members, "kda")
              .filter((m) => m.bestMatch)
              .map((m) => (
                <li key={m.steamId}>
                  <Link
                    to={`/matches/${m.bestMatch?.matchId}`}
                    className="pressable card flex items-center gap-4 p-4 hover:border-border-strong"
                  >
                    <HeroPortrait
                      name={m.bestMatch?.heroName ?? ""}
                      src={m.bestMatch?.heroImageUrl}
                      rounded="full"
                      className="size-12"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{m.displayName}</span>
                      <span className="block text-sm text-muted">
                        {m.bestMatch?.heroName} : {m.bestMatch?.kills} / {m.bestMatch?.deaths} /{" "}
                        {m.bestMatch?.assists}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block text-lg font-semibold tracking-[-0.03em]">
                        {formatDecimal(m.bestMatch?.kda)}
                      </span>
                      <span className="block text-xs text-subtle">KDA</span>
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
          <p className="text-xs text-subtle">
            Meilleure partie de la période de chaque joueur, selon le KDA.
          </p>
        </section>

        <DataMetaNotice meta={meta} />
      </div>

      <Dialog
        open={editing}
        onOpenChange={setEditing}
        title="Modifier le groupe"
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
        onOpenChange={setConfirming}
        title="Supprimer ce groupe ?"
        description="Les joueurs restent dans vos suivis. Seul le groupe est supprimé."
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
                onSuccess: () => void navigate("/groups", { replace: true }),
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
