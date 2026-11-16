import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { PaletteContext } from "@/components/layout/paletteContext";
import { SessionExpiredDialog } from "@/features/auth/SessionExpiredDialog";

/** Racine : palette ⌘K, session expirée et raccourci clavier, partagés par la landing et le shell. */
export function RootLayout() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <PaletteContext value={{ open: () => setPaletteOpen(true) }}>
      <Outlet />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <SessionExpiredDialog />
    </PaletteContext>
  );
}
