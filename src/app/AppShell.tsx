import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigationType } from "react-router";
import { BrandLoader } from "@/components/brand";
import { usePalette } from "@/components/layout/paletteContext";
import { Footer, MobileMenu, SidebarNav, Topbar } from "@/components/layout";

/** Positions de défilement par entrée d'historique (le conteneur du panneau défile, pas la fenêtre). */
const scrollMemory = new Map<string, number>();

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const main = useRef<HTMLElement>(null);
  const { pathname, key } = useLocation();
  const navType = useNavigationType();
  const first = useRef(true);
  const lastKey = useRef(key);

  // Mémorise la position avant de quitter une entrée, la restitue en retour arrière, sinon remonte.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    scrollMemory.set(lastKey.current, el.scrollTop);
    lastKey.current = key;
    el.scrollTop = navType === "POP" ? (scrollMemory.get(key) ?? 0) : 0;
  }, [key, navType]);

  // Après une navigation, le focus revient au contenu (lecteurs d'écran, clavier).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    main.current?.focus({ preventScroll: true });
  }, [pathname]);

  const openSearch = usePalette().open;

  return (
    <div className="app-shell">
      <a
        href="#contenu"
        className="sr-only z-[90] rounded-md bg-text px-3 py-2 text-sm text-[#0a0b0d] focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Aller au contenu
      </a>

      <aside className="hidden min-h-0 lg:block" aria-label="Barre latérale">
        <SidebarNav onOpenSearch={openSearch} />
      </aside>

      <div className="app-stage">
        <div className="app-panel">
          <Topbar onOpenMenu={() => setMenuOpen(true)} onOpenSearch={openSearch} />
          <div ref={scroller} className="app-scroll">
            <main
              ref={main}
              tabIndex={-1}
              id="contenu"
              className="app-content mx-auto max-w-[1760px] outline-none"
            >
              <Suspense fallback={<BrandLoader />}>
                <Outlet />
              </Suspense>
              <Footer />
            </main>
          </div>
        </div>
      </div>

      <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} onSearch={openSearch} />
    </div>
  );
}
