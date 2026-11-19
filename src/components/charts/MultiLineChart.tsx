import { useId, useState } from "react";

export interface Series {
  key: string;
  label: string;
  color: string;
  /**
   * `segment` : deux points consécutifs de segments différents ne sont JAMAIS reliés (par exemple deux saisons
   * classées dont les rangs ne sont pas comparables). Sans `segment`, une seule courbe continue.
   */
  points: { at: number; value: number; segment?: number | string }[];
}

/** Repère vertical (par exemple le début d'une saison classée). */
export interface ChartMarker {
  at: number;
  label: string;
}

interface MultiLineChartProps {
  series: Series[];
  title: string;
  format?: (v: number) => string;
  height?: number;
  formatDate?: (t: number) => string;
  /** Bornes de l'axe vertical (par exemple l'échelle des rangs, 0 à 72) : l'axe ne dépasse jamais ce que la donnée peut valoir. */
  min?: number;
  max?: number;
  /** Repères verticaux datés, dans la plage affichée seulement. */
  markers?: ChartMarker[];
}

const W = 720;
const KEY_STEPS = 24;
const PAD = { top: 12, right: 14, bottom: 24, left: 104 };

/** Courbes comparées dans le temps. Survol : valeur de chaque série à la date la plus proche. */
export function MultiLineChart({
  series,
  title,
  format = (v) => String(v),
  height = 260,
  min,
  max,
  markers = [],
  formatDate = (t) => new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
}: MultiLineChartProps) {
  const [hoverX, setHoverX] = useState<number | null>(null);
  const liveId = useId();
  const all = series.flatMap((s) => s.points);
  if (all.length < 2) return null;

  const t0 = Math.min(...all.map((p) => p.at));
  const t1 = Math.max(...all.map((p) => p.at));
  const lo = Math.max(
    min ?? Number.NEGATIVE_INFINITY,
    Math.floor(Math.min(...all.map((p) => p.value)) - 1),
  );
  const hi = Math.min(
    max ?? Number.POSITIVE_INFINITY,
    Math.ceil(Math.max(...all.map((p) => p.value)) + 1),
  );
  const innerW = W - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;
  const x = (t: number) => PAD.left + ((t - t0) / (t1 - t0 || 1)) * innerW;
  const y = (v: number) => PAD.top + (1 - (v - lo) / (hi - lo || 1)) * innerH;
  const ticks = [lo, Math.round((lo + hi) / 2), hi];

  const hoverT = hoverX === null ? null : t0 + ((hoverX - PAD.left) / innerW) * (t1 - t0);
  const nearest = (s: Series) =>
    hoverT === null
      ? null
      : s.points.reduce<Series["points"][number] | null>(
          (b, p) => (b === null || Math.abs(p.at - hoverT) < Math.abs(b.at - hoverT) ? p : b),
          null,
        );

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        role="img"
        aria-label={title}
        className="w-full overflow-visible"
        tabIndex={0}
        aria-describedby={liveId}
        onPointerLeave={() => setHoverX(null)}
        onFocus={() => setHoverX((cur) => cur ?? W - PAD.right)}
        onBlur={() => setHoverX(null)}
        onKeyDown={(e) => {
          const step = innerW / KEY_STEPS;
          const to = (x: number) => Math.min(W - PAD.right, Math.max(PAD.left, x));
          if (e.key === "ArrowRight") setHoverX((cur) => to((cur ?? PAD.left) + step));
          else if (e.key === "ArrowLeft") setHoverX((cur) => to((cur ?? W - PAD.right) - step));
          else if (e.key === "Home") setHoverX(PAD.left);
          else if (e.key === "End") setHoverX(W - PAD.right);
          else if (e.key === "Escape") setHoverX(null);
          else return;
          e.preventDefault();
        }}
        onPointerMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          setHoverX(
            Math.min(W - PAD.right, Math.max(PAD.left, ((e.clientX - box.left) / box.width) * W)),
          );
        }}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--border)" />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--subtle)">
              {format(t)}
            </text>
          </g>
        ))}
        {markers
          .filter((m) => m.at > t0 && m.at < t1)
          .map((m) => (
            <g key={`${m.at}-${m.label}`} aria-hidden="true">
              <line
                x1={x(m.at)}
                x2={x(m.at)}
                y1={PAD.top}
                y2={PAD.top + innerH}
                stroke="var(--border-strong)"
                strokeDasharray="3 4"
              />
              <text x={x(m.at) + 4} y={PAD.top + 10} fontSize="10" fill="var(--subtle)">
                {m.label}
              </text>
            </g>
          ))}
        {series.map((s) => (
          <path
            key={s.key}
            d={s.points
              .map((p, i) => {
                const cut = i === 0 || p.segment !== s.points[i - 1]?.segment;
                return `${cut ? "M" : "L"}${x(p.at).toFixed(1)},${y(p.value).toFixed(1)}`;
              })
              .join(" ")}
            fill="none"
            stroke={s.color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {/* Un segment d'un seul point n'a pas de trait : on le montre quand même. */}
        {series.flatMap((s) =>
          s.points.flatMap((p, i) =>
            p.segment !== s.points[i - 1]?.segment && p.segment !== s.points[i + 1]?.segment ? (
              <circle
                key={`${s.key}-${i}`}
                cx={x(p.at)}
                cy={y(p.value)}
                r="2.5"
                fill={s.color}
                aria-hidden="true"
              />
            ) : (
              []
            ),
          ),
        )}
        {hoverX !== null && (
          <g>
            <line
              x1={hoverX}
              x2={hoverX}
              y1={PAD.top}
              y2={PAD.top + innerH}
              stroke="var(--border-strong)"
            />
            {series.map((s) => {
              const p = nearest(s);
              return p ? (
                <circle
                  key={s.key}
                  cx={x(p.at)}
                  cy={y(p.value)}
                  r="4"
                  fill={s.color}
                  stroke="var(--bg)"
                  strokeWidth="2"
                />
              ) : null;
            })}
          </g>
        )}
        <text x={PAD.left} y={height - 4} fontSize="11" fill="var(--subtle)">
          {formatDate(t0)}
        </text>
        <text x={W - PAD.right} y={height - 4} textAnchor="end" fontSize="11" fill="var(--subtle)">
          {formatDate(t1)}
        </text>
      </svg>
      {/* Équivalent texte du survol : annoncé aux flèches, sans souris. */}
      <p id={liveId} className="sr-only" aria-live="polite">
        {hoverT === null
          ? "Flèches gauche et droite : parcourir les dates ; Début et Fin : aller aux extrémités."
          : `${formatDate(hoverT)} : ${series
              .flatMap((s) => {
                const p = nearest(s);
                return p ? [`${s.label} ${format(p.value)}`] : [];
              })
              .join(", ")}`}
      </p>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted">
        {series.map((s) => {
          const p = nearest(s);
          return (
            <li key={s.key} className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: s.color }}
                aria-hidden="true"
              />
              {s.label}
              {p && <span className="text-text">{format(p.value)}</span>}
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
