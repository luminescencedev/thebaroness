import { useLocation } from "react-router";
import { useNavLabel } from "./navContext";
import type { ComponentType, SVGProps } from "react";
import { BookmarkIcon, ChartIcon, HomeIcon, PersonIcon, SparkIcon, UsersIcon } from "./icons";

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Préfixes de chemin qui rendent l'entrée active. */
  match: string[];
}

export const exploreItems: NavItem[] = [
  { to: "/", label: "Accueil", icon: HomeIcon, match: ["/"] },
  { to: "/search", label: "Joueurs", icon: PersonIcon, match: ["/search", "/players"] },
  { to: "/heroes", label: "Héros", icon: SparkIcon, match: ["/heroes"] },
  { to: "/leaderboard", label: "Classement", icon: ChartIcon, match: ["/leaderboard"] },
];

export const spaceItems: NavItem[] = [
  { to: "/tracked", label: "Mes suivis", icon: BookmarkIcon, match: ["/tracked"] },
  { to: "/groups", label: "Groupes", icon: UsersIcon, match: ["/groups"] },
];

export function isActive(item: NavItem, pathname: string): boolean {
  return item.match.some((m) => (m === "/" ? pathname === "/" : pathname.startsWith(m)));
}

export interface Crumb {
  label: string;
  to?: string;
}

/**
 * Fil d'Ariane contextuel : seulement une vraie hiérarchie (parent > enfant). Les pages de premier niveau
 * renvoient une liste vide : le shell n'affiche alors aucune pastille. `label` est le titre de la page
 * (nom du joueur, du héros, du groupe) publié par useDocumentTitle ; avant son chargement, un repli neutre.
 */
export function crumbsFor(pathname: string, label?: string | null): Crumb[] {
  const [root, id] = pathname.split("/").filter(Boolean);
  if (!id) return [];
  const leaf = (rootLabel: string, fallback: string) =>
    label && label !== rootLabel ? label : fallback;
  switch (root) {
    case "players":
      return [{ label: "Joueurs", to: "/search" }, { label: leaf("Profil public", "Profil") }];
    case "heroes":
      return [{ label: "Héros", to: "/heroes" }, { label: leaf("Héros", "Fiche héros") }];
    case "matches":
      return [{ label: "Parties" }, { label: id }];
    case "tracked":
      return [
        { label: "Mes suivis", to: "/tracked" },
        { label: leaf("Détail d'un suivi", "Suivi") },
      ];
    case "groups":
      return [{ label: "Groupes", to: "/groups" }, { label: leaf("Groupe", "Détail") }];
    default:
      return [];
  }
}

/** Hook partagé par le shell (réservation d'espace) et la pastille (contenu) : une seule source de vérité. */
export function useCrumbs(): Crumb[] {
  const { pathname } = useLocation();
  const label = useNavLabel();
  return crumbsFor(pathname, label);
}
