import type { CatalogItem } from "@/api";

/**
 * Prix standards des tiers I à IV, utilisés UNIQUEMENT pour choisir quels montants afficher en premier dans le
 * filtre. Ils ne servent jamais à calculer ou à afficher le prix d'un objet : la source de vérité est
 * `CatalogItem.cost`, renvoyé par le back.
 */
export const PREFERRED_COSTS = [800, 1600, 3200, 6400] as const;

export interface CostOption {
  value: number;
  /** Nombre d'objets du catalogue pertinent à ce prix. */
  count: number;
}

/** Un coût exploitable : fini et non négatif. null, NaN et Infinity sont ignorés, 0 est conservé. */
export const isValidCost = (c: unknown): c is number =>
  typeof c === "number" && Number.isFinite(c) && c >= 0;

/** Montants exacts présents dans une liste d'objets : dédupliqués, croissants. */
export function costOptions(items: readonly Pick<CatalogItem, "cost">[]): CostOption[] {
  const counts = new Map<number, number>();
  for (const i of items) if (isValidCost(i.cost)) counts.set(i.cost, (counts.get(i.cost) ?? 0) + 1);
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => a.value - b.value);
}

/**
 * Répartit les options entre boutons directs et menu « Autres prix » quand il y en a trop pour une rangée
 * lisible. Les prix standards présents passent en premier, puis les plus fréquents, jusqu'à `max` boutons.
 * Rien n'est perdu : tout montant absent des boutons est dans le menu.
 */
export function splitCostOptions(
  options: readonly CostOption[],
  max = 6,
): { primary: CostOption[]; more: CostOption[] } {
  if (options.length <= max) return { primary: [...options], more: [] };
  const preferred = options.filter((o) => (PREFERRED_COSTS as readonly number[]).includes(o.value));
  const others = options
    .filter((o) => !preferred.includes(o))
    .sort((a, b) => b.count - a.count || a.value - b.value);
  const primary = [...preferred, ...others.slice(0, Math.max(0, max - preferred.length))].sort(
    (a, b) => a.value - b.value,
  );
  return { primary, more: options.filter((o) => !primary.includes(o)) };
}

/** Lit le paramètre d'URL `cost` : un entier décimal, sinon null (anciennes valeurs low/mid/high comprises). */
export function parseCostParam(raw: string | null): number | null {
  if (raw === null || !/^\d{1,9}$/.test(raw)) return null;
  return Number(raw);
}
