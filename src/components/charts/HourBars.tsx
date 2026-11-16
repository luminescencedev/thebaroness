/** 24 barres : parties par heure (fuseau Europe/Paris), pic mis en avant. */
export function HourBars({ counts, peak }: { counts: number[]; peak: number | null }) {
  const max = Math.max(...counts, 1);
  return (
    <div>
      <ul className="flex h-24 items-end gap-0.5" aria-label="Parties par heure">
        {counts.map((c, h) => (
          <li
            key={h}
            className="flex h-full flex-1 items-end"
            title={`${h} h : ${c} partie${c > 1 ? "s" : ""}`}
          >
            <span
              className="w-full rounded-t-[3px]"
              style={{
                height: `${Math.max(c ? 6 : 2, (c / max) * 100)}%`,
                background:
                  peak === h
                    ? "var(--series-1)"
                    : "color-mix(in srgb, var(--series-2) 55%, transparent)",
              }}
            />
            <span className="sr-only">
              {h} h : {c}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-1.5 flex justify-between text-[10px] text-subtle" aria-hidden="true">
        {[0, 6, 12, 18, 23].map((h) => (
          <span key={h}>{h} h</span>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">
        {peak === null ? "Aucune partie." : `Pic d'activité : ${peak} h (heure de Paris).`}
      </p>
    </div>
  );
}
