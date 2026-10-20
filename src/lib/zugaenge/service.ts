import { Resolver } from "node:dns/promises";
import { prisma } from "@/lib/db";
import { decryptToken, encryptToken, isTokenEncryptionConfigured } from "@/lib/crypto";
import { ZUGANG_ANBIETER, absenderDomain, zugangFehler, type AnbieterKey } from "@/lib/zugaenge/anbieter";
import type { KiSchluessel } from "@/lib/ai/kiKontext";

/**
 * Eigene Zugänge eines Workspaces (Kunde trägt seinen Schlüssel selbst ein).
 * Werte liegen verschlüsselt in der Datenbank, werden nie an den Browser
 * gegeben und nie geloggt. Jeder Workspace sieht und nutzt nur seine eigenen.
 */
export type { AnbieterKey };

export interface ResendZugang {
  apiKey: string;
  absender: string;
}

const apiBase = () => (process.env.EMAIL_API_BASE?.trim() || "https://api.resend.com").replace(/\/+$/, "");

export async function zugaengeUebersicht(workspaceId: string) {
  const rows = await prisma.workspaceZugang.findMany({
    where: { workspaceId },
    select: { anbieter: true, endung: true, anzeige: true, status: true, meldung: true, geprueftAm: true, updatedAt: true },
  });
  return rows;
}

export async function zugangSpeichern(workspaceId: string, userId: string, anbieter: AnbieterKey, werte: Record<string, unknown>) {
  if (!isTokenEncryptionConfigured()) return { error: "Der Server kann Schlüssel derzeit nicht verschlüsselt speichern (TOKEN_ENCRYPTION_KEY fehlt). Bitte den Betreiber informieren." };
  const def = ZUGANG_ANBIETER[anbieter];
  const fehler = zugangFehler(def, werte);
  if (fehler) return { error: fehler };
  const sauber = Object.fromEntries(def.felder.map((f) => [f.key, String(werte[f.key]).trim()]));
  const geheim = def.felder.find((f) => f.geheim);
  const daten = {
    wertEnc: encryptToken(JSON.stringify(sauber)),
    endung: geheim ? sauber[geheim.key].slice(-4) : "",
    anzeige: def.felder.filter((f) => !f.geheim).map((f) => sauber[f.key]).join(" · "),
    status: "UNGEPRUEFT",
    meldung: "",
    geprueftAm: null,
    updatedById: userId,
  };
  await prisma.workspaceZugang.upsert({
    where: { workspaceId_anbieter: { workspaceId, anbieter } },
    create: { workspaceId, anbieter, ...daten },
    update: daten,
  });
  return zugangPruefen(workspaceId, anbieter);
}

export async function zugangLoeschen(workspaceId: string, anbieter: AnbieterKey) {
  await prisma.workspaceZugang.deleteMany({ where: { workspaceId, anbieter } });
}

async function werteLaden(workspaceId: string, anbieter: AnbieterKey): Promise<Record<string, string> | null> {
  const z = await prisma.workspaceZugang.findUnique({ where: { workspaceId_anbieter: { workspaceId, anbieter } } });
  if (!z || !isTokenEncryptionConfigured()) return null;
  try {
    return JSON.parse(decryptToken(z.wertEnc)) as Record<string, string>;
  } catch {
    return null;
  }
}

/** Prüft den Zugang beim Anbieter und speichert das Ergebnis. Gibt nie den Schlüssel zurück. */
export async function zugangPruefen(workspaceId: string, anbieter: AnbieterKey): Promise<{ status: "OK" | "FEHLER"; meldung: string }> {
  const w = await werteLaden(workspaceId, anbieter);
  const ergebnis = !w
    ? { status: "FEHLER" as const, meldung: "Kein lesbarer Zugang gespeichert. Bitte neu eintragen." }
    : anbieter === "RESEND"
      ? await resendPruefen({ apiKey: w.apiKey, absender: w.absender })
      : await kiPruefen(anbieter, w.apiKey);
  await prisma.workspaceZugang.updateMany({ where: { workspaceId, anbieter }, data: { status: ergebnis.status, meldung: ergebnis.meldung, geprueftAm: new Date() } });
  return ergebnis;
}

async function resendPruefen(z: ResendZugang): Promise<{ status: "OK" | "FEHLER"; meldung: string }> {
  const domain = absenderDomain(z.absender);
  if (!domain) return { status: "FEHLER", meldung: "Absender ist keine gültige E-Mail-Adresse." };
  let res: Response;
  try {
    res = await fetch(`${apiBase()}/domains`, { headers: { authorization: `Bearer ${z.apiKey}` }, signal: AbortSignal.timeout(10_000) });
  } catch {
    return { status: "FEHLER", meldung: "Resend ist gerade nicht erreichbar. Bitte später erneut prüfen." };
  }
  const body = (await res.json().catch(() => null)) as { name?: string; data?: { name?: string; status?: string }[] } | null;
  let ergebnis: { status: "OK" | "FEHLER"; meldung: string };
  if (res.status === 401 && body?.name === "restricted_api_key") {
    ergebnis = {
      status: "OK",
      meldung: `Schlüssel gültig (nur Versand). Ob ${domain} bei Resend bestätigt ist, kann mit diesem Schlüssel nicht abgefragt werden – unbestätigte Domains lehnt Resend beim Versand ab.`,
    };
  } else {
    if (!res.ok) return { status: "FEHLER", meldung: res.status === 401 || res.status === 403 ? "Schlüssel ungültig oder deaktiviert." : `Resend antwortete mit Status ${res.status}.` };
    const eintrag = (body?.data ?? []).find((d) => d.name?.toLowerCase() === domain);
    if (!eintrag) return { status: "FEHLER", meldung: `Die Domain ${domain} ist in diesem Resend-Konto nicht angelegt.` };
    if (eintrag.status !== "verified") return { status: "FEHLER", meldung: `Die Domain ${domain} ist bei Resend noch nicht bestätigt (Status: ${eintrag.status ?? "unbekannt"}). DNS-Einträge prüfen.` };
    ergebnis = { status: "OK", meldung: `Schlüssel gültig, Domain ${domain} bestätigt.` };
  }
  const dmarc = await dmarcPruefen(domain);
  if (dmarc.status === "FEHLT") {
    return {
      status: "FEHLER",
      meldung: `Für ${domain} fehlt ein DMARC-Eintrag. Gmail und Yahoo verlangen ihn von Massenversendern, sonst landen Mails im Spam oder werden abgelehnt. Beim Domain-Anbieter einen TXT-Eintrag „_dmarc.${dmarc.basis}“ mit dem Wert „v=DMARC1; p=none;“ anlegen und erneut prüfen.`,
    };
  }
  return { ...ergebnis, meldung: `${ergebnis.meldung} ${dmarc.status === "OK" ? `DMARC vorhanden (${dmarc.wo}).` : "DMARC konnte gerade nicht geprüft werden – bitte später erneut prüfen."}` };
}

/**
 * DMARC-Eintrag der Absenderdomain oder einer übergeordneten Domain
 * (_dmarc.<domain>, dann die Elternteile bis zur Registrierungsdomain).
 * DMARC_TEST_EINTRAEGE (JSON {name: wert}) ersetzt die DNS-Abfrage nur in Tests.
 */
export async function dmarcPruefen(domain: string): Promise<{ status: "OK" | "FEHLT" | "UNBEKANNT"; wo?: string; basis: string }> {
  const teile = domain.toLowerCase().split(".").filter(Boolean);
  const kandidaten: string[] = [];
  for (let i = 0; i <= teile.length - 2; i++) kandidaten.push(teile.slice(i).join("."));
  const basis = kandidaten[kandidaten.length - 1] ?? domain;
  const test = process.env.DMARC_TEST_EINTRAEGE;
  let unbekannt = false;
  for (const name of kandidaten) {
    let eintraege: string[] = [];
    if (test) {
      const wert = (JSON.parse(test) as Record<string, string>)[`_dmarc.${name}`];
      eintraege = wert ? [wert] : [];
    } else {
      try {
        const r = new Resolver({ timeout: 4000, tries: 2 });
        eintraege = (await r.resolveTxt(`_dmarc.${name}`)).map((t) => t.join(""));
      } catch (e) {
        const code = (e as { code?: string }).code;
        if (code !== "ENOTFOUND" && code !== "ENODATA") unbekannt = true;
      }
    }
    if (eintraege.some((t) => /^v=DMARC1\b/i.test(t.trim()))) return { status: "OK", wo: `_dmarc.${name}`, basis };
  }
  return { status: unbekannt ? "UNBEKANNT" : "FEHLT", basis };
}

/** Resend-Zugang des Workspaces, nur wenn zuletzt erfolgreich geprüft. */
export async function resendZugang(workspaceId: string): Promise<ResendZugang | null> {
  const z = await prisma.workspaceZugang.findUnique({ where: { workspaceId_anbieter: { workspaceId, anbieter: "RESEND" } }, select: { status: true } });
  if (z?.status !== "OK") return null;
  const w = await werteLaden(workspaceId, "RESEND");
  return w?.apiKey && w.absender ? { apiKey: w.apiKey, absender: w.absender } : null;
}

const KI_PRUEFUNG: Record<Exclude<AnbieterKey, "RESEND">, (key: string) => { url: string; headers: Record<string, string> }> = {
  ANTHROPIC: (key) => ({ url: `${(process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com").replace(/\/+$/, "")}/v1/models?limit=1`, headers: { "x-api-key": key, "anthropic-version": "2023-06-01" } }),
  OPENAI: (key) => ({ url: `${(process.env.OPENAI_BASE_URL || "https://api.openai.com").replace(/\/+$/, "")}/v1/models`, headers: { authorization: `Bearer ${key}` } }),
  GEMINI: (key) => ({ url: `${(process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com").replace(/\/+$/, "")}/v1beta/models?pageSize=1`, headers: { "x-goog-api-key": key } }),
};

/** Prüft einen KI-Schlüssel mit einer kostenlosen Abfrage (Modellliste) – es wird nichts generiert. */
async function kiPruefen(anbieter: Exclude<AnbieterKey, "RESEND">, key: string): Promise<{ status: "OK" | "FEHLER"; meldung: string }> {
  const { url, headers } = KI_PRUEFUNG[anbieter](key);
  const name = ZUGANG_ANBIETER[anbieter].name;
  let res: Response;
  try {
    res = await fetch(url, { headers, signal: AbortSignal.timeout(10_000), cache: "no-store" });
  } catch {
    return { status: "FEHLER", meldung: `${name} ist gerade nicht erreichbar. Bitte später erneut prüfen.` };
  }
  if (res.ok) return { status: "OK", meldung: `Schlüssel gültig. Bitte bei ${name} Guthaben bzw. Abrechnung und ein Ausgabenlimit prüfen.` };
  if (res.status === 429) return { status: "OK", meldung: `Schlüssel gültig, aber das Anfragelimit bei ${name} ist gerade erreicht.` };
  if (res.status === 400 || res.status === 401 || res.status === 403) return { status: "FEHLER", meldung: "Schlüssel ungültig, gesperrt oder ohne Berechtigung." };
  return { status: "FEHLER", meldung: `${name} antwortete mit Status ${res.status}.` };
}

/**
 * KI-Schlüssel für einen Workspace: Kunden nur ihre eigenen (zuletzt erfolgreich
 * geprüft), ohne Rückgriff auf die Betreiber-Schlüssel. Workspaces des Betreibers
 * nutzen die Schlüssel des Servers.
 */
export async function kiSchluesselFuer(workspaceId: string): Promise<KiSchluessel> {
  const betreiber = await prisma.user.findFirst({ where: { workspaceId, isOperator: true }, select: { id: true } });
  if (betreiber) return { quelle: "BETREIBER" };
  const rows = await prisma.workspaceZugang.findMany({ where: { workspaceId, anbieter: { in: ["ANTHROPIC", "OPENAI", "GEMINI"] }, status: "OK" }, select: { anbieter: true } });
  const out: KiSchluessel = { quelle: "KUNDE" };
  for (const r of rows) {
    const w = await werteLaden(workspaceId, r.anbieter as AnbieterKey);
    if (!w?.apiKey) continue;
    if (r.anbieter === "ANTHROPIC") out.anthropic = w.apiKey;
    if (r.anbieter === "OPENAI") out.openai = w.apiKey;
    if (r.anbieter === "GEMINI") out.gemini = w.apiKey;
  }
  return out;
}
