import crypto from "node:crypto";

/**
 * Laufender Abostatus-Abgleich von der Zentrale (secret58-web) ---
 * Gegenstück zu deren Stripe-Webhook: jedes Mal, wenn sich der Abostatus
 * eines Kunden dort ändert (aktiv, gekündigt zum Periodenende, abgelaufen,
 * Zahlungsausfall, Erstattung, Paketwechsel), schickt die Zentrale hier
 * einen signierten Push. Das 90-Sekunden-Entitlement-Token (src/lib/
 * entitlement.ts) gilt nur für den Login-Link selbst --- es sagt nichts
 * darüber aus, ob das Abo drei Wochen später noch aktiv ist. Das hier ist
 * der Mechanismus, der das laufend nachzieht.
 *
 * Signatur: HMAC-SHA256 über den rohen Anfrage-Body (wie beim
 * Stripe-Webhook --- nicht über das geparste Objekt, damit kein
 * Formatierungsunterschied zwischen Senden und Prüfen die Signatur
 * unbemerkt verändert). Dasselbe geteilte Geheimnis wie das
 * Entitlement-Token (ENTITLEMENT_SECRET/ENTITLEMENT_GEHEIMNIS) --- eigenes
 * zweites Geheimnis würde nur ein weiteres Betriebsgeheimnis bedeuten,
 * ohne einen echten Sicherheitsgewinn (beide Seiten vertrauen sich bereits
 * identisch).
 */
export const ABOSTATUS_TOLERANZ_SEKUNDEN = 300;

/**
 * Wie lange ein zuletzt bestätigter Abostatus (per Einlösung ODER per
 * Push) ohne erneute Bestätigung als gültig gilt --- danach verweigert
 * proxy.ts den Zugriff, auch wenn `status` noch ACTIVE in der DB steht.
 * 26h statt 24h, damit ein täglicher Abgleich mit etwas Spielraum nicht
 * ständig knapp an der Grenze läuft.
 */
export const ABOSTATUS_FRISCHE_STUNDEN = 26;

export interface AboStatusEreignisPayload {
  eventId: string;
  kundenschluessel: string;
  paketId: string;
  abrechnung: string;
  status: string;
  aktiv: boolean;
  kuendigtZumPeriodenende: boolean;
  laeuftBisEinschliesslich: number | null;
  gesendetUm: number; // Unix-Sekunden
}

export type AboStatusPruefungErgebnis =
  | { ok: true; ereignis: AboStatusEreignisPayload }
  | { ok: false; grund: string };

export function signiereAboStatusKoerper(rohKoerper: string, geheimnis: string): string {
  return crypto.createHmac("sha256", geheimnis).update(rohKoerper).digest("base64url");
}

export function pruefeAboStatusPush(
  rohKoerper: string,
  signatur: string | null,
  geheimnis: string,
  jetzt: number = Date.now(),
): AboStatusPruefungErgebnis {
  if (!geheimnis) return { ok: false, grund: "ENTITLEMENT_SECRET ist nicht gesetzt." };
  if (!signatur) return { ok: false, grund: "Fehlende Signatur." };

  const erwartet = signiereAboStatusKoerper(rohKoerper, geheimnis);
  const a = Buffer.from(signatur);
  const b = Buffer.from(erwartet);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, grund: "Signatur stimmt nicht." };
  }

  let ereignis: AboStatusEreignisPayload;
  try {
    ereignis = JSON.parse(rohKoerper);
  } catch {
    return { ok: false, grund: "Körper ist kein gültiges JSON." };
  }

  if (!ereignis.eventId || !ereignis.kundenschluessel || typeof ereignis.aktiv !== "boolean") {
    return { ok: false, grund: "Nutzlast unvollständig." };
  }
  const alterSekunden = Math.floor(jetzt / 1000) - Number(ereignis.gesendetUm);
  if (!Number.isFinite(alterSekunden) || alterSekunden > ABOSTATUS_TOLERANZ_SEKUNDEN || alterSekunden < -ABOSTATUS_TOLERANZ_SEKUNDEN) {
    return { ok: false, grund: "Zeitstempel außerhalb der Toleranz." };
  }

  return { ok: true, ereignis };
}
