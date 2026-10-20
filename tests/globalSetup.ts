import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

/** Legt die Test-Datenbank an (Schema aus prisma/schema.prisma) und räumt danach auf. */
export default function setup() {
  const dbFile = path.join(os.tmpdir(), `operator-vitest-${process.pid}.db`);
  rmSync(dbFile, { force: true });
  execSync("npx prisma db push --skip-generate", {
    env: { ...process.env, DATABASE_URL: `file:${dbFile}` },
    stdio: "pipe",
  });
  return () => {
    for (const suffix of ["", "-journal"]) rmSync(dbFile + suffix, { force: true });
  };
}
