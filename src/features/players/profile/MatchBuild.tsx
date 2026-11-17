import { Tooltip } from "@base-ui/react/tooltip";
import type { ItemCategory, MatchItem } from "@/api";
import { cn } from "@/components/ui";
import { NA } from "@/lib/format";

const TONE: Record<ItemCategory, { bg: string; fg: string; label: string }> = {
  weapon: { bg: "#3a2a17", fg: "#f2a94e", label: "Arme" },
  vitality: { bg: "#1b3322", fg: "#6fd58a", label: "Vitalité" },
  spirit: { bg: "#2c2347", fg: "#b4abff", label: "Esprit" },
};
const ROMAN = ["", "I", "II", "III", "IV"];

/** Icône d'objet : image fournie par le back, sinon tuile de repli (catégorie + palier), jamais une fausse icône. */
export function ItemIcon({ item, size = 26 }: { item: MatchItem; size?: number }) {
  const tone = TONE[item.category];
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        render={<span tabIndex={0} />}
        aria-label={`${item.name}, palier ${item.tier}, ${tone.label}`}
        className="relative inline-grid shrink-0 place-items-center overflow-hidden rounded-[6px] outline-none ring-1 ring-white/10 focus-visible:ring-2 focus-visible:ring-accent-text"
        style={{ width: size, height: size, background: tone.bg, color: tone.fg }}
      >
        {item.iconUrl ? (
          <img src={item.iconUrl} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <span aria-hidden="true" className="text-[9px] leading-none font-bold tracking-tight">
            {ROMAN[item.tier] ?? item.tier}
          </span>
        )}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[2px]"
          style={{ background: tone.fg, opacity: 0.7 }}
        />
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={6} className="z-[80]">
          <Tooltip.Popup className="surface-solid px-2.5 py-1.5 text-xs">
            <span className="font-semibold text-text">{item.name}</span>
            <span className="ml-2 text-subtle">
              {tone.label}, palier {ROMAN[item.tier] ?? item.tier}
            </span>
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

/** Grille compacte : 2 lignes de 6 emplacements (le jeu en compte 12), les vides en pointillés. */
export function BuildGrid({
  items,
  size = 26,
  slots = 12,
  className,
}: {
  items: MatchItem[] | null;
  size?: number;
  slots?: number;
  className?: string;
}) {
  if (!items)
    return (
      <p
        className={cn("text-xs text-subtle", className)}
        title="Le back ne livre pas encore les objets"
      >
        Build {NA}
      </p>
    );
  const cols = slots / 2;
  return (
    <ul
      aria-label="Build"
      className={cn("grid gap-[3px]", className)}
      style={{ gridTemplateColumns: `repeat(${cols}, ${size}px)` }}
    >
      {Array.from({ length: slots }, (_, i) => {
        const it = items[i];
        return (
          <li key={i} style={{ width: size, height: size }}>
            {it ? (
              <ItemIcon item={it} size={size} />
            ) : (
              <span
                aria-hidden="true"
                className="block size-full rounded-[6px] border border-dashed border-white/10"
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
