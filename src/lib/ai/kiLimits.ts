import { prisma } from "@/lib/db";
import { QuotaError } from "@/lib/entitlements";
import { kostenSchaetzen, type KostenSchaetzung } from "@/lib/ai/kosten";
import type { KiAnbieter } from "@/lib/ai/modelle";

/**
 * Konfigurierbare Verbrauchslimits je Workspace für KI mit eigenem Schlüssel
 * (Einstellungen → Eigene Zugänge). Gezählt werden Aufrufe und die geschätzten
 * Kosten im laufenden Monat. Leer = kein eigenes Limit.
 */
export const LIMIT_AUFRUFE = "ki.limit.aufrufeMonat";
export const LIMIT_KOSTEN = "ki.limit.kostenMonatUsd";

const monat = (d = new Date()) => d.toISOString().slice(0, 7);

export interface KiLimits {
  aufrufeMonat: number | null;
  kostenMonatUsd: number | null;
}

export async function kiLimitsLesen(workspaceId: string): Promise<KiLimits> {
  const rows = await prisma.setting.findMany({ where: { workspaceId, key: { in: [LIMIT_AUFRUFE, LIMIT_KOSTEN] } } });
  const zahl = (k: string) => {
    const v = Number(rows.find((r) => r.key === k)?.value ?? "");
    return Number.isFinite(v) && v > 0 ? v : null;
  };
  return { aufrufeMonat: zahl(LIMIT_AUFRUFE), kostenMonatUsd: zahl(LIMIT_KOSTEN) };
}

export async function kiLimitsSpeichern(workspaceId: string, l: KiLimits) {
  for (const [key, wert] of [[LIMIT_AUFRUFE, l.aufrufeMonat], [LIMIT_KOSTEN, l.kostenMonatUsd]] as const) {
    if (wert === null) await prisma.setting.deleteMany({ where: { workspaceId, key } });
    else await prisma.setting.upsert({ where: { workspaceId_key: { workspaceId, key } }, create: { workspaceId, key, value: String(wert) }, update: { value: String(wert) } });
  }
}

export async function kiVerbrauch(workspaceId: string) {
  const v = await prisma.kiVerbrauch.findUnique({ where: { workspaceId_monat: { workspaceId, monat: monat() } } });
  return { monat: monat(), aufrufe: v?.aufrufe ?? 0, kostenUsd: (v?.kostenMikroUsd ?? 0) / 1_000_000, ohnePreis: v?.ohnePreis ?? 0 };
}

/** Vor einem Aufruf: Limit prüfen. Wirft QuotaError (429), wenn ein Limit erreicht würde. */
export async function kiLimitPruefen(workspaceId: string, anbieter: KiAnbieter, eingabeZeichen: number, ausgabeTokenMax: number): Promise<KostenSchaetzung> {
  const schaetzung = kostenSchaetzen(anbieter, eingabeZeichen, ausgabeTokenMax);
  const [limits, v] = await Promise.all([kiLimitsLesen(workspaceId), kiVerbrauch(workspaceId)]);
  if (limits.aufrufeMonat !== null && v.aufrufe + 1 > limits.aufrufeMonat) {
    throw new QuotaError(`Ihr KI-Limit von ${limits.aufrufeMonat} Aufrufen in diesem Monat ist erreicht (Einstellungen → Eigene Zugänge).`, 429, "QUOTA_EXCEEDED", "AI_TEXT");
  }
  if (limits.kostenMonatUsd !== null) {
    if (!schaetzung.berechenbar) {
      throw new QuotaError(`Für ${schaetzung.modell} sind die Kosten nicht berechenbar; mit gesetztem Kostenlimit wird der Aufruf nicht ausgeführt.`, 429, "QUOTA_EXCEEDED", "AI_TEXT");
    }
    if (v.kostenUsd + (schaetzung.usdMax ?? 0) > limits.kostenMonatUsd) {
      throw new QuotaError(`Ihr KI-Kostenlimit von ${limits.kostenMonatUsd} $ in diesem Monat würde überschritten (geschätzt bisher ${v.kostenUsd.toFixed(2)} $).`, 429, "QUOTA_EXCEEDED", "AI_TEXT");
    }
  }
  return schaetzung;
}

/** Nach einem Aufruf: Verbrauch buchen (Schätzung aus tatsächlicher Antwortlänge). */
export async function kiVerbrauchBuchen(workspaceId: string, anbieter: KiAnbieter, eingabeZeichen: number, ausgabeZeichen: number) {
  const s = kostenSchaetzen(anbieter, eingabeZeichen, Math.ceil(ausgabeZeichen / 3));
  const mikro = s.usdMax === null ? 0 : Math.ceil(s.usdMax * 1_000_000);
  await prisma.kiVerbrauch.upsert({
    where: { workspaceId_monat: { workspaceId, monat: monat() } },
    create: { workspaceId, monat: monat(), aufrufe: 1, kostenMikroUsd: mikro, ohnePreis: s.berechenbar ? 0 : 1 },
    update: { aufrufe: { increment: 1 }, kostenMikroUsd: { increment: mikro }, ohnePreis: { increment: s.berechenbar ? 0 : 1 } },
  });
}
