import { cn } from "./cn";

interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: "sm" | "md";
  className?: string;
}

/** Segments à largeur égale, indicateur qui glisse (transform, 220 ms ease-in-out). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = "md",
  className,
}: SegmentedProps<T>) {
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={(e) => {
        const step =
          e.key === "ArrowRight" || e.key === "ArrowDown"
            ? 1
            : e.key === "ArrowLeft" || e.key === "ArrowUp"
              ? -1
              : 0;
        if (!step) return;
        e.preventDefault();
        const next = options[(index + step + options.length) % options.length];
        if (!next) return;
        onChange(next.value);
        // Le focus suit la sélection (flèches) : aucune animation propre au clavier.
        const radios = e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]');
        radios[options.indexOf(next)]?.focus();
      }}
      className={cn(
        "relative inline-grid auto-cols-fr grid-flow-col rounded-[10px] bg-surface p-[3px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-[3px] bottom-[3px] left-[3px] rounded-[7px] bg-white/[0.09] shadow-[0_1px_2px_rgb(0_0_0/0.4)] transition-transform duration-[220ms] ease-[var(--ease-in-out)] motion-reduce:transition-none",
        )}
        style={{
          width: `calc((100% - 6px) / ${options.length})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          tabIndex={o.value === value ? 0 : -1}
          onClick={() => onChange(o.value)}
          className={cn(
            "pressable hover-text relative z-10 min-w-0 rounded-[7px] px-2.5 font-medium whitespace-nowrap",
            size === "sm" ? "h-7 text-xs" : "h-[30px] text-[13px]",
            o.value === value ? "text-text" : "text-subtle",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
