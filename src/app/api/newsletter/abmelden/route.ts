import { prisma } from "@/lib/db";
import { hashToken, resultPage } from "@/lib/newsletter";

export const dynamic = "force-dynamic";

/** Abmeldelink aus der E-Mail. */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("t") ?? "";
  const res = token
    ? await prisma.newsletterSubscriber.updateMany({
        where: { unsubscribeHash: hashToken(token), status: { not: "UNSUBSCRIBED" } },
        data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date(), confirmTokenHash: null, confirmExpiresAt: null },
      })
    : { count: 0 };
  return res.count === 1
    ? resultPage("Abgemeldet", "Sie wurden vom Newsletter abgemeldet und erhalten keine weiteren E-Mails.")
    : resultPage("Bereits abgemeldet", "Diese Adresse ist nicht (mehr) für den Newsletter angemeldet.");
}
