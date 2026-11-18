import { Link } from "react-router";
import type { HeroSummary } from "@/api";
import { HeroPortrait } from "@/components/media/HeroPortrait";
import { ROLE_LABELS, complexityLabel } from "./roles";

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
      {hero.complexity !== null && (
        <span
          role="img"
          aria-label={`Complexité : ${complexityLabel(hero.complexity)}`}
          title={`Complexité : ${complexityLabel(hero.complexity)}`}
          className="absolute top-2.5 right-2.5 flex gap-[3px] rounded-full bg-bg/70 px-2 py-1.5 backdrop-blur-[12px]"
        >
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className="size-1.5 rounded-full"
              style={{
                background: n <= (hero.complexity ?? 0) ? hero.color : "rgb(255 255 255 / 0.22)",
              }}
            />
          ))}
        </span>
      )}
      <span className="absolute inset-x-0 bottom-0 p-3.5">
        <span className="block truncate text-base font-semibold tracking-[-0.03em] text-text">
          {hero.name}
        </span>
        <span className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className="inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium"
            style={{
              background: "rgb(9 10 12 / 0.72)",
              borderColor: `color-mix(in srgb, ${hero.color} 55%, transparent)`,
              color: `color-mix(in srgb, ${hero.color} 40%, white)`,
            }}
          >
            {ROLE_LABELS[hero.role]}
          </span>
          {hero.gunTag && (
            <span className="min-w-0 text-[11px] leading-tight text-text/80">{hero.gunTag}</span>
          )}
        </span>
      </span>
    </Link>
  );
}
