import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { clientIp, hitRateLimit } from "@/lib/rateLimit";
import { EmailError, isEmailConfigured, sendEmail } from "@/lib/email";
import { appOrigin } from "@/lib/composio/origin";
import { CONFIRM_TTL_MS, NEWSLETTER_CONSENT_TEXT, confirmationMail, newToken } from "@/lib/newsletter";

const schema = z.object({ email: z.string().trim().toLowerCase().max(320).email(), einwilligung: z.literal(true) });
const ANTWORT =
  "Fast geschafft: Bitte bestätigen Sie die Anmeldung über den Link in der E-Mail, die wir Ihnen geschickt haben.";
const RESEND_PAUSE_MS = 10 * 60 * 1000;

/**
 * Newsletter-Anmeldung mit Double-Opt-in. Für jede Adresse dieselbe Antwort
 * (kein Rückschluss, ob sie schon angemeldet ist). Bestätigungsmail höchstens
 * alle 10 Minuten je Adresse; bereits bestätigte Adressen bekommen keine Mail.
 */
export async function POST(request: Request) {
  if (!isEmailConfigured()) {
    return NextResponse.json({ meldung: "Der Newsletter ist noch nicht eingerichtet." }, { status: 503 });
  }
  if (!(await hitRateLimit(`newsletter:${clientIp(request)}`, 5, 3600))) {
    return NextResponse.json({ meldung: "Zu viele Anfragen. Bitte in ein paar Minuten erneut versuchen." }, { status: 429 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ meldung: "Bitte eine gültige E-Mail-Adresse angeben und der Einwilligung zustimmen." }, { status: 400 });
  }
  const { email } = parsed.data;
  const now = new Date();
  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
  if (existing?.status === "ACTIVE") return NextResponse.json({ ok: true, meldung: ANTWORT });
  if (existing?.lastMailAt && now.getTime() - existing.lastMailAt.getTime() < RESEND_PAUSE_MS) {
    return NextResponse.json({ ok: true, meldung: ANTWORT });
  }

  const confirm = newToken();
  const unsubscribe = newToken();
  const data = {
    status: "PENDING",
    confirmTokenHash: confirm.hash,
    confirmExpiresAt: new Date(now.getTime() + CONFIRM_TTL_MS),
    unsubscribeHash: unsubscribe.hash,
    consentText: NEWSLETTER_CONSENT_TEXT,
    consentAt: now,
    lastMailAt: now,
    unsubscribedAt: null,
  };
  await prisma.newsletterSubscriber.upsert({ where: { email }, create: { email, ...data }, update: data });

  const origin = appOrigin(request);
  const mail = confirmationMail(
    `${origin}/api/newsletter/bestaetigen?t=${confirm.token}`,
    `${origin}/api/newsletter/abmelden?t=${unsubscribe.token}`
  );
  try {
    await sendEmail({ to: email, ...mail });
  } catch (err) {
    if (!(err instanceof EmailError)) throw err;
    console.error("[newsletter]", err.message);
    return NextResponse.json({ meldung: "Die Bestätigungs-E-Mail konnte gerade nicht versendet werden. Bitte später erneut versuchen." }, { status: 502 });
  }
  return NextResponse.json({ ok: true, meldung: ANTWORT });
}
