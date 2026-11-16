import { cn } from "@/components/ui";

/** Écart signé : ▲ vert, ▼ rouge, = neutre sous le seuil. Toujours doublé du signe et du mot lu. */
export function DeltaChip({
  value,
  unit = "",
  digits = 1,
  threshold = 0,
  invert = false,
  context,
  className,
}: {
  value: number | null;
  unit?: string;
  digits?: number;
  threshold?: number;
  /** true quand une baisse est une bonne nouvelle (par exemple les morts). */
  invert?: boolean;
  context?: string;
  className?: string;
}) {
  if (value === null) return <span className={cn("text-xs text-subtle", className)}>n/d</span>;
  const neutral = Math.abs(value) < threshold || value === 0;
  const up = value > 0;
  const good = invert ? !up : up;
  const text = `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toLocaleString("fr-FR", { maximumFractionDigits: digits, minimumFractionDigits: digits })}${unit}`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
        neutral
          ? "bg-white/[0.06] text-muted"
          : good
            ? "bg-win/12 text-win"
            : "bg-loss/12 text-loss",
        className,
      )}
    >
      <span aria-hidden="true">{neutral ? "=" : up ? "▲" : "▼"}</span>
      {text}
      <span className="sr-only">
        {neutral ? ", stable" : good ? ", en progression" : ", en baisse"}
        {context ? ` ${context}` : ""}
      </span>
    </span>
  );
}
