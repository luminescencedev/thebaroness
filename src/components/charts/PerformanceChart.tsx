import { useState } from "react";
import { smoothPath } from "./smooth";

interface PerformanceChartProps {
  values: number[];
  /** Libellé secondaire de chaque point (date, héros). */
  hints: string[];
  format: (v: number) => string;
  ariaLabel: string;
  min?: number;
  max: number;
  height?: number;
}

/** Courbe de performance : repère et infobulle suivent le curseur sans délai, sans animation. */
export function PerformanceChart({
  values,
  hints,
  format,
  ariaLabel,
  min = 0,
  max,
  height = 200,
}: PerformanceChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  if (values.length < 2) return null;
  const { line, area } = smoothPath(values, 1000, height, 14, min, max);
  const ticks = [0, 1, 2, 3, 4].map((i) => max - ((max - min) / 4) * i);
  const x = (i: number) => (i / (values.length - 1)) * 100;
  const y = (v: number) =>
    ((height - 14 - ((v - min) / (max - min || 1)) * (height - 28)) / height) * 100;
  const active =
    hover === null ? null : { v: values[hover] ?? 0, hint: hints[hover] ?? "", i: hover };

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
        aria-label={ariaLabel}
        className="relative flex-1 cursor-crosshair"
        style={{ height }}
        onPointerLeave={() => setHover(null)}
        onPointerMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          const r = (e.clientX - box.left) / box.width;
          setHover(Math.min(values.length - 1, Math.max(0, Math.round(r * (values.length - 1)))));
        }}
      >
        <svg
          viewBox={`0 0 1000 ${height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          className="absolute inset-0 size-full"
        >
          <defs>
            <linearGradient id="perf-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#5B4BF0" stopOpacity="0.38" />
              <stop offset="1" stopColor="#5B4BF0" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={ticks.map((_, i) => `M0 ${(i / 4) * (height - 1) + 0.5}H1000`).join("")}
            stroke="rgb(255 255 255 / 0.05)"
            vectorEffect="non-scaling-stroke"
          />
          <path d={area} fill="url(#perf-grad)" />
          <path
            d={line}
            fill="none"
            stroke="#B4ABFF"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {active && (
          <>
            <span
              aria-hidden="true"
              className="absolute top-0 bottom-0 w-px bg-white/[0.12]"
              style={{ left: `${x(active.i)}%` }}
            />
            <span
              aria-hidden="true"
              className="absolute -mt-[5px] -ml-[5px] size-2.5 rounded-full bg-text shadow-[0_0_0_4px_rgb(91_75_240/0.45)]"
              style={{ left: `${x(active.i)}%`, top: `${y(active.v)}%` }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute rounded-[10px] bg-[rgb(20_22_27/0.96)] px-2.5 py-2 whitespace-nowrap shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1),0_10px_30px_-8px_rgb(0_0_0/0.8)]"
              style={{
                left: `${x(active.i)}%`,
                top: `${y(active.v)}%`,
                transform: `translate(${active.i > values.length * 0.7 ? "calc(-100% - 12px)" : "12px"}, -50%)`,
              }}
            >
              <div className="font-semibold tabular-nums">{format(active.v)}</div>
              <div className="text-[11px] text-muted">{active.hint}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
