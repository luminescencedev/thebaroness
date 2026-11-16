import { Suspense, useEffect, useState } from "react";
import { Outlet } from "react-router";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { Footer, Nav } from "@/components/layout";

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
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenu"
        className="sr-only z-50 rounded-md bg-text px-3 py-2 text-sm text-[#0a0b0d] focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Aller au contenu
      </a>
      <Nav onOpenSearch={() => setPaletteOpen(true)} />
      <main id="contenu" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-10 sm:px-6">
        <Suspense fallback={<div role="status" aria-label="Chargement" className="py-24" />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
