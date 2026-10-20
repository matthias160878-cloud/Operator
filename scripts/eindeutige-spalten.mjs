/**
 * Legt neue, eindeutige (anfangs leere) Spalten vor `prisma db push` an.
 *
 * `prisma db push` meldet beim Hinzufügen einer UNIQUE-Bedingung immer
 * „möglicher Datenverlust“ – auch wenn die Spalte neu und überall NULL ist –
 * und verweigert ohne --accept-data-loss den Start. Dieses Skript legt nur
 * die hier aufgeführten neuen Spalten samt eindeutigem Index an
 * (ausschließlich ADD … IF NOT EXISTS, nichts wird gelöscht oder geändert).
 * Danach sieht `db push` keinen Unterschied mehr; alle anderen Warnungen
 * stoppen den Start weiterhin. Nur für PostgreSQL; sonst ohne Wirkung.
 */
import { PrismaClient } from "@prisma/client";

const url = process.env.DATABASE_URL ?? "";
if (!/^postgres(ql)?:/.test(url)) process.exit(0);

// [Tabelle, Spalte] – Indexname wie von Prisma erzeugt: <tabelle>_<spalte>_key
const SPALTEN = [
  ["content_items", "herkunftsSchluessel"],
  ["reichweiten_kampagnen", "erstellKennung"],
];

const prisma = new PrismaClient();
try {
  for (const [tabelle, spalte] of SPALTEN) {
    const [{ vorhanden }] = await prisma.$queryRawUnsafe(`SELECT to_regclass('public.${tabelle}') IS NOT NULL AS vorhanden`);
    if (!vorhanden) continue; // neue Datenbank: db push legt alles selbst an
    await prisma.$executeRawUnsafe(`ALTER TABLE "${tabelle}" ADD COLUMN IF NOT EXISTS "${spalte}" TEXT`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "${tabelle}_${spalte}_key" ON "${tabelle}"("${spalte}")`);
  }
  console.log("eindeutige-spalten: geprüft.");
} catch (e) {
  console.error("eindeutige-spalten:", e instanceof Error ? e.message : e);
} finally {
  await prisma.$disconnect();
}
