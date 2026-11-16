import { Outlet } from "react-router";
import { Footer, Nav } from "@/components/layout";

export function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenu"
        className="sr-only z-50 rounded-md bg-text px-3 py-2 text-sm text-[#0a0b0d] focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Aller au contenu
      </a>
      <Nav />
      <main id="contenu" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
