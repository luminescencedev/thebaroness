import { useId, useState } from "react";

export interface LinePoint {
  label: string;
  value: number;
}

interface LineChartProps {
  points: LinePoint[];
  /** Description pour les lecteurs d'écran. */
  title: string;
  format?: (v: number) => string;
  /** Ligne de référence (par exemple 50 % de victoires). */
  reference?: number;
  height?: number;
  color?: string;
  min?: number;
  max?: number;
}

const W = 640;
const PAD = { top: 12, right: 12, bottom: 22, left: 40 };

/** Courbe SVG sans dépendance. Survol : info-bulle sans animation. */
export function LineChart({
  points,
  title,
  format = (v) => String(v),
  reference,
  height = 200,
  color = "var(--accent-text)",
  min,
  max,
}: LineChartProps) {
  const gradId = useId();
  const [hover, setHover] = useState<number | null>(null);
  if (points.length < 2) return null;

  const values = points.map((p) => p.value);
  const lo = min ?? Math.min(...values, reference ?? Infinity);
  const hi = max ?? Math.max(...values, reference ?? -Infinity);
  const span = hi - lo || 1;
  const innerW = W - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (i / (points.length - 1)) * innerW;
  const y = (v: number) => PAD.top + (1 - (v - lo) / span) * innerH;
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`)
    .join(" ");
  const area = `${path} L${x(points.length - 1).toFixed(1)},${PAD.top + innerH} L${PAD.left},${PAD.top + innerH} Z`;
  const ticks = [lo, lo + span / 2, hi];
  const active = hover === null ? null : points[hover];

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        role="img"
        aria-label={title}
        className="w-full overflow-visible"
        onPointerLeave={() => setHover(null)}
        onPointerMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          const ratio = (e.clientX - box.left) / box.width;
          const px = ratio * W;
          const i = Math.round(((px - PAD.left) / innerW) * (points.length - 1));
          setHover(Math.min(points.length - 1, Math.max(0, i)));
        }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--border)" />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--subtle)">
              {format(Math.round(t * 10) / 10)}
            </text>
          </g>
        ))}
        {reference !== undefined && (
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(reference)}
            y2={y(reference)}
            stroke="var(--subtle)"
            strokeDasharray="4 4"
          />
        )}
        <path d={area} fill={`url(#${gradId})`} />
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {active && hover !== null && (
          <g>
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.top}
              y2={PAD.top + innerH}
              stroke="var(--border-strong)"
            />
            <circle
              cx={x(hover)}
              cy={y(active.value)}
              r="4"
              fill={color}
              stroke="var(--bg)"
              strokeWidth="2"
            />
          </g>
        )}
        <text x={PAD.left} y={height - 4} fontSize="11" fill="var(--subtle)">
          {points[0]?.label}
        </text>
        <text x={W - PAD.right} y={height - 4} textAnchor="end" fontSize="11" fill="var(--subtle)">
          {points[points.length - 1]?.label}
        </text>
      </svg>
      <figcaption className="mt-1 min-h-5 text-xs text-muted" aria-live="off">
        {active
          ? `${active.label} : ${format(active.value)}`
          : "Survolez la courbe pour le détail."}
      </figcaption>
    </figure>
  );
}
