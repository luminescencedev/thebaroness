import { Link } from "react-router";
import type { HeroSummary } from "@/api";
import { HeroPortrait } from "@/components/media/HeroPortrait";
import { ROLE_LABELS } from "./roles";

/** Carte de héros : portrait du catalogue, nom, rôle. */
export function HeroCard({ hero }: { hero: HeroSummary }) {
  return (
    <Link
      to={`/heroes/${hero.id}`}
      className="pressable group card relative block overflow-hidden"
      style={{ ["--hero" as string]: hero.color }}
    >
      <HeroPortrait
        name={hero.name}
        src={hero.images.card}
        color={hero.color}
        rounded="lg"
        className="aspect-[4/5] w-full rounded-none"
      />
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-bg via-bg/70 to-transparent"
      />
      <span className="absolute inset-x-0 bottom-0 p-3">
        <span className="block truncate text-base font-semibold tracking-[-0.03em] text-text">
          {hero.name}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
          <span
            className="size-1.5 rounded-full"
            style={{ backgroundColor: hero.color }}
            aria-hidden="true"
          />
          {ROLE_LABELS[hero.role]}
        </span>
      </span>
    </Link>
  );
}
