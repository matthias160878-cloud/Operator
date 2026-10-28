import { createHmac } from "node:crypto";
import { hermesRequest } from "@/lib/hermes/client";
import { publicState, type HermesProfile } from "@/lib/hermes/config";

/**
 * Sicherheitsprüfung des öffentlichen Hermes-Profils — FAIL-CLOSED.
 *
 * Was die Hermes-Dokumentation hergibt: Der API-Server stellt standardmäßig den vollen Werkzeugsatz
 * bereit (Terminal, Dateien, Web, Speicher …). Es gibt keine Sperre pro Anfrage und keinen
 * dokumentierten Modus „ganz ohne Werkzeuge“. `GET /v1/toolsets` meldet nur, welche Toolsets für die
 * Plattform `api_server` aktiviert sind — das ist ein Konfigurationsstand, kein Beweis für die bei einer
 * einzelnen Anfrage tatsächlich aktiven Werkzeuge. Ein Systemprompt ist keine technische Sperre.
 *
 * Darum gilt: Der öffentliche Chat läuft nur, wenn (1) der Betreiber das Profil ausdrücklich als geprüft
 * bestätigt hat (HERMES_PUBLIC_TOOLS_ATTESTED), (2) diese Prüfung bestanden ist und (3) bei einer
 * Antwort mit Werkzeug-Anzeichen sofort für 15 Minuten abgeschaltet wird. Jede Unklarheit = nicht verfügbar.
 */
export const PUBLIC_ALLOWED_TOOLSETS = new Set(["clarify", "todo"]);

export interface ToolsetsVerdict {
  safe: boolean;
  enabled: string[];
  reason: string;
}

/** Liest die (undokumentierte Form der) Antwort von /v1/toolsets; alles Unbekannte → nicht sicher. */
export function evaluateToolsets(data: unknown): ToolsetsVerdict {
  const list: unknown = Array.isArray(data)
    ? data
    : data && typeof data === "object"
      ? (data as Record<string, unknown>).toolsets ?? (data as Record<string, unknown>).data
      : undefined;
  if (!Array.isArray(list) || list.length === 0) return { safe: false, enabled: [], reason: "Antwort nicht lesbar oder leer" };
  const enabled: string[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") return { safe: false, enabled, reason: "Eintrag nicht lesbar" };
    const o = item as Record<string, unknown>;
    const name = [o.name, o.id, o.key, o.toolset].find((v) => typeof v === "string") as string | undefined;
    if (!name || typeof o.enabled !== "boolean") return { safe: false, enabled, reason: "Eintrag ohne Name oder enabled" };
    if (o.enabled) enabled.push(name.toLowerCase());
  }
  const bad = enabled.filter((n) => !PUBLIC_ALLOWED_TOOLSETS.has(n));
  if (bad.length) return { safe: false, enabled, reason: `aktive Toolsets nicht erlaubt: ${bad.join(", ")}` };
  return { safe: true, enabled, reason: "ok" };
}

interface Cache { at: number; ok: boolean; reason: string; profileKey: string }
const g = globalThis as unknown as { __s58HermesPublic?: { cache?: Cache; disabledUntil: number; inFlight: number } };
const mem = (g.__s58HermesPublic ??= { disabledUntil: 0, inFlight: 0 });

export const publicRuntime = mem;

/** Meldet ein Anzeichen für Werkzeugnutzung: öffentlicher Chat für 15 Minuten aus. */
export function tripBreaker(minutes = 15) {
  mem.disabledUntil = Date.now() + minutes * 60_000;
  mem.cache = undefined;
  console.error(`[hermes] Anzeichen für Werkzeugnutzung im öffentlichen Chat — für ${minutes} Minuten abgeschaltet.`);
}

async function verifyProfile(profile: HermesProfile): Promise<{ ok: boolean; reason: string }> {
  try {
    await hermesRequest(profile, "/health", { timeoutMs: 4000 });
    const toolsets = await hermesRequest(profile, "/v1/toolsets", { timeoutMs: 5000 });
    const verdict = evaluateToolsets(toolsets);
    return { ok: verdict.safe, reason: verdict.reason };
  } catch {
    return { ok: false, reason: "Dienst nicht erreichbar oder Prüfung fehlgeschlagen" };
  }
}

/** Betreiberansicht: warum der öffentliche Chat gerade nicht läuft (nie an Besucher geben). */
export async function publicHermesStatus(): Promise<{ available: boolean; reasons: string[] }> {
  const state = publicState();
  if (!state.ok) return { available: false, reasons: state.missing };
  if (Date.now() < mem.disabledUntil) return { available: false, reasons: ["wegen Werkzeug-Anzeichen vorübergehend abgeschaltet"] };
  const profileKey = `${state.profile.baseUrl}|${state.profile.key.length}`;
  const c = mem.cache;
  const ttl = Number(process.env.HERMES_VERIFY_TTL_MS);
  const okTtl = Number.isFinite(ttl) && ttl > 0 ? ttl : 60_000;
  const badTtl = Number.isFinite(ttl) && ttl > 0 ? ttl : 15_000;
  if (c && c.profileKey === profileKey && Date.now() - c.at < (c.ok ? okTtl : badTtl)) {
    return { available: c.ok, reasons: c.ok ? [] : [c.reason] };
  }
  const v = await verifyProfile(state.profile);
  mem.cache = { at: Date.now(), ok: v.ok, reason: v.reason, profileKey };
  return { available: v.ok, reasons: v.ok ? [] : [v.reason] };
}

export async function publicHermesAvailable(): Promise<boolean> {
  return (await publicHermesStatus()).available;
}

/** Besucherkennung für Limits: nur ein HMAC der Adresse wird gespeichert, nie die Adresse selbst. */
export function visitorKey(ip: string, secret: string): string {
  return createHmac("sha256", secret).update(ip).digest("hex").slice(0, 32);
}
