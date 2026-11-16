import { useEffect, useState } from "react";
import { BrandMark } from "./BrandMark";

interface BrandLoaderProps {
  /** Message de contexte, par exemple « Le Doorman monte les parties de Corvid ». */
  message?: string;
  /** Délai avant affichage : rien tant que l'attente reste courte. */
  delay?: number;
}

/** Chargement de page : la marque en grand, affichée seulement si l'attente dépasse 300 ms. */
export function BrandLoader({
  message = "Le Doorman prépare la page",
  delay = 300,
}: BrandLoaderProps) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setVisible(true), delay);
    return () => window.clearTimeout(id);
  }, [delay]);

  return (
    <div role="status" aria-live="polite" className="grid min-h-[50dvh] place-items-center">
      {visible && (
        <div className="flex flex-col items-center gap-5 text-center">
          <BrandMark size={96} loading />
          <p className="text-sm text-muted">{message}</p>
        </div>
      )}
      {!visible && <span className="sr-only">{message}</span>}
    </div>
  );
}
