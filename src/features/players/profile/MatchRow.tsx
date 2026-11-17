import { useState } from "react";
import { Link } from "react-router";
import type { HeroSummary, MatchSummary } from "@/api";
import { HeroPortrait } from "@/components/media/HeroPortrait";
import { Skeleton, cn } from "@/components/ui";
import { copyText } from "@/lib/clipboard";
import {
  NA,
  formatDate,
  formatDecimal,
  formatDuration,
  formatInt,
  formatPercent,
  timeAgo,
} from "@/lib/format";
import type { MatchEnrichment } from "@/lib/matchModel";
import { modePill } from "@/lib/modes";
import { IS_MOCK } from "@/lib/runtime";
import { matchKda, netPerMinute } from "@/lib/stats";
import { BuildGrid, ItemIcon } from "./MatchBuild";
import { TeamsPreview, TeamsTable } from "./MatchTeams";
import { useMatchEnrichment, useNearViewport, useWideScreen } from "./useMatchEnrichment";

const PILL: Record<"ranked" | "normal" | "special", string> = {
  ranked: "bg-accent/18 text-accent-text",
  normal: "bg-white/[0.06] text-muted",
  special: "bg-warning/14 text-warning",
};

/**
 * Colonnes par palier de largeur du conteneur (la ligne, pas la fenêtre) :
 * < 600 mobile ; 600 tablette ; 760 + build ; 880 + équipes en portraits ; 1000 + équipes avec pseudos.
 */
const GRID = [
  "grid-cols-[1fr_auto]",
  "@[600px]:grid-cols-[96px_minmax(0,1.3fr)_92px_minmax(0,1fr)_36px]",
  "@[760px]:grid-cols-[96px_minmax(0,1.2fr)_92px_minmax(0,140px)_171px_36px]",
  "@[880px]:grid-cols-[96px_minmax(0,1.2fr)_92px_minmax(0,140px)_171px_147px_36px]",
  "@[1000px]:grid-cols-[96px_minmax(0,1.2fr)_92px_minmax(0,140px)_171px_minmax(200px,1.3fr)_36px]",
].join(" ");

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn(
        "size-4 transition-transform duration-200 motion-reduce:transition-none",
        open && "rotate-180",
      )}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-subtle">{label}</dt>
    <dd className="mt-0.5 text-sm tabular-nums">{value}</dd>
  </div>
);

type Detail = {
  data: MatchEnrichment | null;
  isPending: boolean;
  isError: boolean;
  refetch: () => unknown;
};

function ExpandedPanel({ match: m, detail }: { match: MatchSummary; detail: Detail }) {
  const en = detail.data;
  const k = matchKda(m);
  const npm = netPerMinute(m);
  return (
    <div className="@container space-y-4 border-t border-divider bg-white/[0.02] px-4 py-4">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs @md:grid-cols-4 @3xl:grid-cols-8">
        <Stat label="KDA" value={formatDecimal(k)} />
        <Stat label="Valeur nette" value={formatInt(m.netWorth)} />
        <Stat label="Par minute" value={formatInt(npm)} />
        <Stat label="Durée" value={formatDuration(m.durationSeconds)} />
        <Stat
          label="Derniers coups"
          value={
            en?.cs == null
              ? NA
              : `${formatInt(en.cs)}${en.csPerMin === null ? "" : ` (${formatDecimal(en.csPerMin)} / min)`}`
          }
        />
        <Stat label="Participation (KP)" value={en ? formatPercent(en.kp) : NA} />
        <Stat label="Tirs à la tête" value={en ? formatPercent(en.hsPct) : NA} />
        <Stat
          label="Position (valeur nette)"
          value={en?.netPosition ? `${en.netPosition.rank} sur ${en.netPosition.of}` : NA}
        />
      </dl>

      {detail.isPending && <Skeleton className="h-28 rounded-xl" />}
      {detail.isError && (
        <p className="text-xs text-subtle">
          Détail de la partie indisponible pour le moment.{" "}
          <button
            type="button"
            onClick={() => void detail.refetch()}
            className="text-accent-text underline-offset-4 hover:underline"
          >
            Réessayer
          </button>
        </p>
      )}

      {en && (
        <>
          {en.badges.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Distinctions">
              {en.badges.map((b) => (
                <li
                  key={b.id}
                  title={b.explain}
                  className="rounded-full bg-warning/14 px-2.5 py-0.5 text-[11px] font-medium text-warning"
                >
                  {b.label}
                </li>
              ))}
            </ul>
          )}
          <section aria-label="Build complet">
            <h4 className="mb-1.5 text-xs font-medium text-muted">
              Build
              {IS_MOCK && (
                <span className="ml-2 font-normal text-subtle">
                  exemple synthétique du mode démo
                </span>
              )}
            </h4>
            {en.items ? (
              <ul className="flex flex-wrap gap-1.5">
                {en.items.map((it, i) => (
                  <li
                    key={`${it.itemId}-${i}`}
                    className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] py-0.5 pr-2 pl-0.5 text-xs text-muted"
                  >
                    <ItemIcon item={it} size={24} />
                    {it.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-subtle">
                Objets non fournis par la source pour cette partie ({NA}).
              </p>
            )}
          </section>
          <TeamsTable teams={en.teams} />
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-subtle">
        <button
          type="button"
          onClick={() => void copyText(m.matchId, "Identifiant de partie copié")}
          className="mono hover-text pressable rounded-md"
          aria-label={`Copier l'identifiant de partie ${m.matchId}`}
        >
          Partie {m.matchId}
        </button>
        <Link
          to={`/matches/${m.matchId}`}
          className="text-sm font-medium text-accent-text underline-offset-4 hover:underline"
        >
          Ouvrir la partie
        </Link>
      </div>
    </div>
  );
}

/**
 * Ligne de partie à deux niveaux. Niveau 1 : résultat, héros, KDA, économie, CS / KP / HS, build et équipes
 * selon la largeur de la ligne. Niveau 2 (chevron) : tout le détail. Le lien « Ouvrir la partie » est séparé
 * du chevron : jamais toute la ligne cliquable.
 */
export function MatchRow({
  match: m,
  heroById,
  ownerSteamId,
}: {
  match: MatchSummary;
  heroById: Map<number, HeroSummary>;
  ownerSteamId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);
  const [ref, near] = useNearViewport<HTMLLIElement>();
  const wide = useWideScreen();
  // Un détail par ligne, seulement si la ligne est proche de l'écran (ou ouverte) : pas de rafale de requêtes.
  const detail = useMatchEnrichment(m, ownerSteamId, (near && wide) || everOpened);

  const win = m.outcome === "win";
  const pill = modePill(m);
  const k = matchKda(m);
  const npm = netPerMinute(m);
  const color = heroById.get(m.heroId)?.color;
  const panelId = `match-${m.matchId}`;
  const en = detail.data;
  const loading = !en && !detail.isError;
  const resultColor = win ? "var(--win)" : "var(--loss)";
  const toggle = () => {
    setOpen((v) => !v);
    setEverOpened(true);
  };

  const cell = (value: string | null, suffix = "") => (value === null ? NA : `${value}${suffix}`);

  return (
    <li ref={ref} className="@container border-t border-divider first:border-t-0">
      <div
        className={cn(
          "group relative grid min-h-[76px] items-center gap-x-3 gap-y-1 py-1.5 pr-1 pl-4 @[600px]:min-h-[68px]",
          GRID,
        )}
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-2.5 left-0 w-[3px] rounded-full"
          style={{ background: resultColor }}
        />

        <div className="hidden text-[11px] text-subtle tabular-nums @[600px]:block">
          <p className="text-sm font-semibold" style={{ color: resultColor }}>
            {win ? "Victoire" : "Défaite"}
          </p>
          <p>
            <time dateTime={m.playedAt} title={formatDate(m.playedAt)}>
              {timeAgo(m.playedAt)}
            </time>
          </p>
          <p>{formatDuration(m.durationSeconds)}</p>
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <HeroPortrait
            name={m.heroName}
            src={m.heroImageUrl}
            color={color}
            rounded="xl"
            className="size-11 ring-1 ring-white/10"
          />
          <div className="min-w-0">
            <p className="flex items-center gap-2 truncate text-[15px] leading-tight font-semibold">
              <span className="truncate">{m.heroName}</span>
              <span
                className="text-xs font-semibold @[600px]:hidden"
                style={{ color: resultColor }}
              >
                {win ? "Victoire" : "Défaite"}
              </span>
            </p>
            <p className="mt-1 flex flex-nowrap items-center gap-x-2 overflow-hidden text-xs whitespace-nowrap text-subtle">
              {pill && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-medium",
                    PILL[pill.tone],
                  )}
                >
                  {pill.label}
                </span>
              )}
              <span className="@[600px]:hidden">
                <time dateTime={m.playedAt}>{formatDate(m.playedAt)}</time>
              </span>
            </p>
          </div>
        </div>

        <div className="hidden @[600px]:block">
          <p className="text-sm font-semibold tabular-nums">
            {m.kills ?? NA} / {m.deaths ?? NA} / {m.assists ?? NA}
          </p>
          <p className="text-xs text-subtle tabular-nums">{formatDecimal(k)} KDA</p>
        </div>

        <dl className="hidden min-w-0 text-[11.5px] leading-[15px] text-subtle tabular-nums @[600px]:block">
          <div className="flex gap-1.5">
            <dt className="sr-only">Valeur nette</dt>
            <dd className="text-[13px] text-text">{formatInt(m.netWorth)}</dd>
            <dd>{formatInt(npm)} / min</dd>
          </div>
          {loading ? (
            <div aria-hidden="true" className="mt-1 space-y-1">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
          ) : (
            <>
              <div className="flex gap-1.5">
                <dt>CS</dt>
                <dd>
                  {cell(en?.cs == null ? null : formatInt(en.cs))}
                  {en?.csPerMin != null &&
                    ` (${formatDecimal(en.csPerMin).replace(",00", "")}/min)`}
                </dd>
              </div>
              <div className="flex gap-2.5">
                <div className="flex gap-1">
                  <dt>KP</dt>
                  <dd>{en?.kp == null ? NA : `${Math.round(en.kp)} %`}</dd>
                </div>
                <div className="flex gap-1">
                  <dt>HS</dt>
                  <dd>
                    {en?.hsPct == null ? NA : `${formatDecimal(en.hsPct).replace(",00", "")} %`}
                  </dd>
                </div>
              </div>
            </>
          )}
        </dl>

        <div className="hidden @[760px]:block">
          {loading ? (
            <Skeleton className="h-[55px] w-[171px] rounded-md" />
          ) : (
            <BuildGrid items={en?.items ?? null} />
          )}
        </div>

        <div className="hidden @[880px]:block @[1000px]:hidden">
          {loading ? (
            <Skeleton className="h-[47px] w-[147px] rounded-md" />
          ) : en ? (
            <TeamsPreview teams={en.teams} variant="portraits" />
          ) : (
            <span className="text-xs text-subtle">Équipes {NA}</span>
          )}
        </div>
        <div className="hidden min-w-0 @[1000px]:block">
          {loading ? (
            <Skeleton className="h-[78px] w-full rounded-md" />
          ) : en ? (
            <TeamsPreview teams={en.teams} variant="names" />
          ) : (
            <span className="text-xs text-subtle">Équipes {NA}</span>
          )}
        </div>

        <div className="flex items-center gap-1 justify-self-end">
          <span className="mr-1 text-right text-sm font-semibold tabular-nums @[600px]:hidden">
            {m.kills ?? NA}/{m.deaths ?? NA}/{m.assists ?? NA}
            <span className="block text-[11px] font-normal text-subtle">
              KDA {formatDecimal(k)}
            </span>
          </span>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={`${open ? "Masquer" : "Afficher"} le détail de la partie avec ${m.heroName}`}
            onClick={toggle}
            className="pressable hover-text grid size-11 place-items-center rounded-lg text-subtle @[600px]:size-9"
          >
            <Chevron open={open} />
          </button>
        </div>
      </div>

      <div
        id={panelId}
        inert={!open}
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-[var(--ease-in-out)] motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          {everOpened && <ExpandedPanel match={m} detail={detail} />}
        </div>
      </div>
    </li>
  );
}
