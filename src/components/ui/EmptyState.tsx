import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

export interface EmptyStateProps extends Omit<ComponentProps<"div">, "title"> {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-card border border-dashed border-border-strong px-6 py-12 text-center",
        className,
      )}
      {...props}
    >
      <p className="text-base font-semibold tracking-[-0.02em] text-text">{title}</p>
      {description && <p className="max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
