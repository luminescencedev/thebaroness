export interface RadarAxis {
  label: string;
  /** Valeur normalisée de 0 à 1. */
  value: number;
  display: string;
}

/** Radar à n axes. À utiliser seulement si les valeurs sont comparables (sinon barres). */
export function Radar({
  axes,
  color = "var(--series-1)",
  size = 220,
}: {
  axes: RadarAxis[];
  color?: string;
  size?: number;
}) {
  const n = axes.length;
  if (n < 3) return null;
  const c = 50;
  const R = 34;
  const pt = (i: number, v: number) => {
    const a = (i / n) * 2 * Math.PI - Math.PI / 2;
    return [c + Math.cos(a) * R * v, c + Math.sin(a) * R * v] as const;
  };
  const poly = axes.map((a, i) => pt(i, Math.max(0.04, Math.min(1, a.value))).join(",")).join(" ");
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={axes.map((a) => `${a.label} ${a.display}`).join(", ")}
    >
      {[0.33, 0.66, 1].map((r) => (
        <polygon
          key={r}
          points={axes.map((_, i) => pt(i, r).join(",")).join(" ")}
          fill="none"
          stroke="rgb(255 255 255 / 0.08)"
          strokeWidth="0.4"
        />
      ))}
      {axes.map((_, i) => (
        <line
          key={i}
          x1={c}
          y1={c}
          x2={pt(i, 1)[0]}
          y2={pt(i, 1)[1]}
          stroke="rgb(255 255 255 / 0.06)"
          strokeWidth="0.4"
        />
      ))}
      <polygon
        points={poly}
        fill={color}
        fillOpacity="0.22"
        stroke={color}
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      {axes.map((a, i) => {
        const [x, y] = pt(i, 1.2);
        return (
          <text
            key={a.label}
            x={x}
            y={y}
            fontSize="3.4"
            fill="var(--muted)"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {a.label}
          </text>
        );
      })}
    </svg>
  );
}
