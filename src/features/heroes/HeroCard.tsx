import { Link } from "react-router";
import type { HeroSummary } from "@/api";
import { HeroPortrait } from "@/components/media/HeroPortrait";
import { ROLE_LABELS } from "./roles";

/** Carte de héros : portrait, lueur et bordure à la couleur du héros, rôle en pastille colorée. */
export function HeroCard({ hero }: { hero: HeroSummary }) {
  return (
    <Link
      to={`/heroes/${hero.id}`}
      className="pressable group card-hero block !rounded-2xl hover:brightness-110"
      style={{ ["--hc" as string]: hero.color }}
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
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-bg via-bg/75 to-transparent"
      />
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1"
        style={{ background: `linear-gradient(90deg, ${hero.color}, transparent)` }}
      />
      <span className="absolute inset-x-0 bottom-0 p-3.5">
        <span className="block truncate text-base font-semibold tracking-[-0.03em] text-text">
          {hero.name}
        </span>
        <span
          className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{
            background: `color-mix(in srgb, ${hero.color} 22%, transparent)`,
            color: hero.color,
          }}
        >
          {ROLE_LABELS[hero.role]}
          {hero.gunTag && <span className="text-text/70">· {hero.gunTag}</span>}
        </span>
      </span>
    </Link>
  );
}
