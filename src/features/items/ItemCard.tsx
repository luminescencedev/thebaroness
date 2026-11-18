import { Link, useLocation } from "react-router";
import type { CatalogItem, ItemStats } from "@/api";
import { ITEM_TONE, ROMAN } from "@/features/items/tone";
import { NA, formatCompact, formatInt, formatPercent } from "@/lib/format";
import { ItemThumb } from "./ItemThumb";
import { categoryLabel, itemName } from "./tone";

/** Carte compacte d'un objet du catalogue. `stats` null : pas de ligne de statistiques (jamais 0). */
export function ItemCard({ item, stats }: { item: CatalogItem; stats: ItemStats | undefined }) {
  const { search } = useLocation();
  const tone = item.slot ? ITEM_TONE[item.slot] : null;
  // Le contexte statistique (période, type de partie) suit le lien vers la fiche.
  const ctx = new URLSearchParams(search);
  const carry = new URLSearchParams();
  for (const k of ["period", "mode"]) if (ctx.get(k)) carry.set(k, ctx.get(k) as string);
  const to = `/items/${item.id}${carry.size ? `?${carry}` : ""}`;

  return (
    <Link
      to={to}
      className="pressable group flex h-full items-center gap-3 rounded-2xl border border-border bg-surface p-3 hover:border-border-strong hover:bg-surface-strong"
      style={tone ? { ["--ic" as string]: tone.fg } : undefined}
    >
      <ItemThumb item={item} size={52} className="rounded-[10px]" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold tracking-[-0.02em]">
          {itemName(item)}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-xs">
          <span style={{ color: tone?.fg }} className="font-medium">
            {categoryLabel(item.slot)}
          </span>
          {item.tier !== null && (
            <span className="text-subtle">Tier {ROMAN[item.tier] ?? item.tier}</span>
          )}
          <span className="ml-auto text-muted tabular-nums" title="Prix du catalogue en souls">
            {item.cost === null ? NA : formatInt(item.cost)}
          </span>
        </span>
        {stats ? (
          <span className="mt-1 flex items-center justify-between gap-2 text-[11px] text-subtle tabular-nums">
            <span title={`${formatInt(stats.matches)} parties avec achat observé`}>
              {formatCompact(stats.matches)} achats
            </span>
            <span>{formatPercent(stats.winRate)} victoires</span>
          </span>
        ) : null}
      </span>
    </Link>
  );
}
