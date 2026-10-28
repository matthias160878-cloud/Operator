/**
 * E-Mail-Versand über Resend (HTTP-API). Ohne `zugang` mit RESEND_API_KEY und
 * EMAIL_FROM der Server-Umgebung (SECRET-58-eigene Mails); mit `zugang` über
 * den eigenen Resend-Zugang eines Kunden (Kunden-Newsletter).
 * EMAIL_API_BASE nur für Tests.
 */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());
}

export class EmailError extends Error {}

export interface EmailZugang {
  apiKey: string;
  absender: string;
}

export interface EmailNachricht {
  to: string;
  subject: string;
  text: string;
  html: string;
  headers?: Record<string, string>;
}

const apiBase = () => (process.env.EMAIL_API_BASE?.trim() || "https://api.resend.com").replace(/\/+$/, "");

export async function sendEmail(input: EmailNachricht & { idempotencyKey?: string; zugang?: EmailZugang }): Promise<{ id: string | null }> {
  if (!input.zugang && !isEmailConfigured()) throw new EmailError("E-Mail-Versand ist nicht eingerichtet.");
  const base = apiBase();
  const key = input.zugang?.apiKey ?? process.env.RESEND_API_KEY;
  const from = input.zugang?.absender ?? process.env.EMAIL_FROM;
  let res: Response;
  try {
    res = await fetch(`${base}/emails`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
        ...(input.idempotencyKey ? { "idempotency-key": input.idempotencyKey } : {}),
      },
      body: JSON.stringify({ from, to: [input.to], subject: input.subject, text: input.text, html: input.html, ...(input.headers ? { headers: input.headers } : {}) }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new EmailError("E-Mail-Anbieter nicht erreichbar.");
  }
  if (!res.ok) throw new EmailError(`E-Mail-Anbieter antwortete mit Status ${res.status}.`);
  const data = (await res.json().catch(() => null)) as { id?: unknown } | null;
  return { id: typeof data?.id === "string" ? data.id : null };
}

/** Bis zu 100 E-Mails in einer Anfrage (Resend-Sammelversand) über den Zugang eines Kunden. */
export async function sendEmailBatch(zugang: EmailZugang, nachrichten: EmailNachricht[], idempotencyKey: string): Promise<(string | null)[]> {
  if (nachrichten.length === 0) return [];
  if (nachrichten.length > 100) throw new EmailError("Höchstens 100 E-Mails je Sammelversand.");
  let res: Response;
  try {
    res = await fetch(`${apiBase()}/emails/batch`, {
      method: "POST",
      headers: { authorization: `Bearer ${zugang.apiKey}`, "content-type": "application/json", "idempotency-key": idempotencyKey },
      body: JSON.stringify(nachrichten.map((n) => ({ from: zugang.absender, to: [n.to], subject: n.subject, text: n.text, html: n.html, ...(n.headers ? { headers: n.headers } : {}) }))),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new EmailError("E-Mail-Anbieter nicht erreichbar.");
  }
  if (!res.ok) {
    const b = (await res.json().catch(() => null)) as { message?: unknown } | null;
    throw new EmailError(`E-Mail-Anbieter antwortete mit Status ${res.status}${typeof b?.message === "string" ? `: ${b.message.slice(0, 200)}` : ""}.`);
  }
  const data = (await res.json().catch(() => null)) as { data?: { id?: unknown }[] } | null;
  return nachrichten.map((_, i) => (typeof data?.data?.[i]?.id === "string" ? (data!.data![i].id as string) : null));
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
