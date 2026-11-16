export interface DonutSegment {
  key: string;
  label: string;
  value: number;
  color: string;
}

/** Anneau segmenté (par stroke-dasharray) avec total au centre et légende lisible. */
export function Donut({
  segments,
  centerLabel,
  size = 132,
}: {
  segments: DonutSegment[];
  centerLabel: string;
  size?: number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = 40;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 100 100"
          role="img"
          aria-label={segments.map((s) => `${s.label} : ${s.value}`).join(", ")}
          className="-rotate-90"
        >
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="rgb(255 255 255 / 0.06)"
            strokeWidth="12"
          />
          {total > 0 &&
            segments.map((s) => {
              const len = (s.value / total) * c;
              const el = (
                <circle
                  key={s.key}
                  cx="50"
                  cy="50"
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="12"
                  strokeDasharray={`${Math.max(0, len - 1.5)} ${c}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += len;
              return el;
            })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-2xl leading-none font-semibold tabular-nums">{total}</div>
            <div className="mt-0.5 text-[11px] text-subtle">{centerLabel}</div>
          </div>
        </div>
      </div>
      <ul className="flex min-w-[140px] flex-1 flex-col gap-2.5 text-sm">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-sm"
              style={{ backgroundColor: s.color }}
              aria-hidden="true"
            />
            <span className="flex-1 text-text">{s.label}</span>
            <span className="text-muted tabular-nums">
              {s.value} · {total ? Math.round((s.value / total) * 100) : 0} %
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
