import { Popover } from "@base-ui/react/popover";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { Kbd, cn } from "@/components/ui";
import { SteamButton } from "@/features/auth/SteamButton";
import { useSession } from "@/features/auth/useSession";
import { MenuIcon, SearchIcon } from "./icons";
import { UserMenu } from "./UserMenu";
import { Wordmark } from "./Wordmark";

const iconBtn =
  "pressable grid size-10 place-items-center rounded-xl border border-[rgb(255_255_255/0.09)] bg-[rgb(255_255_255/0.05)] text-muted hover:text-text";

/** Header de la landing : pleine largeur, transparent, il prend un fond flouté dès qu'on défile. */
export function SiteHeader({ onOpenSearch }: { onOpenSearch: () => void }) {
  const session = useSession();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { to: "/search", label: "Joueurs" },
    { to: "/heroes", label: "Héros" },
    { to: "/leaderboard", label: "Classement" },
    ...(session ? [{ to: "/tracked", label: "Mes suivis" }] : []),
    { to: "/groups", label: "Groupes" },
  ];

  return (
    <header data-scrolled={scrolled} className="site-header sticky top-0 z-40">
      <nav
        aria-label="Navigation principale"
        className="landing-frame flex h-[64px] items-center gap-5 sm:h-[76px] lg:gap-9"
      >
        <Wordmark iconOnly />
        <ul className="hidden items-center gap-1 md:flex lg:gap-2">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} className="site-link">
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Rechercher un joueur"
            className="pressable hover-text hidden h-11 items-center gap-3 rounded-xl border border-[rgb(255_255_255/0.1)] bg-[rgb(255_255_255/0.05)] px-3.5 text-[13px] text-muted md:inline-flex"
          >
            <SearchIcon className="size-4" />
            <span className="hidden lg:inline">Rechercher</span>
            <Kbd aria-hidden="true" className="hidden h-[18px] text-[10px] lg:inline-flex">
              ⌘K
            </Kbd>
          </button>

          <div className="hidden md:block">
            {session ? (
              <UserMenu variant="pill" />
            ) : (
              <SteamButton
                size="sm"
                className="gold-cta h-11 rounded-xl px-5 text-[14px] font-semibold"
                returnTo={pathname}
              >
                Connexion Steam
              </SteamButton>
            )}
          </div>

          {/* Mobile : recherche + menu */}
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Ouvrir la recherche"
            className={cn(iconBtn, "md:hidden")}
          >
            <SearchIcon className="size-[18px]" />
          </button>
          <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Trigger aria-label="Ouvrir la navigation" className={cn(iconBtn, "md:hidden")}>
              <MenuIcon />
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner sideOffset={10} align="end" className="z-50">
                <Popover.Popup className="nav-popup surface-solid w-[min(calc(100vw-24px),320px)] p-2 outline-none">
                  <ul className="grid">
                    {links.map((l) => (
                      <li key={l.to}>
                        <Link
                          to={l.to}
                          onClick={() => setOpen(false)}
                          className="pressable flex min-h-11 items-center rounded-xl px-3.5 text-[15px] font-medium text-muted hover:bg-[rgb(255_255_255/0.07)] hover:text-text"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-1.5 border-t border-divider p-1.5 pt-2.5">
                    {session ? (
                      <UserMenu variant="sidebar" />
                    ) : (
                      <SteamButton className="w-full" returnTo={pathname}>
                        Connexion Steam
                      </SteamButton>
                    )}
                  </div>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        </div>
      </nav>
    </header>
  );
}
