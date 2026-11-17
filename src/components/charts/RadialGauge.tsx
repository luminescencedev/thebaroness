interface RadialGaugeProps {
  /** Valeur de 0 à 100. */
  value: number | null;
  /** Repère, par exemple 50 % de victoires. */
  /** Repère en %, null pour ne pas en tracer (par défaut 50). */
  mark?: number | null;
  size?: number;
  label: string;
  color?: string;
  children?: React.ReactNode;
}

/** Anneau de progression avec repère. Le texte central est fourni par l'appelant. */
export function RadialGauge({
  value,
  mark = 50,
  size = 88,
  label,
  color = "var(--win)",
  children,
}: RadialGaugeProps) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const v = value === null ? 0 : Math.max(0, Math.min(100, value));
  const angle = ((mark ?? 0) / 100) * 2 * Math.PI - Math.PI / 2;
  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-label={label}
        className="absolute inset-0 -rotate-90"
      >
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="rgb(255 255 255 / 0.07)"
          strokeWidth="9"
        />
        {value !== null && (
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${(v / 100) * c} ${c}`}
          />
        )}
      </svg>
      {mark !== null && (
        <svg viewBox="0 0 100 100" aria-hidden="true" className="absolute inset-0">
          <line
            x1={50 + Math.cos(angle) * 31}
            y1={50 + Math.sin(angle) * 31}
            x2={50 + Math.cos(angle) * 46}
            y2={50 + Math.sin(angle) * 46}
            stroke="#F4F5F7"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
      <div className="relative text-center">{children}</div>
    </div>
  );
}
