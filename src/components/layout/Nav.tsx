import { NavLink } from "react-router";
import { useSession } from "@/features/auth/useSession";
import { Kbd, buttonStyles, cn } from "@/components/ui";

import { Wordmark } from "./Wordmark";

const publicLinks = [{ to: "/search", label: "Joueurs" }];
const privateLinks = [{ to: "/tracked", label: "Mes suivis" }];

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-4">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Nav({ onOpenSearch }: { onOpenSearch: () => void }) {
  const session = useSession();
  const links = session ? [...publicLinks, ...privateLinks] : publicLinks;

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-4">
      <div className="mx-auto flex h-12 max-w-4xl items-center gap-3 rounded-full border border-border-strong bg-[rgb(12_13_16/0.72)] pr-1.5 pl-5 shadow-[inset_0_1px_0_rgb(255_255_255/0.05),0_8px_30px_rgb(0_0_0/0.35)] backdrop-blur-xl sm:gap-5">
        <Wordmark />

        <nav aria-label="Navigation principale" className="hidden items-center gap-1 sm:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "pressable hover-text rounded-full px-3 py-1.5 text-sm",
                  isActive ? "bg-surface-strong text-text" : "text-muted",
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
            onClick={onOpenSearch}
            aria-label="Rechercher un joueur"
            className="pressable hover-text inline-flex h-9 items-center gap-2 rounded-full border border-border-strong bg-surface px-3 text-sm text-muted"
          >
            <SearchIcon />
            <span className="hidden sm:inline">Rechercher</span>
            <Kbd aria-hidden="true" className="hidden sm:inline-flex">
              ⌘K
            </Kbd>
          </button>

          {session ? (
            <span className="max-w-[9rem] truncate pr-3 text-sm text-muted sm:max-w-[14rem]">
              {session.user.email}
            </span>
          ) : (
            <>
              <NavLink
                to="/login"
                className="pressable hover-text rounded-full px-3 py-1.5 text-sm text-muted"
              >
                Connexion
              </NavLink>
              <NavLink
                to="/register"
                className={cn(buttonStyles("primary", "sm"), "hidden rounded-full sm:inline-flex")}
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
