import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { ErrorState } from "@/components/ErrorState";
import { RankBadge } from "@/components/media/RankBadge";
import { Avatar, Button, EmptyState, Skeleton, Tag, buttonStyles, cn } from "@/components/ui";
import { useTrackedInsights } from "@/features/tracked-players/insights";
import { useTrackedList } from "@/features/tracked-players/hooks";
import { formatDate, timeAgo } from "@/lib/format";

const GRID =
  "grid grid-cols-[minmax(220px,2.2fr)_minmax(110px,1fr)_minmax(130px,1fr)_minmax(140px,1.2fr)_96px_16px] items-center gap-4";

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
  const insights = useTrackedInsights(items);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("Tous");

  const tags = useMemo(() => ["Tous", ...new Set(items.flatMap((t) => t.tags))], [items]);
  const needle = q.trim().toLowerCase();
  const shown = insights.filter(
    ({ tracked: t, profile }) =>
      (tag === "Tous" || t.tags.includes(tag)) &&
      (!needle ||
        `${t.alias} ${profile?.player.displayName ?? ""} ${t.note} ${t.steamId}`
          .toLowerCase()
          .includes(needle)),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl sm:text-[34px]">Mes suivis</h1>
          <p className="flex items-center gap-1.5 text-muted">
            <Lock />
            <span className="tabular-nums">{items.length}</span> joueur{items.length > 1 ? "s" : ""}{" "}
            · visibles par vous seul
          </p>
        </div>
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
      </div>

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
            <label className="flex h-9 max-w-[360px] min-w-0 flex-[1_1_260px] items-center gap-2.5 rounded-[10px] bg-white/[0.03] pr-2.5 pl-3 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] transition-shadow duration-150 focus-within:shadow-[inset_0_0_0_1px_rgb(180_171_255/0.6),0_0_0_4px_rgb(91_75_240/0.18)]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
                className="size-[15px] text-subtle"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <span className="sr-only">Filtrer mes suivis</span>
              <input
                type="search"
                placeholder="Filtrer par alias, pseudo ou note"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-subtle focus-visible:outline-none"
              />
            </label>
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

          <section className="card overflow-hidden" aria-label="Liste des joueurs suivis">
            <div className="overflow-x-auto">
              <div className="min-w-[860px]">
                <div
                  className={cn(GRID, "px-[18px] py-2.5 text-xs font-medium text-subtle")}
                  aria-hidden="true"
                >
                  <span>Joueur</span>
                  <span>Rang</span>
                  <span>Forme · 10 parties</span>
                  <span>Tags</span>
                  <span className="text-right">Modifié</span>
                  <span />
                </div>
                {shown.map(({ tracked: t, profile, form, loading }, i) => {
                  const name = profile?.player.displayName ?? t.steamId;
                  const wins = form?.filter((o) => o === "win").length ?? 0;
                  return (
                    <Link
                      key={t.id}
                      to={`/tracked/${t.id}`}
                      className={cn(
                        GRID,
                        "rise border-t border-white/[0.045] px-[18px] py-3.5 hover:bg-white/[0.03]",
                      )}
                      style={{ ["--rise-delay" as string]: `${i * 40}ms` }}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <Avatar
                          name={name}
                          src={profile?.player.avatarUrl}
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
                      <span className="text-xs text-[#c9ccd3]">
                        {profile?.rank.name ? (
                          <RankBadge
                            name={profile.rank.name}
                            imageUrl={profile.rank.imageUrl}
                            size="sm"
                            label
                          />
                        ) : (
                          <span className="text-subtle">{loading ? "…" : "n/d"}</span>
                        )}
                      </span>
                      <span className="flex items-center gap-2">
                        {form && form.length > 0 ? (
                          <>
                            <span
                              role="img"
                              aria-label={`${wins} victoires sur les ${form.length} dernières parties`}
                              className="grid gap-0.5"
                              style={{ gridTemplateColumns: `repeat(${form.length}, 6px)` }}
                            >
                              {form.map((o, k) => (
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
                              {wins}/{form.length}
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
                      <span className="text-right text-xs text-subtle">
                        <time dateTime={t.updatedAt} title={formatDate(t.updatedAt)}>
                          {timeAgo(t.updatedAt)}
                        </time>
                      </span>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                        className="size-4 text-subtle"
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
