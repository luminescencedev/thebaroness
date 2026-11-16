import { Menu } from "@base-ui/react/menu";
import { useNavigate } from "react-router";
import { logout } from "@/api";
import { Avatar } from "@/components/ui";
import { useSession } from "@/features/auth/useSession";
import { ChevronIcon } from "./icons";

const item =
  "flex w-full cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm text-muted outline-none data-[highlighted]:bg-surface-strong data-[highlighted]:text-text";

export function UserMenu({ variant = "sidebar" }: { variant?: "sidebar" | "pill" }) {
  const session = useSession();
  const navigate = useNavigate();
  if (!session) return null;
  const { displayName, avatarUrl, steamId } = session.user;
  const pill = variant === "pill";

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`Compte de ${displayName}`}
        className={
          pill
            ? "pressable flex h-[38px] items-center gap-2 rounded-full border border-[rgb(255_255_255/0.1)] bg-[rgb(255_255_255/0.07)] py-0.5 pr-3 pl-0.5 text-left hover:bg-[rgb(255_255_255/0.11)] data-[popup-open]:bg-[rgb(255_255_255/0.11)]"
            : "pressable flex w-full items-center gap-2.5 rounded-xl p-2 text-left hover:bg-[rgb(255_255_255/0.04)] data-[popup-open]:bg-[rgb(255_255_255/0.05)]"
        }
      >
        <Avatar
          name={displayName}
          src={avatarUrl}
          className={pill ? "size-8 text-xs" : "size-8 text-xs"}
        />
        <span
          className={
            pill
              ? "hidden max-w-[8rem] truncate text-[12px] font-semibold sm:block"
              : "min-w-0 flex-1"
          }
        >
          <span className="block truncate text-[12.5px] font-semibold">{displayName}</span>
          {!pill && <span className="block text-[10.5px] text-subtle">Compte Steam</span>}
        </span>
        {!pill && <ChevronIcon className="text-subtle" />}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          sideOffset={pill ? 12 : 8}
          align={pill ? "end" : "start"}
          side={pill ? "bottom" : "top"}
          className="z-[70]"
        >
          <Menu.Popup className="menu-popup surface-solid w-56 p-1.5 outline-none">
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
