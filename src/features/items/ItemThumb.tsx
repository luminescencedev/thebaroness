import { Link } from "react-router";
import type { CatalogItem } from "@/api";
import { cn } from "@/components/ui";
import { ITEM_TONE, ROMAN, itemName } from "./tone";

/**
 * Vignette d'objet sans focus propre (à placer dans un lien ou un bouton) : image fournie par le back,
 * sinon tuile de repli catégorie + palier. Les mêmes tons que ItemIcon du Match Detail.
 */
export function ItemThumb({
  item,
  size = 40,
  className,
}: {
  item: Pick<CatalogItem, "slot" | "tier" | "imageUrl"> | null;
  size?: number;
  className?: string;
}) {
  const tone = item?.slot ? ITEM_TONE[item.slot] : { bg: "#23262c", fg: "#9aa0aa" };
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-[8px] ring-1 ring-white/10",
        className,
      )}
      style={{ width: size, height: size, background: tone.bg, color: tone.fg }}
    >
      {item?.imageUrl ? (
        <img src={item.imageUrl} alt="" loading="lazy" className="size-full object-cover" />
      ) : (
        <span className="text-[11px] leading-none font-bold">
          {item?.tier ? (ROMAN[item.tier] ?? item.tier) : "?"}
        </span>
      )}
      <span
        className="absolute inset-x-0 bottom-0 h-[2px]"
        style={{ background: tone.fg, opacity: 0.7 }}
      />
    </span>
  );
}

/** Lien compact vers la fiche d'un objet : vignette et nom. `item` null = hors catalogue (identifiant seul). */
export function ItemLink({
  itemId,
  item,
  size = 32,
  heroId,
  className,
}: {
  itemId: number;
  item: CatalogItem | undefined;
  size?: number;
  /** Héros d'origine : la fiche de l'objet propose alors de revenir à ce héros et filtre sur lui. */
  heroId?: number;
  className?: string;
}) {
  const name = item ? itemName(item) : `Objet n°${itemId}`;
  return (
    <Link
      to={`/items/${itemId}${heroId ? `?hero=${heroId}` : ""}`}
      className={cn(
        "pressable hover-text inline-flex min-w-0 items-center gap-2 rounded-lg text-sm",
        className,
      )}
    >
      <ItemThumb item={item ?? null} size={size} />
      <span className="truncate font-medium">{name}</span>
    </Link>
  );
}
