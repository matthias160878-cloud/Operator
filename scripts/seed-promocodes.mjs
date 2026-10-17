/**
 * Legt beim Serverstart Promocodes an, deren Klartext der Betreiber anderswo
 * erhalten hat — der Server bekommt NUR die SHA-256-Hashes (wie sie
 * src/lib/promoCodes.ts berechnet: sha256(Code ohne Bindestriche, Großbuchstaben)).
 *
 *   PROMO_SEED="MAXI:<hash>,<hash>;PRO:<hash>"   (nur im Render-Dashboard setzen)
 *
 * Idempotent: vorhandene Hashes werden übersprungen. Ohne Variable passiert
 * nichts; Fehler verhindern den Start nicht. Danach kann die Variable weg.
 */
import { PrismaClient } from "@prisma/client";

const seed = (process.env.PROMO_SEED ?? "").trim();
if (!seed) process.exit(0);

const prisma = new PrismaClient();
try {
  let angelegt = 0;
  let vorhanden = 0;
  for (const block of seed.split(";")) {
    const [planRaw, list] = block.split(":");
    const plan = (planRaw ?? "").trim().toUpperCase();
    if (!["PRO", "MAXI"].includes(plan) || !list) continue;
    for (const h of list.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean)) {
      if (!/^[0-9a-f]{64}$/.test(h)) continue;
      const exists = await prisma.promoCode.findUnique({ where: { codeHash: h } });
      if (exists) {
        vorhanden += 1;
        continue;
      }
      await prisma.promoCode.create({ data: { codeHash: h, hint: h.slice(0, 4), plan, label: "vorab erzeugt" } });
      angelegt += 1;
    }
  }
  console.log(`seed-promocodes: ${angelegt} angelegt, ${vorhanden} bereits vorhanden.`);
} catch (err) {
  console.error(`seed-promocodes: fehlgeschlagen (${err instanceof Error ? err.message : String(err)})`);
} finally {
  await prisma.$disconnect();
}
