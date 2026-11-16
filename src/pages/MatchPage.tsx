import { Link, useParams } from "react-router";
import { isApiError, type MatchPlayer, type MatchTeam } from "@/api";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { BrandLoader } from "@/components/brand";
import { ChartFrame } from "@/components/charts";
import { DataMetaNotice } from "@/components/DataMetaNotice";
import { ErrorState } from "@/components/ErrorState";
import { HeroPortrait } from "@/components/media/HeroPortrait";
import { EmptyState, buttonStyles, cn } from "@/components/ui";
import { useHeroes } from "@/features/heroes/hooks";
import { useMatch } from "@/features/leaderboard/hooks";
import { NA, formatDateTime, formatDuration, formatInt } from "@/lib/format";
import { kda } from "@/lib/stats";

const TEAMS = {
  amber: { name: "Amber Hand", color: "#F5B14C" },
  sapphire: { name: "Sapphire Flame", color: "#5B9DFF" },
} as const;

const sum = (
  players: MatchPlayer[],
  key: "kills" | "deaths" | "assists" | "netWorth" | "lastHits" | "denies",
) => players.reduce((s, p) => s + (p[key] ?? 0), 0);

function Compare({ teams }: { teams: MatchTeam[] }) {
  const rows: { label: string; key: "netWorth" | "kills" | "lastHits" | "denies" }[] = [
    { label: "Valeur nette", key: "netWorth" },
    { label: "Éliminations", key: "kills" },
    { label: "Derniers coups", key: "lastHits" },
    { label: "Dénis", key: "denies" },
  ];
  const a = teams.find((t) => t.side === "amber");
  const b = teams.find((t) => t.side === "sapphire");
  if (!a || !b) return null;
  return (
    <ul className="space-y-4">
      {rows.map((r) => {
        const va = sum(a.players, r.key);
        const vb = sum(b.players, r.key);
        const total = va + vb || 1;
        return (
          <li key={r.key}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-semibold tabular-nums" style={{ color: TEAMS.amber.color }}>
                {formatInt(va)}
              </span>
              <span className="text-muted">{r.label}</span>
              <span className="font-semibold tabular-nums" style={{ color: TEAMS.sapphire.color }}>
                {formatInt(vb)}
              </span>
            </div>
            <div
              className="flex h-2 gap-0.5 overflow-hidden rounded-full"
              role="img"
              aria-label={`${r.label} : Amber Hand ${va}, Sapphire Flame ${vb}`}
            >
              <span style={{ width: `${(va / total) * 100}%`, background: TEAMS.amber.color }} />
              <span style={{ width: `${(vb / total) * 100}%`, background: TEAMS.sapphire.color }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function TeamTable({
  team,
  mvp,
  colors,
}: {
  team: MatchTeam;
  mvp: MatchPlayer | undefined;
  colors: Map<number, string>;
}) {
  const meta = TEAMS[team.side];
  const win = team.outcome === "win";
  const maxWorth = Math.max(...team.players.map((p) => p.netWorth ?? 0), 1);
  return (
    <section
      aria-label={meta.name}
      className="card-hero overflow-x-auto"
      style={{ ["--hc" as string]: meta.color }}
    >
      <h2 className="flex items-center gap-3 px-5 pt-5 pb-3 text-xl">
        <span
          aria-hidden="true"
          className="size-2.5 rounded-full"
          style={{ background: meta.color }}
        />
        {meta.name}
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
            win ? "bg-win/15 text-win" : "bg-loss/15 text-loss",
          )}
        >
          {win ? "Victoire" : "Défaite"}
        </span>
      </h2>
      <table className="w-full min-w-[34rem] text-sm">
        <caption className="sr-only">Joueurs de la {meta.name}</caption>
        <thead>
          <tr className="text-left text-xs text-subtle">
            <th scope="col" className="px-5 py-2 font-medium">
              Joueur
            </th>
            <th scope="col" className="px-2 py-2 font-medium">
              Niv.
            </th>
            <th scope="col" className="px-2 py-2 font-medium">
              É / M / A
            </th>
            <th scope="col" className="px-2 py-2 font-medium">
              Valeur nette
            </th>
            <th scope="col" className="px-2 py-2 font-medium">
              Derniers coups
            </th>
            <th scope="col" className="px-5 py-2 font-medium">
              Dénis
            </th>
          </tr>
        </thead>
        <tbody>
          {team.players.map((p, i) => (
            <tr key={`${p.displayName}-${i}`} className="border-t border-white/[0.06]">
              <th scope="row" className="px-5 py-2.5 text-left font-normal">
                <span className="flex items-center gap-3">
                  <HeroPortrait
                    name={p.heroName}
                    src={p.heroImageUrl}
                    color={colors.get(p.heroId)}
                    rounded="full"
                    className="size-9"
                  />
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      {p.steamId ? (
                        <Link
                          to={`/players/${p.steamId}`}
                          className="truncate font-medium hover:underline"
                        >
                          {p.displayName}
                        </Link>
                      ) : (
                        <span className="truncate font-medium">{p.displayName}</span>
                      )}
                      {mvp === p && (
                        <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning">
                          MVP
                        </span>
                      )}
                    </span>
                    <span
                      className="block text-xs"
                      style={{ color: colors.get(p.heroId) ?? "var(--subtle)" }}
                    >
                      {p.heroName}
                    </span>
                  </span>
                </span>
              </th>
              <td className="px-2 py-2.5 text-muted tabular-nums">{formatInt(p.level)}</td>
              <td className="px-2 py-2.5 text-muted tabular-nums">
                {p.kills === null || p.deaths === null || p.assists === null
                  ? NA
                  : `${p.kills} / ${p.deaths} / ${p.assists}`}
              </td>
              <td className="px-2 py-2.5">
                <div className="flex min-w-[110px] flex-col gap-1">
                  <span className="text-muted tabular-nums">{formatInt(p.netWorth)}</span>
                  <span
                    className="h-1 overflow-hidden rounded-full bg-white/[0.06]"
                    aria-hidden="true"
                  >
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${((p.netWorth ?? 0) / maxWorth) * 100}%`,
                        background: meta.color,
                      }}
                    />
                  </span>
                </div>
              </td>
              <td className="px-2 py-2.5 text-muted tabular-nums">{formatInt(p.lastHits)}</td>
              <td className="px-5 py-2.5 text-muted tabular-nums">{formatInt(p.denies)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function MatchPage() {
  const { matchId = "" } = useParams();
  const query = useMatch(matchId);
  const heroes = useHeroes();
  useDocumentTitle(`Partie ${matchId}`);

  if (query.isPending) return <BrandLoader message="Le Doorman descend chercher la partie" />;
  if (query.isError) {
    if (isApiError(query.error) && (query.error.status === 404 || query.error.status === 400)) {
      return (
        <EmptyState
          icon="search"
          title="Partie introuvable"
          description="Cette partie n'est pas disponible."
          action={
            <Link to="/search" className={buttonStyles("secondary")}>
              Rechercher un joueur
            </Link>
          }
        />
      );
    }
    return (
      <ErrorState
        error={query.error}
        title="Partie indisponible"
        onRetry={() => void query.refetch()}
      />
    );
  }

  const { match, meta } = query.data;
  const colors = new Map((heroes.data?.items ?? []).map((h) => [h.id, h.color]));
  const all = match.teams.flatMap((t) => t.players);
  const mvp = [...all].sort(
    (a, b) => (kda(b.kills, b.deaths, b.assists) ?? -1) - (kda(a.kills, a.deaths, a.assists) ?? -1),
  )[0];
  const winner = match.winningSide ? TEAMS[match.winningSide] : null;
  const topWorth = [...all].sort((a, b) => (b.netWorth ?? 0) - (a.netWorth ?? 0))[0];

  return (
    <div className="space-y-6">
      <header
        className="card-hero p-6 sm:p-8"
        style={{ ["--hc" as string]: winner?.color ?? "var(--accent)" }}
      >
        <p className="mono text-xs text-subtle">Partie {match.matchId}</p>
        <h1 className="mt-2 text-4xl sm:text-5xl" style={{ color: winner?.color }}>
          {winner ? `Victoire de la ${winner.name}` : "Vainqueur inconnu"}
        </h1>
        <dl className="mt-5 flex flex-wrap gap-x-10 gap-y-3 text-sm">
          <div>
            <dt className="text-xs text-subtle">Date</dt>
            <dd className="mt-0.5 text-text">
              {match.playedAt ? formatDateTime(match.playedAt) : NA}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-subtle">Durée</dt>
            <dd className="mt-0.5 text-text tabular-nums">
              {formatDuration(match.durationSeconds)}
            </dd>
          </div>
          {mvp && (
            <div>
              <dt className="text-xs text-subtle">MVP (meilleur KDA)</dt>
              <dd className="mt-0.5 text-text">
                {mvp.displayName} · {mvp.heroName}
              </dd>
            </div>
          )}
          {topWorth && (
            <div>
              <dt className="text-xs text-subtle">Plus riche</dt>
              <dd className="mt-0.5 text-text">
                {topWorth.displayName} ·{" "}
                <span className="tabular-nums">{formatInt(topWorth.netWorth)}</span>
              </dd>
            </div>
          )}
        </dl>
      </header>

      <ChartFrame
        id={`match-compare-${match.matchId}`}
        title="Comparaison des équipes"
        subtitle="Amber Hand (ambre) contre Sapphire Flame (saphir)"
        summary="Valeur nette, éliminations, derniers coups et dénis de chaque équipe."
        points={5}
      >
        <Compare teams={match.teams} />
      </ChartFrame>

      <div className="grid gap-4 xl:grid-cols-2">
        {match.teams.map((t) => (
          <TeamTable
            key={t.side}
            team={t}
            mvp={t.players.includes(mvp as MatchPlayer) ? mvp : undefined}
            colors={colors}
          />
        ))}
      </div>
      <DataMetaNotice meta={meta} />
    </div>
  );
}
