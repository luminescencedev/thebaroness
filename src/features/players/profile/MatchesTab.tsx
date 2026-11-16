import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Menu } from "@base-ui/react/menu";
import { toast } from "sonner";
import type { HeroSummary, MatchSummary } from "@/api";
import { HeroPortrait } from "@/components/media/HeroPortrait";
import { Button, EmptyState, Segmented, cn } from "@/components/ui";
import { copyText } from "@/lib/clipboard";
import { NA, formatDate, formatDecimal, formatDuration, formatInt } from "@/lib/format";
import { matchKda, netPerMinute } from "@/lib/stats";

type Result = "all" | "win" | "loss";

const item =
  "flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-sm text-muted outline-none data-[highlighted]:bg-white/[0.07] data-[highlighted]:text-text";

function KdaBar({ m }: { m: MatchSummary }) {
  if (m.kills === null || m.deaths === null || m.assists === null)
    return <span className="text-subtle">{NA}</span>;
  const total = m.kills + m.deaths + m.assists || 1;
  return (
    <div className="flex min-w-[130px] flex-col gap-1">
      <span className="tabular-nums">
        {m.kills} / {m.deaths} / {m.assists}
      </span>
      <span className="flex h-1 gap-px overflow-hidden rounded-full" aria-hidden="true">
        <span style={{ width: `${(m.kills / total) * 100}%`, background: "var(--k)" }} />
        <span style={{ width: `${(m.deaths / total) * 100}%`, background: "var(--d)" }} />
        <span style={{ width: `${(m.assists / total) * 100}%`, background: "var(--a)" }} />
      </span>
    </div>
  );
}

export function MatchesTab({
  matches,
  heroById,
  capped,
  hasMore,
  loading,
  onMore,
  following,
}: {
  matches: MatchSummary[];
  heroById: Map<number, HeroSummary>;
  capped: boolean;
  hasMore: boolean;
  loading: boolean;
  onMore: () => void;
  following?: boolean;
}) {
  void following;
  const navigate = useNavigate();
  const [result, setResult] = useState<Result>("all");
  const [hero, setHero] = useState<number | null>(null);

  const heroCounts = useMemo(() => {
    const map = new Map<number, { id: number; name: string; n: number }>();
    for (const m of matches) {
      const cur = map.get(m.heroId) ?? { id: m.heroId, name: m.heroName, n: 0 };
      cur.n += 1;
      map.set(m.heroId, cur);
    }
    return [...map.values()].sort((a, b) => b.n - a.n);
  }, [matches]);

  const filtered = matches.filter(
    (m) => (result === "all" || m.outcome === result) && (hero === null || m.heroId === hero),
  );
  const [visible, setVisible] = useState(30);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented<Result>
          ariaLabel="Filtrer par résultat"
          value={result}
          onChange={setResult}
          options={[
            { value: "all", label: "Toutes" },
            { value: "win", label: "Victoires" },
            { value: "loss", label: "Défaites" },
          ]}
        />
        <div
          role="group"
          aria-label="Filtrer par héros"
          className="flex flex-wrap items-center gap-1.5"
        >
          {heroCounts.slice(0, 3).map((h) => (
            <button
              key={h.id}
              type="button"
              aria-pressed={hero === h.id}
              onClick={() => setHero(hero === h.id ? null : h.id)}
              className={cn(
                "pressable hover-text inline-flex h-9 items-center gap-2 rounded-full border pr-3 pl-1 text-[13px]",
                hero === h.id
                  ? "border-border-strong bg-white/[0.09] text-text"
                  : "border-border text-muted",
              )}
            >
              <HeroPortrait
                name={h.name}
                src={heroById.get(h.id)?.images.small}
                rounded="full"
                className="size-7"
              />
              {h.name}
              <span className="text-xs text-subtle tabular-nums">{h.n}</span>
            </button>
          ))}
          <label className="sr-only" htmlFor="hero-select">
            Choisir un héros
          </label>
          <select
            id="hero-select"
            value={hero ?? ""}
            onChange={(e) => setHero(e.target.value ? Number(e.target.value) : null)}
            className="h-9 rounded-full border border-border bg-surface px-3 text-[13px] text-muted"
          >
            <option value="">Tous les héros</option>
            {heroCounts.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.n})
              </option>
            ))}
          </select>
        </div>
        <span className="ml-auto text-xs text-subtle tabular-nums" aria-live="polite">
          {filtered.length} sur {matches.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Aucune partie ne correspond"
          description="Aucune partie disponible avec ces filtres."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setResult("all");
                setHero(null);
              }}
            >
              Réinitialiser
            </Button>
          }
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[52rem] border-collapse text-sm">
            <caption className="sr-only">Parties disponibles du joueur</caption>
            <thead>
              <tr className="text-left text-xs text-subtle">
                {[
                  "Résultat",
                  "Héros",
                  "K / D / A",
                  "Ratio",
                  "Valeur nette",
                  "Par minute",
                  "Durée",
                  "Date",
                  "",
                ].map((h, i) => (
                  <th
                    key={i}
                    scope="col"
                    className="border-b border-border px-4 py-2.5 font-medium whitespace-nowrap"
                  >
                    {h || <span className="sr-only">Actions</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, visible).map((m) => (
                <tr
                  key={m.matchId}
                  className="group border-b border-white/[0.045] last:border-0 hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span
                      className="flex items-center gap-2"
                      style={{ color: m.outcome === "win" ? "var(--win)" : "var(--loss)" }}
                    >
                      <span className="size-[7px] rounded-full bg-current" aria-hidden="true" />
                      {m.outcome === "win" ? "Victoire" : "Défaite"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <Link
                      to={`/heroes/${m.heroId}`}
                      className="flex items-center gap-2.5 font-medium hover:underline"
                    >
                      <HeroPortrait
                        name={m.heroName}
                        src={m.heroImageUrl}
                        color={heroById.get(m.heroId)?.color}
                        rounded="lg"
                        className="size-7"
                      />
                      {m.heroName}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-muted">
                    <KdaBar m={m} />
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-muted tabular-nums">
                    {formatDecimal(matchKda(m))}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-muted tabular-nums">
                    {formatInt(m.netWorth)}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-muted tabular-nums">
                    {formatInt(netPerMinute(m))}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-muted tabular-nums">
                    {formatDuration(m.durationSeconds)}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-subtle">
                    <time dateTime={m.playedAt}>{formatDate(m.playedAt)}</time>
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <Menu.Root>
                      <Menu.Trigger
                        aria-label={`Actions pour la partie ${m.matchId}`}
                        className="pressable hover-text grid size-8 place-items-center rounded-md text-subtle"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                          className="size-4"
                        >
                          <circle cx="5" cy="12" r="1.6" />
                          <circle cx="12" cy="12" r="1.6" />
                          <circle cx="19" cy="12" r="1.6" />
                        </svg>
                      </Menu.Trigger>
                      <Menu.Portal>
                        <Menu.Positioner sideOffset={6} align="end" className="z-50">
                          <Menu.Popup className="menu-popup surface-solid w-56 p-1.5 outline-none">
                            <Menu.Item
                              className={item}
                              onClick={() => void navigate(`/matches/${m.matchId}`)}
                            >
                              Ouvrir la partie
                            </Menu.Item>
                            <Menu.Item
                              className={item}
                              onClick={() => void navigate(`/heroes/${m.heroId}`)}
                            >
                              Voir {m.heroName}
                            </Menu.Item>
                            <Menu.Item
                              className={item}
                              onClick={() => void copyText(m.matchId, "Identifiant copié")}
                            >
                              Copier l&apos;identifiant
                            </Menu.Item>
                            <Menu.Item
                              className={item}
                              onClick={() => {
                                void copyText(
                                  `${window.location.origin}/matches/${m.matchId}`,
                                  "Lien copié",
                                );
                                toast.dismiss();
                              }}
                            >
                              Copier le lien
                            </Menu.Item>
                          </Menu.Popup>
                        </Menu.Positioner>
                      </Menu.Portal>
                    </Menu.Root>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col items-center gap-2">
        {filtered.length > visible && (
          <Button variant="secondary" onClick={() => setVisible((v) => v + 30)}>
            Afficher 30 de plus
          </Button>
        )}
        {capped && hasMore && (
          <Button variant="secondary" loading={loading} onClick={onMore}>
            Charger plus
          </Button>
        )}
      </div>
    </div>
  );
}
