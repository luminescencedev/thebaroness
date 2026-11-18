import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { sessionStore } from "@/api/session";
import { server } from "@/mocks/server";
import { resetMockState } from "@/mocks/state";

// Premier rendu d'un fichier : les pages sont chargées à la demande et la machine peut être chargée. Le délai
// par défaut de findBy (1 s) rendait ces tests instables sans rien prouver de plus.
configure({ asyncUtilTimeout: 10_000 });

// jsdom n'implémente pas ResizeObserver (utilisé par cmdk et Base UI).
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Element.prototype.scrollIntoView ??= () => {};

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetMockState();
  sessionStore.clear();
});

afterAll(() => server.close());
