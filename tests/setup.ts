import { afterEach, vi } from "vitest";

// Jeder Test stellt sein eigenes fetch-Mock auf — nie echte Netzwerkaufrufe.
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
