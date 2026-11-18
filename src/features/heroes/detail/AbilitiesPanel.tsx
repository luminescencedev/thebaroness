import type { HeroAbility } from "@/api";
import { HeroPortrait } from "@/components/media/HeroPortrait";
import { formatInt } from "@/lib/format";

/** Capacités : description toujours visible (pas de popover), recharge seulement si connue. */
export function AbilitiesPanel({ abilities, color }: { abilities: HeroAbility[]; color: string }) {
  if (abilities.length === 0)
    return <p className="text-sm text-muted">Capacités non renseignées par la source.</p>;
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {abilities.map((a) => (
        <li
          key={a.id}
          className="flex gap-4 rounded-2xl border border-border bg-surface p-4"
          style={{ ["--hc" as string]: color }}
        >
          <HeroPortrait
            name={a.name}
            src={a.imageUrl}
            rounded="xl"
            className="size-14 shrink-0 ring-2"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h3 className="text-base font-semibold tracking-[-0.02em]">{a.name}</h3>
              {a.type === "ultimate" && (
                <span
                  className="rounded-full border px-2 py-0.5 text-[11px] font-medium"
                  style={{
                    borderColor: `color-mix(in srgb, ${color} 55%, transparent)`,
                    color: `color-mix(in srgb, ${color} 40%, white)`,
                  }}
                >
                  Ultime
                </span>
              )}
              {a.cooldownSeconds ? (
                <span className="text-xs text-muted tabular-nums">
                  Recharge {formatInt(a.cooldownSeconds)} s
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {a.description || "Description indisponible."}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
