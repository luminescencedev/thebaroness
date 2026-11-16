import { useId, useState, type ReactNode } from "react";
import { cn } from "@/components/ui";

const revealed = new Set<string>();

export interface DataTable {
  headers: string[];
  rows: (string | number)[][];
}

interface ChartFrameProps {
  /** Identifiant stable : la révélation de gauche à droite ne joue qu'une fois par identifiant. */
  id: string;
  title: string;
  subtitle?: string;
  /** Résumé lu par les lecteurs d'écran (plage, moyenne, extrêmes). */
  summary: string;
  /** Nombre de points disponibles, et minimum pour tracer. */
  points: number;
  minPoints?: number;
  table?: DataTable;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Cadre commun des graphiques : titre, lecture alternative (« Voir les données »),
 * état honnête quand il y a trop peu de points, révélation unique de gauche à droite.
 */
export function ChartFrame({
  id,
  title,
  subtitle,
  summary,
  points,
  minPoints = 5,
  table,
  actions,
  children,
  className,
}: ChartFrameProps) {
  const [showData, setShowData] = useState(false);
  const headingId = useId();
  const first = !revealed.has(id);
  if (first) revealed.add(id);

  return (
    <section
      aria-labelledby={headingId}
      className={cn("card flex min-w-0 flex-col gap-4 p-5", className)}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col">
          <h2 id={headingId} className="text-[15px]">
            {title}
          </h2>
          {subtitle && <span className="text-xs text-subtle">{subtitle}</span>}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {table && points >= minPoints && (
            <button
              type="button"
              aria-pressed={showData}
              onClick={() => setShowData((v) => !v)}
              className="pressable hover-text rounded-md px-2 py-1 text-xs text-subtle underline-offset-4 hover:underline"
            >
              {showData ? "Voir le graphique" : "Voir les données"}
            </button>
          )}
        </div>
      </header>

      {points < minPoints ? (
        <p className="rounded-xl border border-dashed border-border-strong px-4 py-8 text-center text-[13px] text-muted">
          Pas assez de parties pour tracer ce graphique ({points} sur {minPoints} minimum).
        </p>
      ) : showData && table ? (
        <div className="max-h-72 overflow-auto rounded-xl border border-border">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">{summary}</caption>
            <thead className="sticky top-0 bg-[#0d0e11] text-subtle">
              <tr>
                {table.headers.map((h) => (
                  <th key={h} scope="col" className="px-3 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i} className="border-t border-border">
                  {r.map((c, j) => (
                    <td key={j} className="px-3 py-1.5 whitespace-nowrap text-muted tabular-nums">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={first ? "chart-reveal" : undefined}>
          <p className="sr-only">{summary}</p>
          {children}
        </div>
      )}
    </section>
  );
}
