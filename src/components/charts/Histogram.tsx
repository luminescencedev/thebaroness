export function Histogram({
  bins,
  median,
  medianLabel,
  height = 120,
}: {
  bins: { label: string; count: number }[];
  /** Index de la classe qui contient la médiane. */
  median?: number | null;
  medianLabel?: string;
  height?: number;
}) {
  const max = Math.max(...bins.map((b) => b.count), 1);
  return (
    <div>
      <ul className="flex items-end gap-1.5" style={{ height }} aria-label="Répartition">
        {bins.map((b, i) => (
          <li
            key={b.label}
            className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
          >
            <span className="text-[11px] text-muted tabular-nums">{b.count}</span>
            <span
              className="w-full rounded-t-md"
              style={{
                height: `${Math.max(b.count ? 4 : 1, (b.count / max) * 100)}%`,
                background:
                  median === i
                    ? "var(--series-1)"
                    : "color-mix(in srgb, var(--series-2) 70%, transparent)",
              }}
            />
          </li>
        ))}
      </ul>
      <ul className="mt-1.5 flex gap-1.5">
        {bins.map((b, i) => (
          <li key={b.label} className="flex-1 text-center text-[10px] leading-tight text-subtle">
            {b.label}
            {median === i && (
              <span className="block text-series-1">{medianLabel ?? "médiane"}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
