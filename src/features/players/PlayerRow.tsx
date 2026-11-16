import { Link } from "react-router";
import type { PlayerSummary } from "@/api";
import { Avatar } from "@/components/ui";

export function PlayerRow({ player }: { player: PlayerSummary }) {
  return (
    <Link
      to={`/players/${player.steamId}`}
      className="pressable card flex items-center gap-3 p-3 hover:border-border-strong"
    >
      <Avatar name={player.displayName} src={player.avatarUrl} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{player.displayName}</span>
        <span className="mono block text-xs text-subtle">{player.steamId}</span>
      </span>
      <span aria-hidden="true" className="text-subtle">
        &rsaquo;
      </span>
    </Link>
  );
}
