import { useId, useState, type KeyboardEvent } from "react";
import { smoothPath } from "./smooth";

export interface AreaPoint {
  value: number | null;
  /** Ligne principale de l'infobulle (par exemple le héros). */
  title: string;
  /** Lignes secondaires (date, résultat, K D A). */
  lines?: string[];
}

interface AreaChartProps {
  points: AreaPoint[];
  format: (v: number) => string;
  ariaLabel: string;
  min?: number;
  max: number;
  height?: number;
  /** Ligne de référence en tirets (moyenne, 50 %). */
  reference?: { value: number; label: string };
  /** Index du point mis en valeur (meilleure partie), losange. */
  best?: number;
  color?: string;
}

/**
 * Courbe lissée avec dégradé, référence en tirets, repère et infobulle sans délai.
 * Clavier : flèches gauche et droite déplacent le repère, Origine et Fin sautent aux extrémités.
 */
export function AreaChart({
  points,
  format,
  ariaLabel,
  min = 0,
  max,
  height = 220,
  reference,
  best,
  color = "#B4ABFF",
}: AreaChartProps) {
  const gradId = useId();
  const [hover, setHover] = useState<number | null>(null);
  if (points.length < 2) return null;

  // Valeurs absentes : la courbe est interrompue, jamais reliée à travers un trou.
  const n = points.length;
  const runs: { from: number; values: number[] }[] = [];
  points.forEach((p, i) => {
    if (p.value === null) return;
    const last = runs[runs.length - 1];
    if (last && last.from + last.values.length === i) last.values.push(p.value);
    else runs.push({ from: i, values: [p.value] });
  });
  const segments = runs
    .filter((r) => r.values.length >= 2)
    .map((r) => ({
      x0: (r.from / (n - 1)) * 1000,
      ...smoothPath(r.values, ((r.values.length - 1) / (n - 1)) * 1000, height, 14, min, max),
    }));
  const lone = runs.filter((r) => r.values.length === 1);
  const ticks = [0, 1, 2, 3, 4].map((i) => max - ((max - min) / 4) * i);
  const x = (i: number) => (i / (points.length - 1)) * 100;
  const y = (v: number) =>
    ((height - 14 - ((v - min) / (max - min || 1)) * (height - 28)) / height) * 100;
  const active = hover === null ? null : points[hover];

  const onKey = (e: KeyboardEvent) => {
    const last = points.length - 1;
    const cur = hover ?? last;
    const next = { ArrowLeft: cur - 1, ArrowRight: cur + 1, Home: 0, End: last }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    setHover(Math.min(last, Math.max(0, next)));
  };

  return (
    <div className="flex gap-2.5">
      <div
        aria-hidden="true"
        className="flex min-w-[34px] flex-col justify-between text-right text-[11px] text-subtle tabular-nums"
        style={{ height }}
      >
        {ticks.map((t) => (
          <span key={t}>{format(Math.round(t * 10) / 10)}</span>
        ))}
      </div>
      <div
        role="img"
        tabIndex={0}
        aria-label={`${ariaLabel}. Flèches gauche et droite pour parcourir les points.`}
        className="relative flex-1 cursor-crosshair rounded-md"
        style={{ height }}
        onKeyDown={onKey}
        onBlur={() => setHover(null)}
        onPointerLeave={() => setHover(null)}
        onPointerMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          const r = (e.clientX - box.left) / box.width;
          setHover(Math.min(points.length - 1, Math.max(0, Math.round(r * (points.length - 1)))));
        }}
      >
        <svg
          viewBox={`0 0 1000 ${height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          className="absolute inset-0 size-full"
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity="0.34" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={ticks.map((_, i) => `M0 ${(i / 4) * (height - 1) + 0.5}H1000`).join("")}
            stroke="rgb(255 255 255 / 0.05)"
            vectorEffect="non-scaling-stroke"
          />
          {segments.map((sg, i) => (
            <path
              key={`a${i}`}
              d={sg.area}
              transform={`translate(${sg.x0} 0)`}
              fill={`url(#${gradId})`}
            />
          ))}
          {reference && (
            <path
              d={`M0 ${(y(reference.value) / 100) * height}H1000`}
              stroke="rgb(217 219 225 / 0.45)"
              strokeDasharray="5 5"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {segments.map((sg, i) => (
            <path
              key={`l${i}`}
              d={sg.line}
              transform={`translate(${sg.x0} 0)`}
              fill="none"
              stroke={color}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        {reference && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-1 -translate-y-full rounded bg-bg/80 px-1 text-[11px] text-subtle"
            style={{ top: `${y(reference.value)}%` }}
          >
            {reference.label}
          </span>
        )}
        {best !== undefined && points[best]?.value != null && (
          <span
            aria-hidden="true"
            className="absolute -mt-[5px] -ml-[5px] size-2.5 rotate-45 bg-[#F5B14C] shadow-[0_0_0_3px_rgb(245_177_76/0.25)]"
            style={{ left: `${x(best)}%`, top: `${y(points[best]?.value ?? 0)}%` }}
          />
        )}
        {lone.map((r) => (
          <span
            key={`p${r.from}`}
            aria-hidden="true"
            className="absolute -mt-[3px] -ml-[3px] size-1.5 rounded-full"
            style={{ left: `${x(r.from)}%`, top: `${y(r.values[0] ?? 0)}%`, background: color }}
          />
        ))}
        {active && hover !== null && active.value !== null && (
          <>
            <span
              aria-hidden="true"
              className="absolute top-0 bottom-0 w-px bg-white/[0.12]"
              style={{ left: `${x(hover)}%` }}
            />
            <span
              aria-hidden="true"
              className="absolute -mt-[5px] -ml-[5px] size-2.5 rounded-full bg-text shadow-[0_0_0_4px_rgb(91_75_240/0.45)]"
              style={{ left: `${x(hover)}%`, top: `${y(active.value)}%` }}
            />
            <div
              aria-live="polite"
              className="pointer-events-none absolute z-10 rounded-[10px] bg-[rgb(20_22_27/0.96)] px-2.5 py-2 whitespace-nowrap shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1),0_10px_30px_-8px_rgb(0_0_0/0.8)]"
              style={{
                left: `${x(hover)}%`,
                top: `${y(active.value)}%`,
                transform: `translate(${hover > points.length * 0.65 ? "calc(-100% - 12px)" : "12px"}, -50%)`,
              }}
            >
              <div className="font-semibold tabular-nums">{format(active.value)}</div>
              <div className="text-[11px] text-text">{active.title}</div>
              {active.lines?.map((l) => (
                <div key={l} className="text-[11px] text-muted">
                  {l}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
