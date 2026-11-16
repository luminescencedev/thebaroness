import { toast } from "sonner";
import { useEffect, useState } from "react";
import { isApiError, type PlayerProfile } from "@/api";
import { Avatar, Button } from "@/components/ui";
import { RankBadge } from "@/components/media/RankBadge";
import { FollowButton } from "@/features/tracked-players/FollowButton";
import { copyText } from "@/lib/clipboard";
import { formatRegion, timeAgo } from "@/lib/format";
import { useNow } from "@/lib/useNow";
import { useRefreshPlayer } from "@/features/players/hooks";

const COOLDOWN_MS = 60_000;

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-3.5 shrink-0"
    >
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </svg>
  );
}

export function ProfileBanner({
  profile,
  heroColor,
}: {
  profile: PlayerProfile;
  /** Couleur d'accent du héros le plus joué : colore la bannière. */
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
  const justDone = !busy && secondsLeft > 0 && refresh.isSuccess;

  const onRefresh = () =>
    refresh.mutate(undefined, {
      onSuccess: () => setSecondsLeft(COOLDOWN_MS / 1000),
      onError: (e) =>
        toast.error(
          isApiError(e) && e.status === 503
            ? "Source indisponible, réessayez plus tard."
            : "Actualisation impossible.",
        ),
    });

  const age = now - new Date(meta.fetchedAt).getTime();
  const old = meta.isStale || age > 24 * 3600_000;

  return (
    <header
      className="card-hero p-5 sm:p-7"
      style={{ ["--hc" as string]: heroColor ?? "var(--accent)" }}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-4 sm:gap-5">
        <span
          className="rounded-full p-[3px]"
          style={{
            background: `conic-gradient(from 200deg, ${heroColor ?? "#5B4BF0"}, #B4ABFF, ${heroColor ?? "#5B4BF0"})`,
          }}
        >
          <Avatar
            name={player.displayName}
            src={player.avatarUrl}
            className="size-14 border-2 border-bg text-xl min-[400px]:size-[72px] min-[400px]:text-2xl sm:size-20"
          />
        </span>
        <div className="min-w-0 flex-1 sm:basis-[17rem]">
          <h1 className="truncate text-3xl min-[400px]:text-4xl sm:text-[44px]">
            {player.displayName}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted">
            <button
              type="button"
              onClick={() => void copyText(player.steamId, "SteamID copié")}
              className="mono hover-text pressable inline-flex max-w-full items-center gap-1.5 rounded-md text-left text-[11px] whitespace-nowrap text-subtle min-[400px]:text-xs"
              aria-label={`Copier le SteamID ${player.steamId}`}
            >
              {player.steamId}
              <CopyIcon />
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

        <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2 [&>*]:max-w-full [&>*]:whitespace-normal">
          <Button
            variant="secondary"
            onClick={onRefresh}
            loading={busy}
            disabled={secondsLeft > 0 && !busy}
            title="Relit le profil et l'historique auprès de la source"
          >
            {busy
              ? "Actualisation"
              : justDone
                ? `Actualisé (${secondsLeft} s)`
                : secondsLeft > 0
                  ? `Patientez ${secondsLeft} s`
                  : "Actualiser"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => void copyText(window.location.href, "Lien copié")}
          >
            Partager
          </Button>
          <FollowButton steamId={player.steamId} name={player.displayName} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-white/[0.07] pt-5">
        {rank.name ? (
          <>
            <RankBadge name={rank.name} imageUrl={rank.imageUrl} color={rank.color} size="lg" />
            <div>
              <p className="text-xs text-subtle">Rang classé</p>
              <p className="text-xl font-semibold tracking-[-0.03em]">{rank.name}</p>
            </div>
            {rank.subrank != null && (
              <ol
                className="ml-auto flex items-center gap-1.5"
                aria-label={`Sous-rang ${rank.subrank} sur 6`}
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <li
                    key={n}
                    aria-hidden="true"
                    className="h-2 w-6 rounded-full"
                    style={{
                      background:
                        n <= (rank.subrank ?? 0)
                          ? (rank.color ?? "var(--series-1)")
                          : "rgb(255 255 255 / 0.08)",
                    }}
                  />
                ))}
              </ol>
            )}
          </>
        ) : (
          <p className="text-sm text-muted">Aucun rang classé disponible pour ce joueur.</p>
        )}
      </div>
    </header>
  );
}
