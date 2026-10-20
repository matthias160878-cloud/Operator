import os from "node:os";
import path from "node:path";
import { defineConfig } from "vitest/config";

// Eigene SQLite-Datenbank nur für diesen Testlauf (wird in tests/globalSetup.ts
// per `prisma db push` angelegt und danach gelöscht) — dev.db bleibt unberührt.
const testDb = path.join(os.tmpdir(), `operator-vitest-${process.pid}.db`);

export default defineConfig({
  // Pfad-Alias @/* aus tsconfig.json
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    globalSetup: ["tests/globalSetup.ts"],
    setupFiles: ["tests/setup.ts"],
    // SQLite verträgt keine parallelen Schreiber aus mehreren Dateien.
    fileParallelism: false,
    env: {
      DATABASE_URL: `file:${testDb}`,
      TOKEN_ENCRYPTION_KEY: "0".repeat(64),
      // Keine echten KI-Aufrufe: Agenten laufen im Vorlagen-Modus.
      ANTHROPIC_API_KEY: "",
      OPENAI_API_KEY: "",
      OWNER_ACCESS_KEY: "",
    },
  },
});
