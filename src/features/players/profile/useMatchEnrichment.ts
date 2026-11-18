import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { getMatch, type MatchSummary } from "@/api";
import { useItemCatalog } from "@/features/items/hooks";
import { enrichMatch } from "@/lib/matchModel";

/** Vrai dès que l'élément approche de l'écran (une seule fois). Sans IntersectionObserver : vrai. */
export function useNearViewport<T extends Element>(): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(typeof IntersectionObserver === "undefined");
  useEffect(() => {
    const el = ref.current;
    if (near || !el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "240px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);
  return [ref, near];
}

/** Vrai quand la fenêtre est assez large pour afficher les colonnes détaillées sans ouvrir la ligne. */
export function useWideScreen(query = "(min-width: 768px)"): boolean {
  const [wide, setWide] = useState(() => window.matchMedia?.(query).matches ?? true);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return;
    const on = () => setWide(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return wide;
}

/**
 * Détail d'une partie à la demande : une requête par partie, mise en cache (clé partagée avec la page de la
 * partie). `enabled` est piloté par la visibilité de la ligne et son ouverture, jamais par le rendu seul.
 */
export function useMatchEnrichment(
  match: MatchSummary,
  ownerSteamId: string | undefined,
  enabled: boolean,
) {
  const q = useQuery({
    queryKey: ["matches", match.matchId],
    queryFn: ({ signal }) => getMatch(match.matchId, signal),
    staleTime: 10 * 60_000,
    enabled,
  });
  // Catalogue chargé une fois, dès qu'un détail est demandé ; en échec, les objets restent « n/d ».
  const catalog = useItemCatalog(enabled);
  const data = useMemo(
    () => (q.data ? enrichMatch(match, q.data.match, ownerSteamId, catalog.data ?? null) : null),
    [q.data, match, ownerSteamId, catalog.data],
  );
  return {
    data,
    isPending: enabled && q.isPending,
    isError: q.isError,
    refetch: q.refetch,
    /** Le détail est là mais le catalogue des objets arrive encore : le build n'est pas « n/d », il charge. */
    buildPending: enabled && catalog.isPending,
  };
}
