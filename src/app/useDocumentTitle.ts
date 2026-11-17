import { useEffect } from "react";
import { setNavLabel } from "@/components/layout/navContext";

const SUFFIX = "The Baroness";

/** Titre d'onglet « Mes suivis · The Baroness ». L'accueil garde le titre complet du site. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title =
      title === "Accueil" ? "The Baroness · Deadlock Tracker" : `${title} · ${SUFFIX}`;
    setNavLabel(title);
    return () => setNavLabel(null);
  }, [title]);
}
