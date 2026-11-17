import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigationType } from "react-router";
import { BrandLoader } from "@/components/brand";
import { usePalette } from "@/components/layout/paletteContext";
import { useCrumbs } from "@/components/layout/navModel";
import { Footer, MobileMenu, SidebarNav, Topbar } from "@/components/layout";

/** Positions de défilement par entrée d'historique (le conteneur du panneau défile, pas la fenêtre). */
const scrollMemory = new Map<string, number>();

const SIDEBAR_KEY = "baroness:sidebar-collapsed";
function readCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === "1";
  } catch {
    return false;
  }
}

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const main = useRef<HTMLElement>(null);
  const { pathname, key } = useLocation();
  const navType = useNavigationType();
  const first = useRef(true);
  // Sidebar repliée (bureau) : préférence mémorisée ; le panneau la recouvre sans la déplacer.
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const expanded = collapsed;
  const toggleSidebar = () =>
    setCollapsed((v) => {
      try {
        localStorage.setItem(SIDEBAR_KEY, v ? "0" : "1");
      } catch {
        /* stockage indisponible : la préférence reste valable pour la session */
      }
      return !v;
    });
  const lastKey = useRef(key);

  // Mémorise la position avant de quitter une entrée, la restitue en retour arrière, sinon remonte.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    scrollMemory.set(lastKey.current, el.scrollTop);
    lastKey.current = key;
    el.scrollTop = navType === "POP" ? (scrollMemory.get(key) ?? 0) : 0;
  }, [key, navType]);

  // Fondu en haut et en bas du panneau, seulement quand il y a du contenu au-delà du bord.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const update = () => {
      el.toggleAttribute("data-scrolled", el.scrollTop > 4);
      el.toggleAttribute("data-more", el.scrollHeight - el.clientHeight - el.scrollTop > 4);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (main.current) ro.observe(main.current);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  // Après une navigation, le focus revient au contenu (lecteurs d'écran, clavier).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    main.current?.focus({ preventScroll: true });
  }, [pathname]);

  const openSearch = usePalette().open;
  const hasCrumbs = useCrumbs().length > 1;

  return (
    <div className="app-shell">
      <a
        href="#contenu"
        className="sr-only z-[90] rounded-md bg-text px-3 py-2 text-sm text-[#0a0b0d] focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Aller au contenu
      </a>

      <aside
        className="hidden min-h-0 transition-opacity duration-300 motion-reduce:transition-none data-[covered]:opacity-0 lg:block"
        data-covered={expanded || undefined}
        aria-label="Barre latérale"
        inert={expanded || undefined}
      >
        <SidebarNav onOpenSearch={openSearch} onCollapse={toggleSidebar} />
      </aside>

      <div className="app-stage">
        <div
          className="app-panel"
          data-crumbs={hasCrumbs || undefined}
          data-expanded={expanded || undefined}
        >
          <Topbar
            onOpenMenu={() => setMenuOpen(true)}
            onOpenSearch={openSearch}
            sidebarCollapsed={expanded}
            onToggleSidebar={toggleSidebar}
          />
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
