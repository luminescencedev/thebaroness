import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "@fontsource-variable/bodoni-moda/wght.css";
import "@fontsource-variable/bodoni-moda/wght-italic.css";
import "@/styles/globals.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app/App";

async function enableMocking(): Promise<void> {
  // Condition inline : Vite retire ce bloc, et MSW, du build de production.
  if (!(
    import.meta.env.DEV &&
    (import.meta.env.MODE === "mock" || import.meta.env.VITE_API_MODE === "mock")
  ))
    return;
  const { worker } = await import("@/mocks/browser");
  await worker.start({ onUnhandledFrame: "bypass" });
}

void enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
