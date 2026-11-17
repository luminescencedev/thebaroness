import { Link } from "react-router";
import { HeroPortrait } from "@/components/media/HeroPortrait";
import { cn } from "@/components/ui";
import { NA, formatDecimal, formatInt } from "@/lib/format";
import type { Participant, ParticipantTeam } from "@/lib/matchModel";

const SIDE = {
  amber: { label: "Amber Hand", color: "#f5b14c" },
  sapphire: { label: "Sapphire Flame", color: "#5b9dff" },
} as const;

const who = (p: Participant) =>
  `${p.displayName} (${p.heroName})${p.isSelf ? ", joueur du profil" : ""}`;

/** Aperçu dans la ligne : 2 colonnes de 6 lignes (pseudo) ou 2 rangées de portraits. */
export function TeamsPreview({
  teams,
  variant,
}: {
  teams: ParticipantTeam[];
  variant: "names" | "portraits";
}) {
  if (variant === "portraits")
    return (
      <div className="flex flex-col gap-1" aria-label="Équipes">
        {teams.map((t) => (
          <ul key={t.side} className="flex gap-[3px]" aria-label={SIDE[t.side].label}>
            {t.players.map((p, i) => (
              <li key={`${p.heroId}-${i}`} title={who(p)}>
                <HeroPortrait
                  name={p.heroName}
                  src={p.heroImageUrl}
                  rounded="lg"
                  className={cn("size-[22px]", p.isSelf && "ring-2 ring-text")}
                />
                <span className="sr-only">{who(p)}</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    );
  return (
    <div className="grid grid-cols-2 gap-x-3" aria-label="Équipes">
      {teams.map((t) => (
        <ul key={t.side} aria-label={SIDE[t.side].label} className="min-w-0 ">
          {t.players.map((p, i) => (
            <li
              key={`${p.heroId}-${i}`}
              title={who(p)}
              className={cn(
                "flex h-[13px] min-w-0 items-center gap-1.5 text-[11px] leading-none",
                p.isSelf ? "font-semibold text-text" : "text-subtle",
              )}
            >
              <HeroPortrait
                name={p.heroName}
                src={p.heroImageUrl}
                rounded="lg"
                className="size-[13px] rounded-[4px]"
              />
              <span className="truncate">{p.displayName}</span>
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}

/** Tableau détaillé des deux équipes (panneau développé) : liens vers les profils identifiables. */
export function TeamsTable({ teams }: { teams: ParticipantTeam[] }) {
  return (
    <div className="grid gap-4 @3xl:grid-cols-2">
      {teams.map((t) => (
        <section key={t.side} aria-label={SIDE[t.side].label}>
          <h4 className="mb-1.5 flex items-center gap-2 text-xs font-medium text-muted">
            <span
              className="size-2 rounded-full"
              style={{ background: SIDE[t.side].color }}
              aria-hidden="true"
            />
            {SIDE[t.side].label}
            <span className={t.outcome === "win" ? "text-win" : "text-loss"}>
              {t.outcome === "win" ? "Victoire" : "Défaite"}
            </span>
          </h4>
          <ul className="space-y-0.5">
            {t.players.map((p, i) => (
              <li
                key={`${p.heroId}-${i}`}
                className={cn(
                  "grid grid-cols-[22px_minmax(0,1fr)_auto_auto] items-center gap-2 rounded-lg px-1.5 py-1 text-xs",
                  p.isSelf && "bg-white/[0.06]",
                )}
              >
                <HeroPortrait
                  name={p.heroName}
                  src={p.heroImageUrl}
                  rounded="lg"
                  className="size-[22px]"
                />
                <span className="min-w-0 truncate">
                  {p.steamId ? (
                    <Link
                      to={`/players/${p.steamId}`}
                      className={cn(
                        "underline-offset-4 hover:underline",
                        p.isSelf ? "font-semibold text-text" : "text-muted",
                      )}
                    >
                      {p.displayName}
                    </Link>
                  ) : (
                    <span className={p.isSelf ? "font-semibold text-text" : "text-subtle"}>
                      {p.displayName}
                    </span>
                  )}
                  <span className="sr-only">, {p.heroName}</span>
                  {p.isSelf && <span className="sr-only"> (joueur du profil)</span>}
                </span>
                <span className="tabular-nums text-muted" title={`KDA ${formatDecimal(p.kda)}`}>
                  {p.kills ?? NA}/{p.deaths ?? NA}/{p.assists ?? NA}
                </span>
                <span className="w-14 text-right tabular-nums text-subtle">
                  {formatInt(p.netWorth)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
