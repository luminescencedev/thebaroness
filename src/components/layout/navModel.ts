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

/** Fil d'Ariane contextuel. Le dernier élément peut être complété par la page (nom du joueur). */
export function crumbsFor(pathname: string, subjectName?: string): Crumb[] {
  const seg = pathname.split("/").filter(Boolean);
  const [root, id] = seg;
  switch (root) {
    case undefined:
      return [{ label: "Accueil" }];
    case "search":
      return [{ label: "Joueurs" }];
    case "players":
      return [{ label: "Joueurs", to: "/search" }, { label: subjectName ?? "Profil" }];
    case "heroes":
      return id ? [{ label: "Héros", to: "/heroes" }, { label: "Fiche héros" }] : [{ label: "Héros" }];
    case "leaderboard":
      return [{ label: "Classement" }];
    case "matches":
      return [{ label: "Joueurs", to: "/search" }, { label: "Partie" }];
    case "tracked":
      return id
        ? [{ label: "Mes suivis", to: "/tracked" }, { label: subjectName ?? "Suivi" }]
        : [{ label: "Mes suivis" }];
    case "groups":
      return id
        ? [{ label: "Groupes", to: "/groups" }, { label: "Détail" }]
        : [{ label: "Groupes" }];
    case "dev":
      return [{ label: "Baroness UI" }];
    case "login":
    case "auth":
      return [{ label: "Connexion" }];
    default:
      return [{ label: "Page introuvable" }];
  }
}
