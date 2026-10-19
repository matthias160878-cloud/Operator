import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { NotFoundError, route } from "@/lib/api";
import { requireSessionUser } from "@/lib/auth/session";
import { darfBearbeiten, darfFreigeben } from "@/lib/reichweite/zugriff";
import { protokoll } from "@/lib/reichweite/service";
import { ausgabeHash, darfUebergang, themenLesen, versandModus } from "@/lib/reichweitenaufbau/newsletterKunden";

const schema = z.object({ aktion: z.enum(["pruefen", "freigeben", "planen", "zurueck", "versenden"]), geplantAm: z.string().optional() });

/**
 * Statuswechsel einer Newsletter-Ausgabe. Freigeben und Versenden nur durch
 * Inhaber/Admin. Versand: im DEMO-Modus wird nichts verschickt, nur als Demo
 * protokolliert; echter Versand ist noch nicht umgesetzt.
 */
async function handlePOST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSessionUser();
  if (!darfBearbeiten(user.role)) return NextResponse.json({ error: "Für diese Aktion fehlen die Rechte (nur Lesen)." }, { status: 403 });
  const { id } = await params;
  const a = await prisma.newsletterAusgabe.findFirst({ where: { id, workspaceId: user.workspaceId } });
  if (!a) throw new NotFoundError();
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Unbekannte Aktion." }, { status: 400 });
  const { aktion } = parsed.data;
  if ((aktion === "freigeben" || aktion === "versenden" || aktion === "planen") && !darfFreigeben(user.role)) {
    return NextResponse.json({ error: "Freigeben, Planen und Versenden dürfen nur Inhaber und Admins." }, { status: 403 });
  }
  if (!darfUebergang(aktion, a.status)) return NextResponse.json({ error: `„${aktion}“ ist im Status ${a.status} nicht möglich.` }, { status: 409 });

  if (aktion === "pruefen") await prisma.newsletterAusgabe.update({ where: { id }, data: { status: "PRUEFUNG" } });
  if (aktion === "zurueck") await prisma.newsletterAusgabe.update({ where: { id }, data: { status: "ENTWURF", freigabeHash: null, freigegebenAm: null, freigegebenVonId: null, geplantAm: null } });
  if (aktion === "freigeben") {
    await prisma.newsletterAusgabe.update({
      where: { id },
      data: { status: "FREIGEGEBEN", freigabeHash: ausgabeHash(a.betreff, a.text), freigegebenAm: new Date(), freigegebenVonId: user.userId },
    });
  }
  if (aktion === "planen") {
    const t = parsed.data.geplantAm ? new Date(parsed.data.geplantAm) : null;
    if (!t || Number.isNaN(t.getTime()) || t.getTime() < Date.now()) return NextResponse.json({ error: "Bitte einen Versandzeitpunkt in der Zukunft angeben." }, { status: 400 });
    await prisma.newsletterAusgabe.update({ where: { id }, data: { status: "GEPLANT", geplantAm: t } });
  }
  if (aktion === "versenden") {
    if (a.freigabeHash !== ausgabeHash(a.betreff, a.text)) return NextResponse.json({ error: "Der Text weicht von der Freigabe ab." }, { status: 409 });
    const themen = themenLesen(a.themen);
    // Demo-Ausgaben zählen nur Demo-Kontakte, echte Ausgaben nur echte Kontakte.
    const aktive = await prisma.newsletterKontakt.findMany({ where: { workspaceId: user.workspaceId, status: "ACTIVE", istDemo: a.istDemo }, select: { themen: true } });
    const empfaenger = aktive.filter((k) => !themen.length || themenLesen(k.themen).some((t) => themen.includes(t))).length;
    if (versandModus() === "ECHT" && !a.istDemo) {
      return NextResponse.json({ error: "Echter Newsletter-Versand ist noch nicht umgesetzt. Es wurde nichts versendet." }, { status: 501 });
    }
    await prisma.newsletterAusgabe.update({ where: { id }, data: { status: "VERSENDET_DEMO", versendetAm: new Date(), empfaengerAnzahl: empfaenger } });
    await protokoll(user.workspaceId, user.userId, "reichweitenaufbau.ausgabe_demo_versand", id);
    return NextResponse.json({ ok: true, demo: true, empfaenger, hinweis: `DEMO: Es wurde keine E-Mail versendet. ${empfaenger} bestätigte Kontakte hätten diese Ausgabe erhalten.` });
  }
  await protokoll(user.workspaceId, user.userId, `reichweitenaufbau.ausgabe_${aktion}`, id);
  return NextResponse.json({ ok: true });
}

export const POST = route(handlePOST);
