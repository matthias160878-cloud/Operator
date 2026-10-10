/**
 * Stellt das Prisma-Schema für den Serverbetrieb auf PostgreSQL um.
 * Lokal und in den Tests bleibt SQLite (prisma/schema.prisma im Repo);
 * der Render-Build ruft dieses Skript vor `prisma generate` auf:
 *
 *   Build:  npm ci && npm run build:server   (Provider umstellen, generate, next build)
 *   Start:  npm run start:server             (prisma db push, dann next start)
 *
 * `prisma db push` läuft beim Start (interne DB-Adresse erreichbar) OHNE
 * --accept-data-loss: Änderungen, die Daten löschen
 * würden, verhindern den Start, statt still Daten zu verwerfen; Render
 * behält dann die laufende Version.
 */
import { readFileSync, writeFileSync } from "node:fs";

const file = new URL("../prisma/schema.prisma", import.meta.url);
const schema = readFileSync(file, "utf8");
const switched = schema.replace(/(datasource db \{\s*provider\s*=\s*)"sqlite"/, '$1"postgresql"');
if (!/provider\s*=\s*"postgresql"/.test(switched)) {
  console.error("use-postgres: datasource-Block nicht gefunden — Schema unverändert.");
  process.exit(1);
}
if (!process.env.DATABASE_URL?.startsWith("postgres")) {
  console.error("use-postgres: DATABASE_URL ist keine PostgreSQL-Adresse — Abbruch.");
  process.exit(1);
}
writeFileSync(file, switched);
console.log("use-postgres: Prisma-Provider auf postgresql gestellt.");
