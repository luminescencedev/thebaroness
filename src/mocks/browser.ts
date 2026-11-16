import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";
import { mockConfig } from "./state";

mockConfig.latencyMs = 250;

export const worker = setupWorker(...handlers);
