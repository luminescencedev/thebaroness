import { Link } from "react-router";
import type { LeaderboardEntry } from "@/api";
import { HeroPortrait } from "@/components/media/HeroPortrait";
import { RankBadge } from "@/components/media/RankBadge";
import { Avatar, cn } from "@/components/ui";
import { rankLabel } from "@/lib/rank";
import { IdentityNote } from "./IdentityNote";
import { safeColor } from "./model";

/** Or, argent, bronze : couleur du chiffre et voile de la ligne pour les rangs 1 à 3 (le rang, pas la position). */
const MEDAL: Record<number, string> = { 1: "#f5c451", 2: "#c9ced8", 3: "#d08a5a" };

function Rank({ entry, size }: { entry: LeaderboardEntry; size: "sm" | "md" }) {
  const b = entry.badge;
  // Pas de rang connu : « Rang n/d », jamais une icône ni un 0 inventés.
  if (!b) return <span className="text-[12.5px] text-subtle">Rang n/d</span>;
  const name = rankLabel(b.name, b.subrank) ?? b.name;
  const color = safeColor(b.color);
  return (
    <span className="inline-flex items-center gap-2">
      <RankBadge
        name={name}
        imageUrl={b.imageUrl}
        color={color}
        className={
          size === "sm" ? "[&_img]:size-[18px] [&_span]:size-[18px]" : "[&_img]:size-[30px]"
        }
      />
      <span
        className="text-[13px] tracking-[0.025em] whitespace-nowrap [font-kerning:none]"
        style={{
          color: color ? `color-mix(in srgb, ${color} 62%, #fff)` : "var(--muted)",
        }}
      >
        {name}
      </span>
    </span>
  );
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  tied: boolean;
}

/**
 * Une ligne du classement. Toute la ligne ouvre le profil quand le SteamID est connu (lien étiré sur le
 * pseudo) ; sinon la ligne n'est pas cliquable et le dit. Mise en page pilotée par la largeur du conteneur
 * (la sidebar change la largeur utile sans changer celle de la fenêtre).
 */
export function LeaderboardRow({ entry, tied }: LeaderboardRowProps) {
  const link = entry.steamId !== null;
  const medal = MEDAL[entry.rank];
  const name = (
    <span
      className={cn("truncate text-[15px] font-medium tracking-[-0.012em]", !link && "text-muted")}
    >
      {entry.displayName}
    </span>
  );
  return (
    <li
      data-link={link}
      style={
        medal
          ? {
              backgroundImage: `linear-gradient(90deg, color-mix(in srgb, ${medal} 9%, transparent), transparent 46%)`,
            }
          : undefined
      }
      className={cn(
        "row-link relative grid min-h-[60px] grid-cols-[34px_36px_minmax(0,1fr)_auto] items-center gap-x-2.5 border-t border-divider py-2 pr-3 pl-2 first:border-t-0",
        "@max-[300px]:grid-cols-[30px_34px_minmax(0,1fr)] @max-[300px]:gap-x-2",
        "@[640px]:min-h-[62px] @[640px]:grid-cols-[52px_40px_minmax(0,1fr)_190px_104px_14px] @[640px]:gap-x-3 @[640px]:pr-4",
        !link && "hover:!bg-transparent",
      )}
    >
      <span
        className="text-center text-base font-semibold tracking-[-0.02em] text-muted tabular-nums @[640px]:text-lg"
        style={medal ? { color: medal } : undefined}
      >
        {tied && (
          <span className="mr-px text-xs font-medium text-subtle" title="Ex æquo">
            =<span className="sr-only">Ex æquo, rang </span>
          </span>
        )}
        {entry.rank}
      </span>
      <Avatar
        name={entry.displayName}
        src={entry.avatarUrl}
        className="size-[34px] text-xs @min-[301px]:size-9 @[640px]:size-10"
      />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="flex min-w-0 items-center gap-2">
          {link ? (
            <Link
              to={`/players/${entry.steamId}`}
              className="min-w-0 truncate after:absolute after:inset-0 focus-visible:outline-none"
            >
              {name}
            </Link>
          ) : (
            name
          )}
          {entry.inferred && <IdentityNote kind="inferred" />}
          {!link && <IdentityNote kind="unlinked" />}
        </span>
        <span className="flex min-h-[18px] items-center text-xs @[640px]:hidden">
          <Rank entry={entry} size="sm" />
        </span>
      </span>
      <span className="hidden @[640px]:block">
        <Rank entry={entry} size="md" />
      </span>
      {entry.topHeroes.length > 0 ? (
        <ul
          className="flex items-center @max-[300px]:hidden [&>li+li]:-ml-2 @max-[639px]:[&>li:nth-child(3)]:hidden"
          aria-label="Héros les plus joués"
        >
          {entry.topHeroes.map((h) => (
            <li key={h.heroId} title={h.name}>
              <HeroPortrait
                name={h.name}
                src={h.imageUrl}
                rounded="full"
                className="size-6 border-2 border-[#17181b] @[640px]:size-[26px]"
              />
              <span className="sr-only">{h.name}</span>
            </li>
          ))}
        </ul>
      ) : (
        <span className="text-[12.5px] text-subtle @max-[300px]:hidden">n/d</span>
      )}
      {link && (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="row-chevron hidden size-3.5 text-subtle @[640px]:block"
        >
          <path
            d="m9 6 6 6-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </li>
  );
}
