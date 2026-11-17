import { useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { Kbd, cn } from "@/components/ui";
import { SteamButton } from "@/features/auth/SteamButton";
import { useSession } from "@/features/auth/useSession";
import { SearchIcon } from "./icons";
import { exploreItems, isActive, spaceItems, type NavItem } from "./navModel";
import { UserMenu } from "./UserMenu";
import { Wordmark } from "./Wordmark";

/** Un groupe de liens avec un indicateur actif unique qui glisse (transform seulement). */
function NavGroup({
  label,
  items,
  pathname,
  onNavigate,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  const wrap = useRef<HTMLUListElement>(null);
  const [offset, setOffset] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const activeIndex = items.findIndex((i) => isActive(i, pathname));

  useLayoutEffect(() => {
    const el = wrap.current?.querySelectorAll("li")[activeIndex];
    setOffset(el ? (el as HTMLElement).offsetTop : null);
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [activeIndex]);

  return (
    <nav aria-label={label} className="mb-5">
      <p className="side-label">{label}</p>
      <ul ref={wrap} className="relative flex flex-col gap-0.5">
        <span
          aria-hidden="true"
          className="side-indicator"
          data-ready={ready}
          style={{
            transform: `translateY(${offset ?? 0}px)`,
            opacity: offset === null ? 0 : 1,
          }}
        />
        {items.map((item) => {
          const active = isActive(item, pathname);
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className="side-link"
              >
                <item.icon />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

interface SidebarNavProps {
  onOpenSearch: () => void;
  /** Fermeture du drawer mobile après navigation. */
  onNavigate?: () => void;
}

/** Contenu de la sidebar, partagé entre le rail desktop et le drawer mobile. */
export function SidebarNav({ onOpenSearch, onNavigate }: SidebarNavProps) {
  const session = useSession();
  const { pathname } = useLocation();
  // La page de connexion porte déjà l'appel à l'action : pas de doublon dans la sidebar.
  const onLogin = pathname.startsWith("/login") || pathname.startsWith("/auth/");

  return (
    <div className="flex h-full min-h-0 flex-col px-3.5 pt-5 pb-4">
      <div className="px-2 pb-5">
        <Wordmark />
      </div>

      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          onOpenSearch();
        }}
        aria-label="Rechercher un joueur"
        className="pressable mb-6 flex h-9 items-center gap-2.5 rounded-[11px] border border-[rgb(255_255_255/0.075)] bg-[rgb(255_255_255/0.033)] px-3 text-left text-[12.5px] text-muted hover:border-border-strong hover:bg-[rgb(255_255_255/0.06)]"
      >
        <SearchIcon className="size-[15px]" />
        <span className="flex-1">Rechercher...</span>
        <Kbd aria-hidden="true" className="h-[18px] text-[10px]">
          ⌘K
        </Kbd>
      </button>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <NavGroup
          label="Explorer"
          items={exploreItems}
          pathname={pathname}
          onNavigate={onNavigate}
        />
        {session ? (
          <NavGroup
            label="Mon espace"
            items={spaceItems}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ) : onLogin ? null : (
          <div className="mx-1 rounded-xl border border-border bg-surface px-3 py-3 text-[12px] leading-relaxed text-muted">
            Connectez-vous avec Steam pour suivre des joueurs et créer des groupes.
          </div>
        )}
      </div>

      <div className={cn("mt-3 border-t border-divider pt-3", !session && onLogin && "hidden")}>
        {session ? (
          <UserMenu variant="sidebar" />
        ) : onLogin ? null : (
          <SteamButton size="sm" className="w-full" returnTo={pathname}>
            Connexion Steam
          </SteamButton>
        )}
      </div>
    </div>
  );
}
