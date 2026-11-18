import type { HomonymGroup as Group } from "./model";
import { PlayerResultRow } from "./PlayerResultRow";

/** Comptes qui portent exactement le même pseudo : seuls l'avatar et le SteamID64 les distinguent. */
export function HomonymGroup({ group, query }: { group: Group; query: string }) {
  const name = group.players[0]?.displayName ?? "";
  const count = group.players.length;
  return (
    <section className="space-y-2" aria-label={`Même pseudo, ${count} comptes`}>
      <div className="mx-1 flex items-baseline justify-between gap-3">
        <h2 className="text-[13px] font-semibold text-muted">Même pseudo</h2>
        <span className="text-xs text-subtle tabular-nums">{count} comptes</span>
      </div>
      <div className="card overflow-hidden border-warning/30">
        <p className="border-b border-divider bg-warning/[0.06] px-4 py-3 text-[13px] leading-snug text-muted">
          <b className="font-semibold text-[#f6d9a8]">
            « {name} » existe sur {count} comptes Steam.
          </b>{" "}
          {group.exact && "Pseudo exact. "}
          Vérifiez le SteamID64 avant de suivre un joueur.
        </p>
        <ul>
          {group.players.map((p) => (
            <li key={p.steamId}>
              <PlayerResultRow player={p} query={query} emphasizeId />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
