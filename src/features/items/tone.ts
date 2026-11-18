import type { CatalogItem, ItemCategory } from "@/api";

/** Tons par catégorie d'objet, partagés par le Match Detail, le profil, les builds et le catalogue. */
export const ITEM_TONE: Record<ItemCategory, { bg: string; fg: string; label: string }> = {
  weapon: { bg: "#3a2a17", fg: "#f2a94e", label: "Arme" },
  vitality: { bg: "#1b3322", fg: "#6fd58a", label: "Vitalité" },
  spirit: { bg: "#2c2347", fg: "#b4abff", label: "Esprit" },
};
export const ROMAN = ["", "I", "II", "III", "IV", "V"];

export const CATEGORIES = Object.keys(ITEM_TONE) as ItemCategory[];
export const categoryLabel = (c: ItemCategory | null) =>
  c ? ITEM_TONE[c].label : "Sans catégorie";

/** Nom affichable : le back peut renvoyer null, on ne l'invente pas. */
export const itemName = (i: Pick<CatalogItem, "id" | "name">) => i.name ?? `Objet n°${i.id}`;
