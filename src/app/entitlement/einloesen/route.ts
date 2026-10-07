import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { isPackageId } from "@/lib/packages";
import { verifyEntitlementToken } from "@/lib/entitlement";

/**
 * GET /entitlement/einloesen?token=... --- Gegenstück zu
 * secret58-web server.js' "/social-media-ai/oeffnen": wer dort mit aktivem
 * Pro/Maxi angemeldet ist, landet mit einem frisch ausgestellten Token
 * hier und bekommt eine eigene Sitzung, ohne sich hier zu registrieren
 * oder ein zweites Mal zu bezahlen.
 *
 * Bei jedem Fehler (abgelaufen, falsch signiert, schon eingelöst) geht es
 * zurück zu /login --- nie mit einer Begründung, die verrät, woran genau
 * es lag (kein Orakel für jemanden, der an einem fremden Token herumprobiert).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const fehlgeschlagen = NextResponse.redirect(new URL("/login?entitlement=fehlgeschlagen", request.url));

  const geprueft = verifyEntitlementToken(token, process.env.ENTITLEMENT_SECRET ?? "");
  if (!geprueft.ok) {
    return fehlgeschlagen;
  }
  const { kundenschluessel, jti, paketId: packageId } = geprueft.payload;
  if (!isPackageId(packageId)) {
    return fehlgeschlagen;
  }

  // Replay-Schutz: dieser Eintrag muss NEU sein. Schlägt er wegen des
  // eindeutigen Index fehl, wurde genau dieses Token schon einmal
  // eingelöst --- dann hier abbrechen, bevor irgendetwas anderes passiert.
  try {
    await prisma.entitlementRedemption.create({ data: { jti } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return fehlgeschlagen;
    }
    throw error;
  }

  let user = await prisma.user.findUnique({ where: { externalKundenschluessel: kundenschluessel } });
  if (!user) {
    const slug = `ws-${crypto.randomBytes(8).toString("hex")}`;
    // Kein Passwort von außen: ein zufälliger, nie ausgegebener Hash ---
    // dieses Konto meldet sich ausschließlich über ein neues Entitlement-
    // Token der Zentrale an, nie über das Passwort-Formular hier.
    const passwordHash = `extern:${crypto.randomBytes(32).toString("hex")}`;
    user = await prisma.user.create({
      data: {
        email: `zentrale+${kundenschluessel}@entitlement.local`,
        name: "Kunde (Zentrale)",
        passwordHash,
        role: "OWNER",
        externalKundenschluessel: kundenschluessel,
        workspace: { create: { name: "Social Media AI", slug } },
      },
    });
  }

  // Eine License pro Zentrale-Kunde, nicht pro Einlösung --- sonst würde
  // jedes erneute Öffnen von "Social Media AI" eine weitere Zeile anlegen
  // und das Betreiber-Dashboard (Umsatz, Verkaufszahlen) verzerren, obwohl
  // kein neuer Kauf stattgefunden hat. "zentrale:" als Präfix ist eine
  // Kundenkennung, niemals eine echte Stripe-Checkout-Session-ID --- für
  // genau diesen Zweck erlaubt, weil das Feld nur Eindeutigkeit pro Kunde
  // braucht, nicht die echte Stripe-Herkunft.
  await prisma.license.upsert({
    where: { stripeCheckoutSessionId: `zentrale:${kundenschluessel}` },
    update: { status: "ACTIVE", packageId, origin: "zentrale" },
    create: {
      unlockToken: crypto.randomBytes(24).toString("hex"),
      stripeCheckoutSessionId: `zentrale:${kundenschluessel}`,
      status: "ACTIVE",
      packageId,
      origin: "zentrale",
      userId: user.id,
      workspaceId: user.workspaceId,
    },
  });

  const sessionToken = await createSessionToken(user.id);
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return response;
}
