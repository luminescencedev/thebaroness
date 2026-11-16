/** Valeur du joueur (barre) contre un repère (trait blanc), par exemple le taux de la méta. */
export function BulletBar({
  value,
  mark,
  max = 100,
  color = "var(--accent)",
  label,
}: {
  value: number | null;
  mark: number | null;
  max?: number;
  color?: string;
  label: string;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className="relative h-2 w-full overflow-hidden rounded-full bg-surface-strong"
    >
      {value !== null && (
        <span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }}
        />
      )}
      {mark !== null && (
        <span
          className="absolute inset-y-[-2px] w-0.5 rounded bg-text"
          style={{ left: `calc(${Math.min(100, (mark / max) * 100)}% - 1px)` }}
        />
      )}
    </div>
  );
}
