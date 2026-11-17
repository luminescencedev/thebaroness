import { useState } from "react";
import type { CalendarDay } from "@/lib/stats";

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
const fmt = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

const describe = (d: CalendarDay) => {
  const when = fmt.format(new Date(`${d.date}T12:00:00Z`));
  if (d.count === 0) return `${when} : aucune partie`;
  return `${when} : ${d.count} partie${d.count > 1 ? "s" : ""}, ${d.wins} V et ${d.losses} D`;
};

/** 12 semaines, une case par jour, lundi en premier. Lecture textuelle au survol et au focus. */
export function CalendarHeatmap({ weeks }: { weeks: CalendarDay[][] }) {
  const [info, setInfo] = useState<CalendarDay | null>(null);
  const max = Math.max(...weeks.flat().map((d) => d.count), 1);
  const level = (c: number) => (c === 0 ? 0 : Math.min(4, Math.ceil((c / max) * 4)));
  const alpha = [0.05, 0.28, 0.5, 0.75, 1];
  return (
    <div>
      <div
        className="grid grid-flow-col gap-1 pb-1 sm:gap-1.5"
        style={{
          gridTemplateRows: "repeat(7, auto)",
          gridTemplateColumns: `1rem repeat(${weeks.length}, minmax(0, 1.75rem))`,
        }}
      >
        {DAY_LABELS.map((l, i) => (
          <span
            key={`l${i}`}
            aria-hidden="true"
            className="grid place-items-center text-[11px] text-subtle"
          >
            {i % 2 === 0 ? l : ""}
          </span>
        ))}
        {weeks.map((week) =>
          week.map((d) => (
            <button
              key={d.date}
              type="button"
              aria-label={describe(d)}
              onPointerEnter={() => setInfo(d)}
              onFocus={() => setInfo(d)}
              onPointerLeave={() => setInfo(null)}
              onBlur={() => setInfo(null)}
              className="aspect-square w-full rounded-[5px] outline-offset-2"
              style={{
                background: `color-mix(in srgb, var(--series-2) ${alpha[level(d.count)]! * 100}%, rgb(255 255 255 / 0.03))`,
              }}
            />
          )),
        )}
      </div>
      <p className="mt-2 min-h-4 text-xs text-muted" aria-live="polite">
        {info ? describe(info) : "Survolez une case pour le détail."}
      </p>
    </div>
  );
}
