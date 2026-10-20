import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { clientIp, hitRateLimit } from "@/lib/rateLimit";
import { operatorWorkspaceId } from "@/lib/operatorWorkspace";
import {
  bestaetigungsMail,
  bestaetigungsZeilen,
  eingangText,
  KUENDIGUNGS_ARTEN,
  neueReferenz,
  pruefeZeitpunkt,
  VERTRAEGE,
  zeitpunktText,
  type KuendigungsAngaben,
} from "@/lib/kuendigung";

/**
 * Kündigungsbutton (§ 312k BGB). Öffentlich, ohne Anmeldung. Jede Kündigung
 * wird gespeichert, sofort auf dem Bildschirm und per E-Mail (Textform)
 * bestätigt und landet im Posteingang des Betreibers. In Stripe wird nichts
 * automatisch gekündigt — das erledigt der Betreiber.
 *
 * Datenschutz: Die Antwort ist für bekannte und unbekannte E-Mail-Adressen
 * gleich aufgebaut; ob ein Konto existiert, sieht nur der Betreiber.
 */
const schema = z
  .object({
    art: z.enum(["ORDENTLICH", "AUSSERORDENTLICH"]),
    grund: z.string().trim().max(1000).optional().default(""),
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().toLowerCase().max(200).email(),
    kundennummer: z.string().trim().max(120).optional().default(""),
    vertrag: z.enum(["PRO", "MAXI", "SONSTIGES"]),
    vertragBeschreibung: z.string().trim().max(300).optional().default(""),
    zeitpunkt: z.string().trim().max(20).optional().default("naechstmoeglich"),
    bestaetigungEmail: z.string().trim().toLowerCase().max(200).email(),
  })
  .strict();

function fehler(meldung: string, status = 400) {
  return NextResponse.json({ meldung }, { status });
}

function datumDe(d: Date) {
  return new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", dateStyle: "medium" }).format(d);
}

export async function POST(request: Request) {
  if (!(await hitRateLimit(`kuendigen:${clientIp(request)}`, 5, 3600))) {
    return fehler("Zu viele Kündigungen in kurzer Zeit von diesem Anschluss. Bitte später erneut versuchen oder an info@secret58.com schreiben.", 429);
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return fehler("Bitte Art der Kündigung, Name, eine gültige E-Mail-Adresse des Kontos, den Vertrag und eine gültige E-Mail-Adresse für die Bestätigung angeben.");
  }
  const d = parsed.data;
  if (d.vertrag === "SONSTIGES" && !d.vertragBeschreibung) {
    return fehler("Bitte beschreiben Sie den Vertrag, den Sie kündigen möchten.");
  }
  const zeitpunkt = pruefeZeitpunkt(d.zeitpunkt);
  if (!zeitpunkt) {
    return fehler("Bitte „zum nächstmöglichen Zeitpunkt“ wählen oder ein gültiges Datum ab heute angeben.");
  }
  // Schutz vor Missbrauch als Mail-Versender an fremde Adressen.
  if (!(await hitRateLimit(`kuendigen-mail:${d.bestaetigungEmail}`, 5, 86_400))) {
    return fehler("Für diese Bestätigungsadresse sind heute bereits mehrere Kündigungen eingegangen. Bitte an info@secret58.com schreiben.", 429);
  }

  const vertrag = d.vertrag === "SONSTIGES" ? `Sonstiger Vertrag: ${d.vertragBeschreibung}` : VERTRAEGE[d.vertrag];
  const grund = d.art === "AUSSERORDENTLICH" ? d.grund : "";

  // Zuordnung nur serverseitig über die Konto-E-Mail — nie aus der Anfrage.
  const user = await prisma.user.findUnique({ where: { email: d.email }, select: { id: true, workspaceId: true } });

  let gespeichert = null;
  for (let versuch = 0; versuch < 5 && !gespeichert; versuch++) {
    try {
      gespeichert = await prisma.kuendigung.create({
        data: {
          referenz: neueReferenz(),
          art: d.art,
          name: d.name,
          email: d.email,
          bestaetigungEmail: d.bestaetigungEmail,
          vertrag,
          zeitpunkt,
          grund,
          kundennummer: d.kundennummer,
          workspaceId: user?.workspaceId ?? null,
          userId: user?.id ?? null,
        },
      });
    } catch (err) {
      if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")) throw err;
    }
  }
  if (!gespeichert) throw new Error("Keine freie Referenznummer gefunden.");

  const angaben: KuendigungsAngaben = {
    referenz: gespeichert.referenz,
    art: d.art,
    grund,
    name: d.name,
    email: d.email,
    kundennummer: d.kundennummer,
    vertrag,
    zeitpunkt,
    bestaetigungEmail: d.bestaetigungEmail,
    eingangAm: gespeichert.eingangAm,
  };

  let emailGesendet = false;
  let mailProblem = "";
  if (!isEmailConfigured()) {
    mailProblem = "E-Mail-Versand ist auf dem Server nicht eingerichtet.";
  } else {
    try {
      await sendEmail({ to: d.bestaetigungEmail, ...bestaetigungsMail(angaben), idempotencyKey: `kuendigung-${gespeichert.id}` });
      emailGesendet = true;
    } catch (err) {
      mailProblem = err instanceof Error ? err.message : "Versand fehlgeschlagen.";
    }
  }
  if (emailGesendet) {
    await prisma.kuendigung.update({ where: { id: gespeichert.id }, data: { emailGesendet: true } });
  } else {
    console.error(`[kuendigung] Eingangsbestätigung ${gespeichert.referenz} nicht versendet: ${mailProblem}`);
  }

  // Posteingang des Betreibers: sofort sichtbar, mit Paketstand zum Bearbeiten.
  // Ein Fehler hier darf die bereits gespeicherte Kündigung nicht scheitern lassen.
  try {
    await betreiberInformieren(angaben, user, emailGesendet, mailProblem);
  } catch (err) {
    console.error(`[kuendigung] ${gespeichert.referenz}: Posteingang nicht beschrieben:`, err instanceof Error ? err.message : err);
  }

  return NextResponse.json({
    referenz: gespeichert.referenz,
    eingangAm: gespeichert.eingangAm.toISOString(),
    eingangText: eingangText(gespeichert.eingangAm),
    art: KUENDIGUNGS_ARTEN[d.art],
    zeitpunktText: zeitpunktText(zeitpunkt),
    zeilen: bestaetigungsZeilen(angaben),
    emailGesendet,
    meldung: emailGesendet
      ? `Ihre Kündigung ist bei uns eingegangen. Eine Eingangsbestätigung wurde an ${d.bestaetigungEmail} gesendet.`
      : "Ihre Kündigung ist bei uns eingegangen. Die Eingangsbestätigung per E-Mail konnte gerade nicht versendet werden — bitte speichern oder drucken Sie diese Bestätigung; sie gilt als Ihr Eingangsnachweis.",
  });
}

async function betreiberInformieren(
  angaben: KuendigungsAngaben,
  user: { id: string; workspaceId: string } | null,
  emailGesendet: boolean,
  mailProblem: string,
) {
  let kontoText = "Kein Konto mit dieser E-Mail-Adresse gefunden — bitte anhand der Angaben zuordnen.";
  if (user) {
    const plan = await prisma.workspacePlan.findUnique({ where: { workspaceId: user.workspaceId } });
    kontoText = `Konto gefunden (Arbeitsbereich ${user.workspaceId}).`;
    if (plan) {
      kontoText +=
        ` Paket: ${plan.plan}, Status ${plan.status}, ${plan.billingMode === "subscription" ? "Abo" : "Einmalzahlung"}` +
        (plan.currentPeriodEnd ? `, laufender Zeitraum bis ${datumDe(plan.currentPeriodEnd)}` : "") +
        (plan.cancelAtPeriodEnd ? ", Kündigung zum Laufzeitende ist in Stripe bereits vorgemerkt" : "") +
        (plan.stripeSubscriptionId ? `, Stripe-Abo ${plan.stripeSubscriptionId}` : "") +
        ".";
    } else {
      kontoText += " Kein Paket hinterlegt.";
    }
  }
  const body = [
    `Kündigung ${angaben.referenz} (Kündigungsbutton, § 312k BGB)`,
    "",
    ...bestaetigungsZeilen(angaben).map(([a, b]) => `${a}: ${b}`),
    "",
    kontoText,
    emailGesendet
      ? "Eingangsbestätigung per E-Mail wurde versendet."
      : `ACHTUNG: Eingangsbestätigung per E-Mail wurde NICHT versendet (${mailProblem}). Bitte dem Kunden den Eingang selbst in Textform bestätigen.`,
    "",
    "Nichts wurde automatisch gekündigt. Bitte in Stripe (Kundenportal oder Dashboard) bearbeiten und im Betreiberbereich unter „Kündigungen“ als bearbeitet markieren.",
  ].join("\n");
  const opWs = await operatorWorkspaceId();
  if (opWs) {
    await prisma.conversation.create({
      data: {
        workspaceId: opWs,
        platform: "WEBSITE",
        participantName: `Kündigung ${angaben.referenz} – ${angaben.name}`,
        participantHandle: angaben.email,
        messages: { create: { direction: "INBOUND", body } },
      },
    });
  } else {
    console.error(`[kuendigung] ${angaben.referenz}: kein Betreiber-Arbeitsbereich für den Posteingang eingerichtet.`);
  }
}
