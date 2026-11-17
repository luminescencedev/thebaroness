import { Fragment } from "react";
import { Link } from "react-router";
import { IconButton, cn } from "@/components/ui";
import { MenuIcon, SearchIcon, SlashIcon } from "./icons";
import { useCrumbs } from "./navModel";

interface TopbarProps {
  onOpenMenu: () => void;
  onOpenSearch: () => void;
}

/** Header contextuel du panneau : fil d'Ariane, recherche, menu mobile. */
export function Topbar({ onOpenMenu, onOpenSearch }: TopbarProps) {
  const crumbs = useCrumbs();
  const hasCrumbs = crumbs.length > 1;

  return (
    <header className={cn("app-topbar", !hasCrumbs && "lg:hidden")}>
      <div className="app-topbar-in">
        <IconButton label="Ouvrir le menu" onClick={onOpenMenu} className="-ml-2 lg:hidden">
          <MenuIcon />
        </IconButton>

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
