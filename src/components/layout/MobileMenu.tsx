import { Drawer } from "vaul";
import { SidebarNav } from "./SidebarNav";

interface MobileMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: () => void;
}

/** Drawer latéral (Vaul) : la sidebar complète sous 1024 px, fermable au geste ou au scrim. */
export function MobileMenu({ open, onOpenChange, onSearch }: MobileMenuProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} direction="left">
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Drawer.Content
          aria-describedby={undefined}
          className="nav-drawer fixed top-0 bottom-0 left-0 z-50 w-[272px] max-w-[85vw] rounded-r-[20px] border border-l-0 border-border-strong outline-none"
        >
          <Drawer.Title className="sr-only">Menu</Drawer.Title>
          <SidebarNav onOpenSearch={onSearch} onNavigate={() => onOpenChange(false)} />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
