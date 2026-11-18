import { Menu } from "@base-ui/react/menu";

/** Actions rares du groupe : la suppression vit ici, à l'écart des actions courantes. */
export function GroupMenu({ onDelete }: { onDelete: () => void }) {
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Plus d'actions"
        className="icon-btn pressable grid size-8 place-items-center rounded-[10px] border border-border text-muted"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-4">
          <circle cx="5" cy="12" r="1.7" />
          <circle cx="12" cy="12" r="1.7" />
          <circle cx="19" cy="12" r="1.7" />
        </svg>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8} align="end" className="z-[70]">
          <Menu.Popup className="menu-popup surface-solid w-52 p-1.5 outline-none">
            <Menu.Item
              onClick={onDelete}
              className="flex min-h-10 cursor-pointer items-center rounded-lg px-3 text-sm text-loss outline-none data-[highlighted]:bg-loss/10"
            >
              Supprimer le groupe
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
