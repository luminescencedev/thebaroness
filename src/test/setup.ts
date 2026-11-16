import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { sessionStore } from "@/api/session";
import { server } from "@/mocks/server";
import { resetMockState } from "@/mocks/state";

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetMockState();
  sessionStore.clear();
});

afterAll(() => server.close());
