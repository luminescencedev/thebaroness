import { cn } from "@/components/ui";
import { formatInt } from "@/lib/format";
import { ROMAN } from "./tone";
import { splitCostOptions, type CostOption } from "./costs";

const chip = "pressable hover-text h-8 rounded-full border px-3 text-[13px] tabular-nums";
const on = {
  borderColor: "color-mix(in srgb, var(--text) 55%, transparent)",
  background: "color-mix(in srgb, var(--text) 16%, transparent)",
  color: "var(--text)",
};
const off = { borderColor: "var(--border)", color: "var(--muted)" };

/**
 * Filtre de coût exact : « Tous » puis les montants réellement présents dans le catalogue. Au-delà de six
 * montants, les moins fréquents passent dans un menu « Autres prix » (rien n'est perdu).
 */
export function CostFilter({
  options,
  value,
  onChange,
  tierByCost,
}: {
  options: CostOption[];
  value: number | null;
  onChange: (v: number | null) => void;
  /** Tier commun à tous les objets d'un montant (absent si plusieurs tiers ou inconnu) : affiché devant le prix. */
  tierByCost?: ReadonlyMap<number, number>;
}) {
  const label = (v: number) => {
    const t = tierByCost?.get(v);
    return t ? `${ROMAN[t] ?? t} · ${formatInt(v)}` : formatInt(v);
  };
  const { primary, more } = splitCostOptions(options);
  const moreSelected = value !== null && more.some((o) => o.value === value);
  return (
    <div role="group" aria-label="Coût" className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[11px] font-medium tracking-wide text-subtle uppercase">
        Tier · Coût
      </span>
      <button
        type="button"
        aria-pressed={value === null}
        onClick={() => onChange(null)}
        className={chip}
        style={value === null ? on : off}
      >
        Tous
      </button>
      {primary.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          aria-label={`${formatInt(o.value)} souls`}
          title={
            tierByCost?.get(o.value) ? `Tier ${ROMAN[tierByCost.get(o.value)!] ?? ""}` : undefined
          }
          onClick={() => onChange(value === o.value ? null : o.value)}
          className={chip}
          style={value === o.value ? on : off}
        >
          {label(o.value)}
        </button>
      ))}
      {more.length > 0 && (
        <>
          <label className="sr-only" htmlFor="cost-more">
            Autres prix
          </label>
          <select
            id="cost-more"
            value={moreSelected ? String(value) : ""}
            onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
            className={cn(
              "h-8 rounded-full border bg-surface px-3 text-[13px] outline-none focus-visible:outline-2 focus-visible:outline-focus",
              moreSelected ? "text-text" : "text-muted",
            )}
            style={moreSelected ? on : off}
          >
            <option value="">Autres prix</option>
            {more.map((o) => (
              <option key={o.value} value={o.value}>
                {formatInt(o.value)} ({o.count})
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}
