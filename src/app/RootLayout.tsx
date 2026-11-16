import { Suspense, useEffect, useRef, useState } from "react";
import { Outlet, ScrollRestoration, useLocation } from "react-router";
import { BrandLoader } from "@/components/brand";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { PaletteContext } from "@/components/layout/paletteContext";
import { SessionExpiredDialog } from "@/features/auth/SessionExpiredDialog";
import { Footer, Nav } from "@/components/layout";

export function RootLayout() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const main = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  const first = useRef(true);

  // Après une navigation, le focus revient au contenu (lecteurs d'écran, clavier).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    main.current?.focus({ preventScroll: true });
  }, [pathname]);

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
      <div className="flex min-h-dvh flex-col">
        <a
          href="#contenu"
          className="sr-only z-50 rounded-md bg-text px-3 py-2 text-sm text-[#0a0b0d] focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Aller au contenu
        </a>
        <Nav onOpenSearch={() => setPaletteOpen(true)} />
        <main
          ref={main}
          tabIndex={-1}
          id="contenu"
          className="mx-auto w-full outline-none max-w-6xl flex-1 px-4 pt-10 sm:px-6"
        >
          <Suspense fallback={<BrandLoader />}>
            <Outlet />
          </Suspense>
        </main>
        <Footer />
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
        <SessionExpiredDialog />
        <ScrollRestoration />
      </div>
    </PaletteContext>
  );
}
