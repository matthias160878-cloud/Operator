/**
 * Pilotstudio – Nachfrageprüfung (fünf KMU-Gespräche), Einrichtung sowie Export/Import.
 * Nur für den Betreiberbereich. Gespräche starten leer; nichts wird vorab erfunden.
 */
import { z } from "zod";
import { prisma } from "@/lib/db";
import { clean, PilotError, type Actor } from "@/lib/pilotstudio/service";
import { CATEGORIES, classify } from "@/lib/pilotstudio/guard";

export const INTEREST = ["UNGEFRAGT", "KEIN_INTERESSE", "UNKLAR", "WEITERES_GESPRAECH", "PILOT_PRUEFEN"] as const;
export const SLOTS = [1, 2, 3, 4, 5];

export const CHECKLIST = [
  ["wissen", "Unternehmensinformationen (Leistungen, Preise, Bedingungen) freigegeben"],
  ["regeln", "Antwortregeln festgelegt (was nie zugesagt wird)"],
  ["zustaendig", "Zuständige Personen für Zahlung, Datenschutz, Verträge benannt"],
  ["ki", "KI-Anbieter gewählt, Schlüssel im Server hinterlegt, Verbrauchsgrenze gesetzt"],
  ["kanal", "Genau ein Eingangskanal gewählt und mit Testkonto geprüft"],
  ["versand", "Versand (Resend) mit Testadresse geprüft, Absender bestätigt"],
  ["tests", "Alle zehn Testfälle bestanden"],
  ["datenschutz", "Datenschutzhinweis und Auftragsverarbeitung mit Anbietern geklärt"],
  ["freigabe", "Ausdrückliche Freigabe für Live-Versand durch Matthias"],
] as const;

export async function listInterviews(workspaceId: string) {
  const rows = await prisma.pilotInterview.findMany({ where: { workspaceId }, orderBy: { slot: "asc" } });
  const missing = SLOTS.filter((s) => !rows.some((r) => r.slot === s));
  if (missing.length) {
    for (const slot of missing) {
      await prisma.pilotInterview.upsert({ where: { workspaceId_slot: { workspaceId, slot } }, create: { workspaceId, slot }, update: {} });
    }
    return prisma.pilotInterview.findMany({ where: { workspaceId }, orderBy: { slot: "asc" } });
  }
  return rows;
}

const num = z.union([z.number(), z.null()]).optional().transform((v) => (v == null || !Number.isFinite(v) ? null : v));
const interviewSchema = z.object({
  firmCode: z.string().max(40).default(""),
  industry: z.string().max(120).default(""),
  channels: z.string().max(300).default(""),
  inquiriesPerWeek: num.refine((v) => v == null || (v >= 0 && v <= 100000), "Anzahl ungültig"),
  minutesPerInquiry: num.refine((v) => v == null || (v >= 0 && v <= 1440), "Minuten ungültig"),
  topIssues: z.string().max(2000).default(""),
  biggestEffort: z.string().max(2000).default(""),
  humanDecisions: z.string().max(2000).default(""),
  desiredOutcome: z.string().max(2000).default(""),
  interest: z.enum(INTEREST).default("UNGEFRAGT"),
  budgetText: z.string().max(200).default(""),
  budgetCurrency: z.string().regex(/^([A-Z]{3})?$/, "Währung als ISO-Code, z. B. EUR").default(""),
  interviewDate: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/).default(""),
  notes: z.string().max(8000).default(""),
  nextStep: z.string().max(1000).default(""),
});
type InterviewData = z.infer<typeof interviewSchema>;

function cleanInterview(d: InterviewData) {
  const out: Record<string, unknown> = { ...d };
  for (const [k, v] of Object.entries(out)) if (typeof v === "string") out[k] = clean(v, 8000);
  return out as InterviewData;
}

export async function saveInterview(workspaceId: string, actor: Actor, slot: number, raw: unknown) {
  if (!SLOTS.includes(slot)) throw new PilotError(404, "Gespräch nicht gefunden.");
  const p = interviewSchema.safeParse(raw);
  if (!p.success) throw new PilotError(400, `Ungültige Angaben: ${p.error.issues[0]?.message ?? "bitte prüfen"}.`);
  const d = cleanInterview(p.data);
  if (d.budgetText.trim() && !d.budgetCurrency) throw new PilotError(400, "Bitte zum Budgetrahmen die Währung angeben.");
  await prisma.pilotInterview.upsert({ where: { workspaceId_slot: { workspaceId, slot } }, create: { workspaceId, slot, ...d }, update: d });
  await prisma.pilotEvent.create({ data: { workspaceId, userId: actor.id, actor: actor.name, action: "Gespräch gespeichert", detail: `Gespräch ${slot}` } });
}

/** Heutiger Wochenaufwand in Minuten (Volumen × Bearbeitungszeit); null = nicht erhoben. Keine Einsparungszusage. */
export function weeklyMinutes(r: { inquiriesPerWeek: number | null; minutesPerInquiry: number | null }) {
  return r.inquiriesPerWeek != null && r.minutesPerInquiry != null ? Math.round(r.inquiriesPerWeek * r.minutesPerInquiry) : null;
}

export async function getConfig(workspaceId: string) {
  const c = await prisma.pilotConfig.findUnique({ where: { workspaceId } });
  let checklist: Record<string, boolean> = {};
  try {
    checklist = JSON.parse(c?.checklist || "{}");
  } catch {
    checklist = {};
  }
  return { knowledge: c?.knowledge ?? "", rules: c?.rules ?? "", responsibilities: c?.responsibilities ?? "", checklist };
}

const configSchema = z.object({
  knowledge: z.string().max(20000).default(""),
  rules: z.string().max(8000).default(""),
  responsibilities: z.string().max(4000).default(""),
  checklist: z.record(z.string(), z.boolean()).default({}),
});

export async function saveConfig(workspaceId: string, actor: Actor, raw: unknown) {
  const p = configSchema.safeParse(raw);
  if (!p.success) throw new PilotError(400, "Ungültige Einrichtungsangaben.");
  const keys = new Set<string>(CHECKLIST.map((c) => c[0]));
  const checklist = Object.fromEntries(Object.entries(p.data.checklist).filter(([k]) => keys.has(k)));
  const data = { knowledge: clean(p.data.knowledge, 20000), rules: clean(p.data.rules, 8000), responsibilities: clean(p.data.responsibilities, 4000), checklist: JSON.stringify(checklist) };
  await prisma.pilotConfig.upsert({ where: { workspaceId }, create: { workspaceId, ...data }, update: data });
  await prisma.pilotEvent.create({ data: { workspaceId, userId: actor.id, actor: actor.name, action: "Einrichtung gespeichert" } });
}

// ---------------------------------------------------------------- Export / Import
export const EXPORT_FORMAT = "secret58-pilotstudio";

export async function exportAll(workspaceId: string) {
  const [inquiries, interviews, config] = await Promise.all([
    prisma.pilotInquiry.findMany({ where: { workspaceId }, orderBy: { createdAt: "asc" } }),
    listInterviews(workspaceId),
    getConfig(workspaceId),
  ]);
  return {
    format: EXPORT_FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    hinweis: "Enthält keine Zugangsschlüssel. Freigaben und Versandstatus werden beim Import nicht übernommen.",
    inquiries: inquiries.map((i) => ({
      isDemo: i.isDemo, demoCaseNo: i.demoCaseNo, channel: i.channel, receivedAt: i.receivedAt.toISOString(), subject: i.subject, body: i.body,
      senderName: i.senderName, senderContact: i.senderContact, category: i.category, assignee: i.assignee, needsHuman: i.needsHuman,
      draftText: i.draftText, draftSource: i.draftSource, testMode: i.testMode, expected: i.expected, manualMinutes: i.manualMinutes,
      pilotMinutes: i.pilotMinutes, corrections: i.corrections, correctionKinds: i.correctionKinds, testResult: i.testResult, testReason: i.testReason,
    })),
    interviews: interviews.map((r) => ({
      slot: r.slot, firmCode: r.firmCode, industry: r.industry, channels: r.channels, inquiriesPerWeek: r.inquiriesPerWeek,
      minutesPerInquiry: r.minutesPerInquiry, topIssues: r.topIssues, biggestEffort: r.biggestEffort, humanDecisions: r.humanDecisions,
      desiredOutcome: r.desiredOutcome, interest: r.interest, budgetText: r.budgetText, budgetCurrency: r.budgetCurrency,
      interviewDate: r.interviewDate, notes: r.notes, nextStep: r.nextStep,
    })),
    config,
  };
}

const s = (max: number) => z.string().max(max).default("");
const importSchema = z.object({
  format: z.literal(EXPORT_FORMAT),
  version: z.literal(1),
  inquiries: z.array(z.object({
    isDemo: z.boolean().default(false), demoCaseNo: z.number().int().min(1).max(10).nullable().default(null),
    channel: z.enum(["E-Mail", "Webformular", "Chat", "Telefon", "manuell"]).default("manuell"),
    receivedAt: z.string().max(40).optional(), subject: z.string().min(1).max(200), body: z.string().min(1).max(8000),
    senderName: s(120), senderContact: s(200), category: z.enum(CATEGORIES).default("unklar"), assignee: s(120), needsHuman: z.boolean().default(false),
    draftText: s(4000), draftSource: s(40), testMode: z.enum(["DEMO", "KI", "KANAL"]).default("DEMO"), expected: s(500),
    manualMinutes: z.number().min(0).max(10000).nullable().default(null), pilotMinutes: z.number().min(0).max(10000).nullable().default(null),
    corrections: z.number().int().min(0).max(1000).default(0), correctionKinds: s(300),
    testResult: z.enum(["OFFEN", "BESTANDEN", "NICHT_BESTANDEN"]).default("OFFEN"), testReason: s(2000),
  }).strict()).max(500).default([]),
  interviews: z.array(z.object({ slot: z.number().int().min(1).max(5) }).passthrough()).max(5).default([]),
  config: configSchema.optional(),
}).passthrough();

const ACTIVE = /<\s*\/?\s*(script|iframe|object|embed|svg|style)\b|javascript:|data:text\/html|\bon[a-z]+\s*=/i;

function hasActiveContent(v: unknown): boolean {
  if (typeof v === "string") return ACTIVE.test(v);
  if (Array.isArray(v)) return v.some(hasActiveContent);
  if (v && typeof v === "object") return Object.values(v).some(hasActiveContent);
  return false;
}

export async function importAll(workspaceId: string, actor: Actor, raw: unknown, opts: { overwrite: boolean; confirmed: boolean }) {
  if (raw == null || typeof raw !== "object") throw new PilotError(400, "Datei ist kein gültiger Export.");
  if (hasActiveContent(raw)) throw new PilotError(400, "Import abgelehnt: Die Datei enthält ausführbare Inhalte (Skripte oder Ereignis-Attribute).");
  const p = importSchema.safeParse(raw);
  if (!p.success) throw new PilotError(400, `Datei hat nicht das Pilotstudio-Format (${p.error.issues[0]?.path.join(".") || "Aufbau"}).`);
  if (opts.overwrite && !opts.confirmed) throw new PilotError(409, "Überschreiben muss ausdrücklich bestätigt werden.");
  const d = p.data;
  const interviews = d.interviews.map((r) => {
    const q = interviewSchema.safeParse(r);
    if (!q.success) throw new PilotError(400, `Gespräch ${r.slot}: ungültige Angaben.`);
    return { slot: r.slot, data: cleanInterview(q.data) };
  });
  await prisma.$transaction(async (tx) => {
    if (opts.overwrite) await tx.pilotInquiry.deleteMany({ where: { workspaceId } });
    for (const i of d.inquiries) {
      const recv = i.receivedAt && !Number.isNaN(Date.parse(i.receivedAt)) ? new Date(i.receivedAt) : new Date();
      const c = classify(i.subject, i.body);
      await tx.pilotInquiry.create({
        data: {
          workspaceId, isDemo: i.isDemo, demoCaseNo: i.isDemo ? i.demoCaseNo : null, channel: i.channel, receivedAt: recv,
          subject: clean(i.subject, 200), body: clean(i.body, 8000), senderName: clean(i.senderName, 120), senderContact: clean(i.senderContact, 200),
          category: i.category, assignee: clean(i.assignee, 120), needsHuman: i.needsHuman || c.needsHuman, riskNote: c.riskNote,
          draftText: clean(i.draftText, 4000), draftVersion: i.draftText ? 1 : 0, draftSource: clean(i.draftSource, 40),
          // Freigaben/Versand werden nie importiert: alles mit Text geht zurück in die Prüfung.
          status: i.draftText ? "PRUEFUNG" : "NEU",
          testMode: i.testMode, expected: clean(i.expected, 500), manualMinutes: i.manualMinutes, pilotMinutes: i.pilotMinutes,
          corrections: i.corrections, correctionKinds: clean(i.correctionKinds, 300), testResult: i.testResult, testReason: clean(i.testReason, 2000),
        },
      });
    }
    for (const r of interviews) {
      await tx.pilotInterview.upsert({ where: { workspaceId_slot: { workspaceId, slot: r.slot } }, create: { workspaceId, slot: r.slot, ...r.data }, update: r.data });
    }
  });
  if (d.config) await saveConfig(workspaceId, actor, d.config);
  await prisma.pilotEvent.create({ data: { workspaceId, userId: actor.id, actor: actor.name, action: opts.overwrite ? "Import (überschrieben)" : "Import (ergänzt)", detail: `${d.inquiries.length} Anfragen, ${interviews.length} Gespräche` } });
  return { inquiries: d.inquiries.length, interviews: interviews.length };
}
