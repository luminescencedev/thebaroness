import { Suspense } from "react";
import { Outlet, ScrollRestoration } from "react-router";
import { BrandLoader } from "@/components/brand";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { usePalette } from "@/components/layout/paletteContext";

/** Layout de la landing : fond continu, navbar pilule, défilement de la fenêtre, pas de shell. */
export function LandingLayout() {
  const { open } = usePalette();
  return (
    <div className="relative isolate min-h-dvh overflow-x-clip">
      <a
        href="#contenu"
        className="sr-only z-[90] rounded-md bg-text px-3 py-2 text-sm text-[#0a0b0d] focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Aller au contenu
      </a>
      <div className="landing-scene" aria-hidden="true" />
      <SiteHeader onOpenSearch={open} />
      <main id="contenu" tabIndex={-1} className="outline-none">
        <Suspense fallback={<BrandLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <ScrollRestoration />
    </div>
  );
}
