/**
 * Macht ein bereits registriertes Konto beim Serverstart zum Betreiber —
 * für Server, deren Datenbank von außen nicht erreichbar ist (Render).
 *
 *   OPERATOR_PROMOTE_EMAIL=adresse@beispiel.de   (nur im Render-Dashboard setzen)
 *
 * Greift nur, solange es noch KEINEN Betreiber gibt; danach tut das Skript
 * nichts mehr (wie /setup). Ohne die Variable passiert nichts. Fehler
 * verhindern den Start nicht.
 */
import { PrismaClient } from "@prisma/client";

const email = (process.env.OPERATOR_PROMOTE_EMAIL ?? "").trim().toLowerCase();
if (!email) process.exit(0);

const prisma = new PrismaClient();
try {
  if ((await prisma.user.count({ where: { isOperator: true } })) > 0) {
    console.log("promote-operator: Betreiber existiert bereits — nichts geändert. OPERATOR_PROMOTE_EMAIL kann entfernt werden.");
  } else {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log("promote-operator: kein Konto mit dieser Adresse — nichts geändert.");
    } else {
      await prisma.user.update({ where: { id: user.id }, data: { isOperator: true } });
      await prisma.auditLog.create({
        data: { workspaceId: user.workspaceId, userId: user.id, action: "operator.promote", detail: "Betreiberrecht beim Serverstart vergeben" },
      });
      console.log("promote-operator: Konto zum Betreiber gemacht.");
    }
  }
} catch (err) {
  console.error(`promote-operator: fehlgeschlagen (${err instanceof Error ? err.message : String(err)})`);
} finally {
  await prisma.$disconnect();
}
