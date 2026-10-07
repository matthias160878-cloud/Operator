import crypto from "node:crypto";

/**
 * Entitlement-Token — Gegenstück zu kern/entitlement.js in secret58-web
 * ("der Zentrale"). Wer dort mit aktivem Pro/Maxi angemeldet "Social Media
 * AI" öffnet, bekommt hier kein zweites Konto und kauft hier kein zweites
 * Mal ein Paket — die Zentrale stellt stattdessen ein kurzlebiges,
 * signiertes Token aus, das diese Datei prüft.
 *
 * Dieselbe Bauart wie auf der Zentrale-Seite: HMAC-SHA256 über node:crypto,
 * keine JWT-Bibliothek. ENTITLEMENT_SECRET muss auf beiden Seiten exakt
 * derselbe Wert sein wie ENTITLEMENT_GEHEIMNIS dort — sonst scheitert jedes
 * Token an der Signaturprüfung, nie an einer falschen Vermutung über das
 * Format.
 *
 * Format: <base64url(JSON-Nutzlast)>.<base64url(HMAC-SHA256 darüber)>
 *
 * Replay-Schutz (das `jti`-Feld) prüft dieses Modul nicht selbst — das
 * macht die einlösende Route anhand der `EntitlementRedemption`-Tabelle,
 * weil nur sie Datenbankzugriff hat.
 */

export interface EntitlementPayload {
  kundenschluessel: string;
  paketId: string;
  abrechnung: string;
  ausgestelltAm: number;
  gueltigBis: number;
  jti: string;
}

export type EntitlementVerifyResult =
  | { ok: true; payload: EntitlementPayload }
  | { ok: false; reason: string };

function base64url(buffer: Buffer): string {
  return buffer.toString("base64url");
}

function signPayload(payloadBase64: string, secret: string): string {
  return base64url(crypto.createHmac("sha256", secret).update(payloadBase64).digest());
}

export function verifyEntitlementToken(
  token: string,
  secret: string,
  now: number = Date.now(),
): EntitlementVerifyResult {
  if (!secret) {
    return { ok: false, reason: "ENTITLEMENT_SECRET ist nicht gesetzt." };
  }
  const parts = String(token || "").split(".");
  if (parts.length !== 2) {
    return { ok: false, reason: "Token hat nicht die erwartete Form." };
  }
  const [payloadBase64, receivedSignature] = parts;

  const expectedSignature = signPayload(payloadBase64, secret);
  const received = Buffer.from(receivedSignature);
  const expected = Buffer.from(expectedSignature);
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    return { ok: false, reason: "Signatur stimmt nicht." };
  }

  let payload: EntitlementPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "Nutzlast ist kein gültiges JSON." };
  }

  if (!payload.kundenschluessel || !payload.paketId || !payload.jti) {
    return { ok: false, reason: "Nutzlast unvollständig." };
  }
  if (Math.floor(now / 1000) > Number(payload.gueltigBis)) {
    return { ok: false, reason: "Token ist abgelaufen." };
  }

  return { ok: true, payload };
}
