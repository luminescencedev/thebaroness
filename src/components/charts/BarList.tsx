import type { ReactNode } from "react";

export interface BarItem {
  key: string;
  label: ReactNode;
  value: number;
  /** Texte affiché à droite de la barre. */
  display: string;
  color?: string;
}

/** Barres horizontales accessibles (liste), valeur toujours écrite en toutes lettres. */
export function BarList({ items, max }: { items: BarItem[]; max?: number }) {
  const top = max ?? Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li
          key={item.key}
          className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 text-sm"
        >
          <span className="flex min-w-0 items-center gap-2 truncate text-text">{item.label}</span>
          <span className="h-2 overflow-hidden rounded-full bg-surface-strong" aria-hidden="true">
            <span
              className="block h-full rounded-full"
              style={{
                width: `${Math.max(2, (item.value / top) * 100)}%`,
                backgroundColor: item.color ?? "var(--accent)",
              }}
            />
          </span>
          <span className="w-20 text-right text-muted">{item.display}</span>
        </li>
      ))}
    </ul>
  );
}
