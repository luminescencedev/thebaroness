import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router";
import { Kbd, cn } from "@/components/ui";
import { SteamButton } from "@/features/auth/SteamButton";
import { useSession } from "@/features/auth/useSession";
import { MobileMenu } from "./MobileMenu";
import { UserMenu } from "./UserMenu";
import { Wordmark } from "./Wordmark";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-4">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-5">
      <path d="M4 8h16M4 16h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Nav({ onOpenSearch }: { onOpenSearch: () => void }) {
  const session = useSession();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
  ];

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-4">
      <div
        data-scrolled={scrolled}
        className={cn(
          "mx-auto flex h-14 max-w-5xl items-center gap-2 rounded-full border bg-[rgb(10_11_14/0.72)] pr-2 pl-5 backdrop-blur-xl transition-[border-color,box-shadow] duration-200 sm:gap-4",
          scrolled
            ? "border-border-strong shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_12px_40px_rgb(0_0_0/0.5)]"
            : "border-border shadow-[inset_0_1px_0_rgb(255_255_255/0.04),0_8px_30px_rgb(0_0_0/0.3)]",
        )}
      >
        <Wordmark />

        <nav
          aria-label="Navigation principale"
          className="ml-2 hidden items-center gap-0.5 md:flex"
        >
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "pressable hover-text rounded-full px-3.5 py-1.5 text-sm",
                  isActive ? "bg-surface-strong text-text" : "text-muted",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Rechercher un joueur"
            className="pressable hover-text inline-flex h-9 items-center gap-2 rounded-full border border-border-strong bg-surface px-3 text-sm text-muted"
          >
            <SearchIcon />
            <span className="hidden lg:inline">Rechercher</span>
            <Kbd aria-hidden="true" className="hidden lg:inline-flex">
              ⌘K
            </Kbd>
          </button>

          <div className="hidden md:block">
            {session ? (
              <UserMenu />
            ) : (
              <SteamButton size="sm" className="h-9 rounded-full" returnTo={pathname}>
                Connexion Steam
              </SteamButton>
            )}
          </div>

          <button
            type="button"
            aria-label="Ouvrir le menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="pressable hover-text grid size-9 place-items-center rounded-full border border-border-strong bg-surface text-muted md:hidden"
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      <MobileMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        links={links}
        currentPath={pathname}
        onSearch={onOpenSearch}
      />
    </header>
  );
}
