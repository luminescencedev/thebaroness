import { Menu } from "@base-ui/react/menu";
import { useNavigate } from "react-router";
import { logout } from "@/api";
import { Avatar } from "@/components/ui";
import { useSession } from "@/features/auth/useSession";

const item =
  "flex w-full cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm text-muted outline-none data-[highlighted]:bg-surface-strong data-[highlighted]:text-text";

export function UserMenu() {
  const session = useSession();
  const navigate = useNavigate();
  if (!session) return null;
  const { displayName, avatarUrl, steamId } = session.user;

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`Compte de ${displayName}`}
        className="pressable flex h-9 items-center gap-2 rounded-full border border-border-strong bg-surface py-0.5 pr-3 pl-0.5 text-sm text-muted hover-text"
      >
        <Avatar name={displayName} src={avatarUrl} className="size-8 text-xs" />
        <span className="max-w-[9rem] truncate">{displayName}</span>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={10} align="end" className="z-50">
          <Menu.Popup className="surface-solid w-56 p-1.5 outline-none">
            <div className="px-3 py-2">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="mono text-xs text-subtle">{steamId}</p>
            </div>
            <Menu.Separator className="my-1 h-px bg-border" />
            <Menu.Item className={item} onClick={() => void navigate("/tracked")}>
              Mes suivis
            </Menu.Item>
            <Menu.Item className={item} onClick={() => void navigate("/groups")}>
              Groupes
            </Menu.Item>
            <Menu.Item className={item} onClick={() => void navigate(`/players/${steamId}`)}>
              Mon profil public
            </Menu.Item>
            <Menu.Separator className="my-1 h-px bg-border" />
            <Menu.Item className={item} onClick={logout}>
              Déconnexion
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
