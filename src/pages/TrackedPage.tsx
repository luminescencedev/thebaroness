import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { ErrorState } from "@/components/ErrorState";
import { PageHeader } from "@/components/PageHeader";
import { RankBadge } from "@/components/media/RankBadge";
import {
  Avatar,
  Button,
  EmptyState,
  SearchField,
  Skeleton,
  Tag,
  buttonStyles,
  cn,
} from "@/components/ui";
import { useTrackedInsights } from "@/features/tracked-players/insights";
import { useTrackedList } from "@/features/tracked-players/hooks";
import { formatDate, timeAgo } from "@/lib/format";

const GRID =
  "md:grid md:grid-cols-[minmax(220px,2.2fr)_minmax(110px,1fr)_minmax(130px,1fr)_minmax(140px,1.2fr)_96px_16px] md:items-center md:gap-4";

function Lock() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      className="size-[13px]"
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function TrackedPage() {
  useDocumentTitle("Mes suivis");
  const list = useTrackedList();
  const items = useMemo(() => list.data?.items ?? [], [list.data]);
  const { rows: insights, truncated } = useTrackedInsights(items);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("Tous");

  const tags = useMemo(() => ["Tous", ...new Set(items.flatMap((t) => t.tags))], [items]);
  const needle = q.trim().toLowerCase();
  const shown = insights.filter(
    ({ tracked: t, insight }) =>
      (tag === "Tous" || t.tags.includes(tag)) &&
      (!needle ||
        `${t.alias} ${insight?.player?.displayName ?? ""} ${t.note} ${t.steamId}`
          .toLowerCase()
          .includes(needle)),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes suivis"
        description={
          <span className="flex items-center gap-1.5">
            <Lock />
            <span>
              {list.data && (
                <>
                  <span className="tabular-nums">{items.length}</span> joueur
                  {items.length > 1 ? "s" : ""} ·{" "}
                </>
              )}
              visibles par vous seul
            </span>
          </span>
        }
        actions={
          <Link to="/search" className={buttonStyles("primary")}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
              className="size-4"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Suivre un joueur
          </Link>
        }
      />

      {list.isPending ? (
        <div className="space-y-2" aria-busy="true" aria-label="Chargement des suivis">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[68px] rounded-card" />
          ))}
        </div>
      ) : list.isError ? (
        <ErrorState
          error={list.error}
          title="Suivis indisponibles"
          reassure={false}
          onRetry={() => void list.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon="plus"
          title="Vous ne suivez encore personne"
          description="Cherchez un joueur, puis « Suivre » sur son profil."
          action={
            <Link to="/search" className={buttonStyles("primary")}>
              Rechercher un joueur
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2.5">
            <SearchField
              label="Filtrer mes suivis"
              placeholder="Filtrer par alias, pseudo ou note"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="max-w-[360px] flex-[1_1_260px]"
            />
            <div
              role="group"
              aria-label="Filtrer par tag"
              className="inline-flex flex-wrap rounded-[10px] bg-surface p-[3px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]"
            >
              {tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={tag === t}
                  onClick={() => setTag(t)}
                  className={cn(
                    "pressable hover-text h-[30px] rounded-[7px] px-3 text-[13px] font-medium",
                    tag === t
                      ? "bg-white/[0.09] text-text shadow-[0_1px_2px_rgb(0_0_0/0.4)]"
                      : "text-subtle",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <span className="ml-auto text-xs text-subtle" aria-live="polite">
              <span className="tabular-nums">{shown.length}</span> sur {items.length}
            </span>
          </div>

          {truncated && (
            <p className="text-xs text-warning">
              Rang et forme affichés pour les 100 premiers suivis seulement.
            </p>
          )}

          <section className="card overflow-hidden" aria-label="Liste des joueurs suivis">
            <div className="md:overflow-x-auto">
              <div className="md:min-w-[860px]">
                <div
                  className={cn(GRID, "hidden px-[18px] py-2.5 text-xs font-medium text-subtle")}
                  aria-hidden="true"
                >
                  <span>Joueur</span>
                  <span>Rang</span>
                  <span>Forme · 10 parties</span>
                  <span>Tags</span>
                  <span className="text-right">Modifié</span>
                  <span />
                </div>
                {shown.map(({ tracked: t, insight, loading }, i) => {
                  const name = insight?.player?.displayName ?? t.steamId;
                  const form = insight?.form ?? null;
                  const results = form?.results ?? [];
                  return (
                    <Link
                      key={t.id}
                      to={`/tracked/${t.id}`}
                      className={cn(
                        GRID,
                        "rise row-link flex flex-col gap-3 border-t border-white/[0.045] px-4 py-3.5 first:border-t-0 md:px-[18px] md:first:border-t",
                      )}
                      style={{ ["--rise-delay" as string]: `${i * 40}ms` }}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <Avatar
                          name={name}
                          src={insight?.player?.avatarUrl}
                          className="size-9 rounded-[10px]"
                        />
                        <span className="flex min-w-0 flex-col">
                          <span className="flex min-w-0 items-baseline gap-2">
                            <span className="truncate font-medium">{t.alias || name}</span>
                            {t.alias && (
                              <span className="text-xs whitespace-nowrap text-subtle">{name}</span>
                            )}
                          </span>
                          <span
                            className={cn(
                              "truncate text-xs",
                              t.note ? "text-muted" : "text-subtle",
                            )}
                          >
                            {t.note || "Pas encore de note"}
                          </span>
                        </span>
                      </span>
                      <span className="flex flex-wrap items-center gap-x-5 gap-y-2 md:contents">
                        <span className="text-xs text-[#c9ccd3]">
                          {insight?.rank?.name ? (
                            <RankBadge
                              name={insight.rank.name}
                              imageUrl={insight.rank.imageUrl}
                              size="sm"
                              label
                            />
                          ) : (
                            <span className="text-subtle">{loading ? "…" : "n/d"}</span>
                          )}
                        </span>
                        <span className="flex items-center gap-2">
                          {form && form.sampleSize > 0 ? (
                            <>
                              <span
                                role="img"
                                aria-label={`${form.wins} victoires sur les ${form.sampleSize} dernières parties`}
                                className="grid gap-0.5"
                                style={{ gridTemplateColumns: `repeat(${results.length}, 6px)` }}
                              >
                                {results.map((o, k) => (
                                  <span
                                    key={k}
                                    className="h-3.5 rounded-sm"
                                    style={{
                                      background:
                                        o === "win" ? "var(--win)" : "rgb(255 107 111 / 0.75)",
                                    }}
                                  />
                                ))}
                              </span>
                              <span className="text-xs text-muted tabular-nums">
                                {form.wins}/{form.sampleSize}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-subtle">{loading ? "…" : "n/d"}</span>
                          )}
                        </span>
                        <span className="flex flex-wrap gap-1">
                          {t.tags.map((tg) => (
                            <Tag key={tg} className="h-[22px] border-0 bg-accent/15 text-[#c9c2ff]">
                              {tg}
                            </Tag>
                          ))}
                        </span>
                        <span className="text-xs text-subtle md:text-right">
                          <time dateTime={t.updatedAt} title={formatDate(t.updatedAt)}>
                            {timeAgo(t.updatedAt)}
                          </time>
                        </span>
                      </span>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                        className="row-chevron hidden size-4 text-subtle md:block"
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
                  );
                })}
                {shown.length === 0 && (
                  <div className="flex flex-col items-center gap-3 border-t border-white/[0.045] px-6 py-14 text-center">
                    <p className="font-medium">Aucun suivi ne correspond à ces filtres.</p>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setQ("");
                        setTag("Tous");
                      }}
                    >
                      Réinitialiser
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
