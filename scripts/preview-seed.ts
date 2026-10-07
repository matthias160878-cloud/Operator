/**
 * Private, isolierte Vorschau: legt zwei Testkunden (A mit Pro, B mit Maxi)
 * und einen Betreiber an — ausschließlich mit TEST-Paketen, ohne echte
 * Zahlungen. Verweigert die Ausführung gegen Nicht-SQLite-Datenbanken und in
 * Produktion, damit nie produktive Kundendaten verändert werden.
 *
 *   DATABASE_URL=file:./preview.db npx tsx scripts/preview-seed.ts
 *
 * Passwörter werden zufällig erzeugt und nur in der Konsole ausgegeben.
 */
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

async function account(email: string, name: string, workspaceName: string, plan: "PRO" | "MAXI" | null, isOperator = false) {
  const password = randomBytes(12).toString("base64url");
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { email, password: "(bereits vorhanden)" };
  await prisma.workspace.create({
    data: {
      name: workspaceName,
      slug: `${workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${randomBytes(3).toString("hex")}`,
      users: { create: { email, name, role: "OWNER", isOperator, passwordHash: await hashPassword(password) } },
      brand: { create: { name: workspaceName, description: `${workspaceName} (Testdaten)` } },
      ...(plan ? { plan: { create: { plan, status: "ACTIVE", source: "TEST", billingMode: "payment", activatedAt: new Date() } } } : {}),
    },
  });
  return { email, password };
}

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  if (process.env.NODE_ENV === "production" || !url.startsWith("file:")) {
    throw new Error("Vorschau-Seed nur gegen eine lokale SQLite-Testdatenbank und nie in Produktion.");
  }
  const rows = [
    await account("kunde-a@example.test", "Kunde A", "Testfirma A", "PRO"),
    await account("kunde-b@example.test", "Kunde B", "Testfirma B", "MAXI"),
    await account("betreiber@example.test", "Betreiber (Test)", "Betreiber", null, true),
  ];
  console.table(rows);
}

main().finally(() => prisma.$disconnect());
