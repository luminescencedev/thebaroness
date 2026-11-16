import { useEffect } from "react";

const SUFFIX = "The Baroness";

/** Titre d'onglet au format « Mes suivis · The Baroness ». */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} · ${SUFFIX}`;
  }, [title]);
}
