import { hermesChat, HermesError, type ChatTurn } from "@/lib/hermes/client";
import { publicRuntime, tripBreaker } from "@/lib/hermes/publicSafety";
import { publicState } from "@/lib/hermes/config";
import { SYSTEMPROMPT } from "@/lib/zentrale/prompts";

export const LIMITS = {
  maxMessages: 8,
  maxUserChars: 600,
  maxTotalChars: 3000,
  maxBodyChars: 8000,
  maxTokens: 400,
  maxReplyChars: 1500,
  timeoutMs: 20_000,
  maxConcurrent: 4,
} as const;

const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

export type History = { role: "user" | "assistant"; content: string }[];

/** Prüft Format und Größe des Verlaufs. Gibt einen Fehlercode oder den bereinigten Verlauf zurück. */
export function sanitizeHistory(raw: unknown): { ok: true; history: History } | { ok: false; error: "ungueltige_anfrage" | "zu_lang" } {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 40) return { ok: false, error: "ungueltige_anfrage" };
  const out: History = [];
  for (const m of raw.slice(-LIMITS.maxMessages)) {
    if (!m || typeof m !== "object") return { ok: false, error: "ungueltige_anfrage" };
    const { role, content } = m as { role?: unknown; content?: unknown };
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return { ok: false, error: "ungueltige_anfrage" };
    const clean = content.replace(CONTROL, "").trim();
    if (role === "user" && clean.length > LIMITS.maxUserChars) return { ok: false, error: "zu_lang" };
    out.push({ role, content: clean.slice(0, LIMITS.maxUserChars) });
  }
  while (out.length && out[0].role !== "user") out.shift();
  if (!out.length || out[out.length - 1].role !== "user" || !out[out.length - 1].content) return { ok: false, error: "ungueltige_anfrage" };
  if (out.reduce((n, m) => n + m.content.length, 0) > LIMITS.maxTotalChars) return { ok: false, error: "zu_lang" };
  return { ok: true, history: out };
}

/** Zusätzliche Anweisungen — ausdrücklich KEINE technische Sperre (siehe publicSafety.ts). */
export const HERMES_PUBLIC_ZUSATZ =
  "\n\nWichtig für diesen Kanal:\n" +
  "- Du antwortest nur mit den hier genannten öffentlichen Informationen über Secret 58. Du hast keine Werkzeuge und führst nichts aus: kein Terminal, keine Dateien, kein Browser, keine Veröffentlichungen, kein Nachrichtenversand, keine interne Verwaltung.\n" +
  "- Du kennst keine Kunden- oder Kontodaten und gibst keine heraus.\n" +
  "- Persönliche, vertrauliche oder unsichere Anliegen: verweise auf das Kontaktformular oder info@secret58.com.";

/** Antwort auf eine Besucherfrage über das öffentliche Profil. Wirft HermesError / Error("belegt"). */
export async function hermesPublicAnswer(history: History): Promise<string> {
  const state = publicState();
  if (!state.ok) throw new HermesError("abgelehnt");
  if (publicRuntime.inFlight >= LIMITS.maxConcurrent) throw new Error("belegt");
  publicRuntime.inFlight += 1;
  try {
    const messages: ChatTurn[] = [{ role: "system", content: SYSTEMPROMPT + HERMES_PUBLIC_ZUSATZ }, ...history];
    const { text, toolSignal } = await hermesChat(state.profile, messages, { maxTokens: LIMITS.maxTokens, timeoutMs: LIMITS.timeoutMs });
    if (toolSignal) {
      tripBreaker();
      throw new HermesError("abgelehnt");
    }
    const reply = text.replace(CONTROL, "").trim().slice(0, LIMITS.maxReplyChars);
    return reply || "Dazu habe ich gerade keine Antwort. Schreiben Sie uns bitte über das Kontaktformular.";
  } finally {
    publicRuntime.inFlight -= 1;
  }
}
