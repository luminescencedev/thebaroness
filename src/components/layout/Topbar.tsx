import { Fragment } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { IconButton, cn } from "@/components/ui";
import { BackIcon, MenuIcon, SearchIcon, SidebarIcon, SlashIcon } from "./icons";
import { useCrumbs } from "./navModel";

interface TopbarProps {
  onOpenMenu: () => void;
  onOpenSearch: () => void;
  /** Sidebar repliée (bureau) : le bouton d'ouverture apparaît dans le panneau. */
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

/** Header contextuel du panneau : fil d'Ariane, recherche, menu mobile. */
export function Topbar({
  onOpenMenu,
  onOpenSearch,
  sidebarCollapsed,
  onToggleSidebar,
}: TopbarProps) {
  const crumbs = useCrumbs();
  const hasCrumbs = crumbs.length > 1;
  const navigate = useNavigate();
  const location = useLocation();
  // Retour : l'entrée précédente de l'historique, sinon le parent du fil d'Ariane, sinon l'accueil.
  const parent = crumbs.length > 1 ? crumbs[crumbs.length - 2]?.to : undefined;
  const back = () => {
    // La première entrée d'une session porte la clé "default" : rien avant elle dans l'application.
    if (location.key !== "default") void navigate(-1);
    else void navigate(parent ?? "/");
  };

  return (
    <header className={cn("app-topbar", !hasCrumbs && !sidebarCollapsed && "lg:hidden")}>
      <div className="app-topbar-in">
        <IconButton label="Ouvrir le menu" onClick={onOpenMenu} className="-ml-2 lg:hidden">
          <MenuIcon />
        </IconButton>

        {sidebarCollapsed && (
          <IconButton
            label="Afficher la barre latérale"
            onClick={onToggleSidebar}
            className="hidden bg-[#141518]/75 backdrop-blur-[12px] lg:grid"
          >
            <SidebarIcon />
          </IconButton>
        )}

        {hasCrumbs && (
          <IconButton
            label="Retour à la page précédente"
            onClick={back}
            className="bg-[#141518]/75 backdrop-blur-[12px]"
          >
            <BackIcon />
          </IconButton>
        )}

        {hasCrumbs && (
          <nav
            aria-label="Fil d'Ariane"
            className="min-w-0 rounded-full bg-[#141518]/75 px-3 py-1.5 backdrop-blur-[12px]"
          >
            <ol className="flex min-w-0 items-center gap-1.5 text-[12.5px] text-subtle">
              {crumbs.map((c, i) => {
                const last = i === crumbs.length - 1;
                return (
                  <Fragment key={c.label}>
                    {i > 0 && <SlashIcon className="hidden size-3.5 text-[#4b4d54] sm:block" />}
                    <li
                      className={cn(
                        "min-w-0",
                        last ? "truncate font-semibold text-text" : "hidden sm:block",
                      )}
                    >
                      {c.to && !last ? (
                        <Link to={c.to} className="hover-text pressable rounded-md">
                          {c.label}
                        </Link>
                      ) : (
                        <span aria-current={last ? "page" : undefined}>{c.label}</span>
                      )}
                    </li>
                  </Fragment>
                );
              })}
            </ol>
          </nav>
        )}

        <IconButton
          label="Ouvrir la recherche"
          onClick={onOpenSearch}
          className="ml-auto lg:hidden"
        >
          <SearchIcon className="size-[18px]" />
        </IconButton>
      </div>
    </header>
  );
}
