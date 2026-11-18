import type { CatalogItem, ItemPair } from "@/api";
import { BulletBar } from "@/components/charts";
import { formatInt, formatPercent } from "@/lib/format";
import { ItemLink } from "./ItemThumb";

/**
 * Paires d'objets achetées ensemble, par volume décroissant. Une association n'est pas une causalité ni une
 * recommandation. wins + losses peut ne pas égaler matches (contrat de la source) : on affiche les valeurs brutes.
 */
export function PairsList({
  pairs,
  catalog,
  color,
}: {
  pairs: ItemPair[];
  catalog: Map<number, CatalogItem> | undefined;
  color: string;
}) {
  const top = Math.max(...pairs.map((p) => p.matches), 1);
  return (
    <ul className="divide-y divide-border">
      {pairs.map((p) => (
        <li
          key={p.itemIds.join("-")}
          className="grid items-center gap-x-4 gap-y-2 py-3 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]"
        >
          <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
            {p.itemIds.map((id, i) => (
              <span key={id} className="flex min-w-0 items-center gap-3">
                {i === 1 && (
                  <span aria-hidden="true" className="text-subtle">
                    +
                  </span>
                )}
                <ItemLink itemId={id} item={catalog?.get(id)} size={34} />
              </span>
            ))}
          </span>
          <span className="min-w-0">
            <span className="flex items-baseline justify-between text-xs text-muted tabular-nums">
              <span>{formatInt(p.matches)} parties</span>
            </span>
            <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-surface-strong">
              <span
                className="block h-full rounded-full"
                style={{ width: `${Math.max(3, (p.matches / top) * 100)}%`, background: color }}
              />
            </span>
          </span>
          <span className="min-w-0">
            <span className="flex items-baseline justify-between text-xs tabular-nums">
              <span className="font-semibold text-text">{formatPercent(p.winRate)}</span>
              <span className="text-subtle">
                {formatInt(p.wins)} V / {formatInt(p.losses)} D
              </span>
            </span>
            <span className="mt-1.5 block">
              <BulletBar
                value={p.winRate}
                mark={50}
                color="var(--win)"
                label={`Taux de victoire ${formatPercent(p.winRate)} contre 50 %`}
              />
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
