import { prisma } from "@/lib/db";
import { hashToken, resultPage } from "@/lib/newsletter";

export const dynamic = "force-dynamic";

/** Klick auf den Bestätigungslink → Anmeldung aktiv (Link einmalig, 48 Stunden gültig). */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("t") ?? "";
  const res = token
    ? await prisma.newsletterSubscriber.updateMany({
        where: { confirmTokenHash: hashToken(token), status: "PENDING", confirmExpiresAt: { gt: new Date() } },
        data: { status: "ACTIVE", confirmedAt: new Date(), confirmTokenHash: null, confirmExpiresAt: null },
      })
    : { count: 0 };
  return res.count === 1
    ? resultPage("Anmeldung bestätigt", "Danke! Sie erhalten ab jetzt den Newsletter von Secret 58. Abmelden können Sie sich jederzeit über den Link in jeder E-Mail.")
    : resultPage("Link nicht gültig", "Dieser Bestätigungslink ist abgelaufen oder wurde schon verwendet. Melden Sie sich bei Bedarf einfach erneut auf der Startseite an.");
}
