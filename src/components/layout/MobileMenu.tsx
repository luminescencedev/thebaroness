import { Drawer } from "vaul";
import { NavLink } from "react-router";
import { logout } from "@/api";
import { Avatar, Button, cn } from "@/components/ui";
import { SteamButton } from "@/features/auth/SteamButton";
import { useSession } from "@/features/auth/useSession";

interface MobileMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  links: { to: string; label: string }[];
  onSearch: () => void;
  currentPath: string;
}

/** Feuille mobile (Vaul) : navigation complète sous 768 px. */
export function MobileMenu({ open, onOpenChange, links, onSearch, currentPath }: MobileMenuProps) {
  const session = useSession();
  const close = () => onOpenChange(false);

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Drawer.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-50 rounded-t-[20px] border border-b-0 border-border-strong bg-[#0d0e11] px-5 pt-3 pb-8 outline-none"
        >
          <div aria-hidden="true" className="mx-auto mb-5 h-1 w-10 rounded-full bg-border-strong" />
          <Drawer.Title className="sr-only">Menu</Drawer.Title>

          {session && (
            <div className="mb-4 flex items-center gap-3">
              <Avatar
                name={session.user.displayName}
                src={session.user.avatarUrl}
                className="size-10"
              />
              <div className="min-w-0">
                <p className="truncate font-medium">{session.user.displayName}</p>
                <p className="mono text-xs text-subtle">{session.user.steamId}</p>
              </div>
            </div>
          )}

          <nav aria-label="Menu mobile" className="flex flex-col">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={close}
                className={cn(
                  "pressable rounded-control px-3 py-3 text-lg font-medium tracking-[-0.02em]",
                  currentPath.startsWith(l.to) ? "bg-surface-strong text-text" : "text-muted",
                )}
              >
                {l.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={() => {
                close();
                onSearch();
              }}
              className="pressable rounded-control px-3 py-3 text-left text-lg font-medium tracking-[-0.02em] text-muted"
            >
              Rechercher
            </button>
          </nav>

          <div className="mt-5">
            {session ? (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  logout();
                  close();
                }}
              >
                Déconnexion
              </Button>
            ) : (
              <SteamButton returnTo={currentPath} className="w-full" />
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
