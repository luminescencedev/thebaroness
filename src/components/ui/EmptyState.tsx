import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

export interface EmptyStateProps extends Omit<ComponentProps<"div">, "title"> {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: "search" | "plus" | "alert" | "none";
}

const icons = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16h.01" />
    </>
  ),
};

/** État vide : icône, message, et toujours l'action suivante quand il y en a une. */
export function EmptyState({
  title,
  description,
  action,
  icon = "none",
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn("card flex flex-col items-center gap-3 px-6 py-14 text-center", className)}
      {...props}
    >
      {icon !== "none" && (
        <span
          aria-hidden="true"
          className="grid size-10 place-items-center rounded-xl bg-surface shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke={icon === "alert" ? "var(--loss)" : "var(--muted)"}
            strokeWidth="2"
            strokeLinecap="round"
            className="size-[18px]"
          >
            {icons[icon]}
          </svg>
        </span>
      )}
      <h2 className="text-base font-medium tracking-[-0.01em] text-text">{title}</h2>
      {description && <p className="max-w-[320px] text-[13px] text-muted">{description}</p>}
      {action && <div className="mt-1 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
