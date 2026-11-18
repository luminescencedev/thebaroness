import { Link } from "react-router";
import type { PlayerSummary } from "@/api";
import { Avatar, Tag } from "@/components/ui";
import { rememberPlayer } from "./recents";
import { matchParts } from "./model";

interface PlayerResultRowProps {
  player: Pick<PlayerSummary, "steamId" | "displayName" | "avatarUrl">;
  /** Terme cherché : met en valeur la partie du pseudo qui correspond. */
  query?: string;
  /** Pseudo identique à la recherche. */
  exact?: boolean;
  /** Homonymes : les 6 derniers chiffres du SteamID64 ressortent, c'est ce qui distingue les comptes. */
  emphasizeId?: boolean;
}

/** Une ligne de résultat : toute la ligne est le lien, le profil s'ouvre et le joueur rejoint les récents. */
export function PlayerResultRow({ player, query, exact, emphasizeId }: PlayerResultRowProps) {
  const parts = matchParts(player.displayName, query ?? "");
  const id = player.steamId;
  return (
    <Link
      to={`/players/${id}`}
      onClick={() =>
        rememberPlayer({
          steamId: id,
          displayName: player.displayName,
          avatarUrl: player.avatarUrl,
        })
      }
      className="row-link flex min-h-[68px] items-center gap-3.5 border-t border-divider px-3.5 py-2.5 first:border-t-0 sm:px-4"
    >
      <Avatar
        name={player.displayName}
        src={player.avatarUrl}
        className="size-11 rounded-xl text-[15px]"
      />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex min-w-0 items-center gap-2 text-[15px] font-medium tracking-[-0.012em]">
          <span className="truncate">
            {parts ? (
              <>
                <span className="sr-only">{player.displayName}</span>
                <span aria-hidden="true">
                  <span className="text-muted">{parts.before}</span>
                  {parts.match}
                  <span className="text-muted">{parts.after}</span>
                </span>
              </>
            ) : (
              player.displayName
            )}
          </span>
          {exact && (
            <Tag className="shrink-0 border-0 bg-accent/15 whitespace-nowrap text-accent-text">
              pseudo exact
            </Tag>
          )}
        </span>
        <span className="mono truncate text-xs text-subtle">
          {emphasizeId ? (
            <>
              {id.slice(0, -6)}
              <b className="font-semibold text-[#d9dbe1]">{id.slice(-6)}</b>
            </>
          ) : (
            id
          )}
        </span>
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
  );
}
