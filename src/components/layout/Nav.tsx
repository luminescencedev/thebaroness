import { NavLink, useNavigate } from "react-router";
import { useSession } from "@/features/auth/useSession";
import { Kbd, buttonStyles, cn } from "@/components/ui";

import { Wordmark } from "./Wordmark";

const links = [
  { to: "/search", label: "Joueurs" },
  { to: "/heroes", label: "Héros" },
  { to: "/leaderboard", label: "Classement" },
];

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-4">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Nav() {
  const session = useSession();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:gap-6 sm:px-6">
        <Wordmark />

        <nav aria-label="Navigation principale" className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "pressable hover-text rounded-md px-3 py-1.5 text-sm",
                  isActive ? "text-text" : "text-muted",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => void navigate("/search")}
            aria-label="Rechercher un joueur"
            className="pressable hover-text inline-flex h-9 items-center gap-2 rounded-control border border-border-strong bg-surface px-3 text-sm text-muted"
          >
            <SearchIcon />
            <span className="hidden sm:inline">Rechercher</span>
            <Kbd aria-hidden="true">⌘K</Kbd>
          </button>

          {session ? (
            <span className="max-w-[10rem] truncate text-sm text-muted sm:max-w-[16rem]">
              {session.user.email}
            </span>
          ) : (
            <>
              <NavLink
                to="/login"
                className="pressable hover-text rounded-md px-2 py-1.5 text-sm text-muted"
              >
                Connexion
              </NavLink>
              <NavLink
                to="/register"
                className={cn(buttonStyles("primary", "sm"), "hidden sm:inline-flex")}
              >
                Créer un compte
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
