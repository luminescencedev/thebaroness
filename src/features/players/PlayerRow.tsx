import { Link } from "react-router";
import type { PlayerSummary } from "@/api";
import { Avatar, Tag } from "@/components/ui";

interface PlayerRowProps {
  player: PlayerSummary;
  /** Le pseudo correspond exactement à la recherche. */
  exact?: boolean;
}

export function PlayerRow({ player, exact = false }: PlayerRowProps) {
  return (
    <Link
      to={`/players/${player.steamId}`}
      className="pressable card flex items-center gap-3.5 p-4 hover:border-border-strong hover:bg-white/[0.03]"
    >
      <Avatar
        name={player.displayName}
        src={player.avatarUrl}
        className="size-11 rounded-xl text-[17px]"
      />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2 font-semibold">
          <span className="truncate">{player.displayName}</span>
          {exact && (
            <Tag className="shrink-0 border-0 bg-accent/15 whitespace-nowrap text-accent-text">
              pseudo exact
            </Tag>
          )}
        </span>
        <span className="mono text-xs text-subtle">{player.steamId}</span>
      </span>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="size-4 shrink-0 text-subtle"
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
