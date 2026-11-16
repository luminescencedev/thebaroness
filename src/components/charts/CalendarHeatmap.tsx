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
      <div className="flex gap-1.5">
        <div aria-hidden="true" className="mr-1 grid grid-rows-7 gap-1.5 text-[10px] text-subtle">
          {DAY_LABELS.map((l, i) => (
            <span key={i} className="grid h-5 place-items-center">
              {i % 2 === 0 ? l : ""}
            </span>
          ))}
        </div>
        {weeks.map((week, w) => (
          <div key={w} className="grid grid-rows-7 gap-1.5">
            {week.map((d) => (
              <button
                key={d.date}
                type="button"
                aria-label={describe(d)}
                onPointerEnter={() => setInfo(d)}
                onFocus={() => setInfo(d)}
                onPointerLeave={() => setInfo(null)}
                onBlur={() => setInfo(null)}
                className="size-5 rounded-[5px] outline-offset-2"
                style={{
                  background: `color-mix(in srgb, var(--series-2) ${alpha[level(d.count)]! * 100}%, rgb(255 255 255 / 0.03))`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="mt-2 min-h-4 text-xs text-muted" aria-live="polite">
        {info ? describe(info) : "Survolez une case pour le détail."}
      </p>
    </div>
  );
}
