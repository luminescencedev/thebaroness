import { Menu } from "@base-ui/react/menu";
import { Link } from "react-router";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { isApiError, type PlayerProfile } from "@/api";
import { RankBadge } from "@/components/media/RankBadge";
import { HeroPortrait } from "@/components/media/HeroPortrait";
import { Avatar, Button, DoubleBezel } from "@/components/ui";
import { useRefreshPlayer } from "@/features/players/hooks";
import { FollowButton } from "@/features/tracked-players/FollowButton";
import { copyText } from "@/lib/clipboard";
import { formatPercent, formatRegion, timeAgo } from "@/lib/format";
import { rankLabel } from "@/lib/rank";
import type { HeroRow } from "@/lib/stats";
import { useNow } from "@/lib/useNow";

const COOLDOWN_S = 60;

const menuItem =
  "flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-sm text-muted outline-none data-[highlighted]:bg-white/[0.07] data-[highlighted]:text-text";

function Dots() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-4">
      <circle cx="5" cy="12" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="19" cy="12" r="1.7" />
    </svg>
  );
}

export function ProfileHeader({
  profile,
  topHeroes,
  heroColor,
}: {
  profile: PlayerProfile;
  topHeroes: HeroRow[];
  heroColor: string | undefined;
}) {
  const { player, rank, meta } = profile;
  const now = useNow();
  const refresh = useRefreshPlayer(player.steamId);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Pause de 60 s après une actualisation : le back renverrait de toute façon la même copie.
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [secondsLeft]);

  const busy = refresh.isPending;
  const onRefresh = () =>
    refresh.mutate(undefined, {
      onSuccess: () => setSecondsLeft(COOLDOWN_S),
      onError: (e) =>
        toast.error(
          isApiError(e) && e.status === 503
            ? "Source indisponible, réessayez plus tard."
            : "Actualisation impossible.",
        ),
    });

  const age = now - new Date(meta.fetchedAt).getTime();
  const old = meta.isStale || age > 24 * 3600_000;
  const label = rankLabel(rank.name, rank.subrank);
  const steamUrl = `https://steamcommunity.com/profiles/${player.steamId}`;

  return (
    <DoubleBezel
      size="lg"
      innerClassName="p-4 sm:p-6"
      style={{ ["--hc" as string]: heroColor ?? "var(--accent)" }}
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-5">
        <div className="flex min-w-0 flex-1 basis-[22rem] items-center gap-4 sm:gap-5">
          <a
            href={steamUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Profil Steam de ${player.displayName} (nouvel onglet)`}
            className="pressable shrink-0 rounded-full p-[3px]"
            style={{
              background: `conic-gradient(from 200deg, ${heroColor ?? "#5B4BF0"}, #b4abff, ${heroColor ?? "#5B4BF0"})`,
            }}
          >
            <Avatar
              name={player.displayName}
              src={player.avatarUrl}
              className="size-16 border-2 border-panel text-xl sm:size-20 sm:text-2xl"
            />
          </a>
          <div className="min-w-0">
            {/* Pseudo et rang groupés : jamais séparés dans un coin du header. */}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h1 className="min-w-0 max-w-full truncate text-3xl sm:text-4xl">
                {player.displayName}
              </h1>
              {label ? (
                <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-text/85 sm:text-base">
                  <RankBadge name={label} imageUrl={rank.imageUrl} size="md" className="gap-0" />
                  {label}
                </span>
              ) : (
                <span className="text-sm text-subtle">Aucun rang classé connu</span>
              )}
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted">
              <button
                type="button"
                onClick={() => void copyText(player.steamId, "SteamID copié")}
                className="mono hover-text pressable inline-flex items-center gap-1.5 rounded-md text-subtle"
                aria-label={`Copier le SteamID ${player.steamId}`}
              >
                {player.steamId}
              </button>
              {player.region && <span>{formatRegion(player.region)}</span>}
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 ${old ? "bg-warning/12 text-warning" : "bg-win/12 text-win"}`}
                aria-live="polite"
              >
                <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
                {old
                  ? `Données anciennes, collectées ${timeAgo(meta.fetchedAt, now)}`
                  : `Collecté ${timeAgo(meta.fetchedAt, now)}`}
              </span>
            </p>
          </div>
        </div>

        {topHeroes.length > 0 && (
          <ul className="flex items-center gap-2" aria-label="Héros les plus joués">
            {topHeroes.slice(0, 3).map((h) => (
              <li key={h.heroId}>
                <Link
                  to={`/players/${player.steamId}?tab=heroes&hero=${h.heroId}`}
                  title={`${h.heroName} : ${h.matches} parties, ${formatPercent(h.winRate)} de victoires`}
                  aria-label={`${h.heroName} : ${h.matches} parties, ${formatPercent(h.winRate)} de victoires. Voir dans l'onglet Héros`}
                  className="pressable group flex flex-col items-center gap-1"
                >
                  <HeroPortrait
                    name={h.heroName}
                    src={h.heroImageUrl}
                    rounded="xl"
                    className="size-12 ring-1 ring-white/10"
                  />
                  <span className="text-[11px] text-muted tabular-nums">
                    {h.winRate === null ? "n/d" : `${Math.round(h.winRate)} %`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {/* Sur mobile, « Suivre » est dans la barre d'action fixe en bas de l'écran. */}
          <div className="hidden sm:block">
            <FollowButton steamId={player.steamId} name={player.displayName} />
          </div>
          <Button
            variant="secondary"
            onClick={onRefresh}
            loading={busy}
            disabled={secondsLeft > 0 && !busy}
            title="Relit le profil et l'historique auprès de la source"
          >
            {busy ? "Actualisation" : secondsLeft > 0 ? `Patientez ${secondsLeft} s` : "Actualiser"}
          </Button>
          <Menu.Root>
            <Menu.Trigger
              aria-label="Autres actions"
              className="pressable grid size-10 place-items-center rounded-[10px] border border-border-strong bg-surface text-muted hover-text"
            >
              <Dots />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner sideOffset={8} align="end" className="z-50">
                <Menu.Popup className="surface-solid w-56 p-1.5 outline-none">
                  <Menu.Item
                    className={menuItem}
                    onClick={() => void copyText(window.location.href, "Lien copié")}
                  >
                    Partager le lien
                  </Menu.Item>
                  <Menu.Item
                    className={menuItem}
                    onClick={() => void copyText(player.steamId, "SteamID copié")}
                  >
                    Copier le SteamID
                  </Menu.Item>
                  <Menu.Item
                    className={menuItem}
                    render={<a href={steamUrl} target="_blank" rel="noreferrer" />}
                  >
                    Voir sur Steam
                  </Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </div>
      </div>
    </DoubleBezel>
  );
}
