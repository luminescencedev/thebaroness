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
  /** Titre lisible par les lecteurs d'écran seulement (palette). */
  hideTitle?: boolean;
  /** false : aucune marge interne ni largeur par défaut (palette). */
  padded?: boolean;
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
  hideTitle = false,
  padded = true,
}: DialogProps) {
  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop
          className={cn(
            "fixed inset-0 z-50 bg-[rgb(3_4_6/0.6)]",
            top && "backdrop-blur-[6px]",
            animated && "dialog-backdrop",
          )}
        />
        <BaseDialog.Viewport
          className={cn(
            "fixed inset-0 z-50 grid justify-items-center overflow-y-auto p-4",
            top ? "items-start pt-[12vh]" : "items-center",
          )}
        >
          <BaseDialog.Popup
            className={cn(
              "surface-solid w-full",
              padded && "p-6",
              !className?.includes("max-w-") && "max-w-md",
              animated && "dialog-popup",
              className,
            )}
          >
            <BaseDialog.Title className={hideTitle ? "sr-only" : "text-lg"}>
              {title}
            </BaseDialog.Title>
            {description ? (
              <BaseDialog.Description
                className={hideTitle ? "sr-only" : "mt-1.5 text-sm text-muted"}
              >
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
