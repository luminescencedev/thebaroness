import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ReactNode } from "react";
import { cn } from "./cn";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** false pour une action clavier fréquente (palette) : aucune animation. */
  animated?: boolean;
  className?: string;
  /** Position haute (palette) au lieu du centre. */
  top?: boolean;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  animated = true,
  className,
  top = false,
}: DialogProps) {
  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop
          className={cn("fixed inset-0 z-50 bg-black/60", animated && "dialog-backdrop")}
        />
        <BaseDialog.Viewport
          className={cn(
            "fixed inset-0 z-50 grid justify-items-center overflow-y-auto p-4",
            top ? "items-start pt-[12vh]" : "items-center",
          )}
        >
          <BaseDialog.Popup
            className={cn(
              "card w-full max-w-md bg-[#0d0e11] p-6 shadow-2xl",
              animated && "dialog-popup",
              className,
            )}
          >
            <BaseDialog.Title className="text-lg">{title}</BaseDialog.Title>
            {description ? (
              <BaseDialog.Description className="mt-1.5 text-sm text-muted">
                {description}
              </BaseDialog.Description>
            ) : null}
            {children}
          </BaseDialog.Popup>
        </BaseDialog.Viewport>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
