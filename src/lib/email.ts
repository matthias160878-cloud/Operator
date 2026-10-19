/**
 * E-Mail-Versand (derzeit nur für Newsletter-Bestätigungen). Anbieter: Resend
 * (HTTP-API) — nur mit RESEND_API_KEY und EMAIL_FROM in der Server-Umgebung.
 * Ohne beides wird nichts versendet und die abhängigen Funktionen bleiben aus.
 * EMAIL_API_BASE nur für Tests.
 */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());
}

export class EmailError extends Error {}

export async function sendEmail(input: { to: string; subject: string; text: string; html: string; idempotencyKey?: string }): Promise<{ id: string | null }> {
  if (!isEmailConfigured()) throw new EmailError("E-Mail-Versand ist nicht eingerichtet.");
  const base = (process.env.EMAIL_API_BASE?.trim() || "https://api.resend.com").replace(/\/+$/, "");
  let res: Response;
  try {
    res = await fetch(`${base}/emails`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "content-type": "application/json",
        ...(input.idempotencyKey ? { "idempotency-key": input.idempotencyKey } : {}),
      },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [input.to], subject: input.subject, text: input.text, html: input.html }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new EmailError("E-Mail-Anbieter nicht erreichbar.");
  }
  if (!res.ok) throw new EmailError(`E-Mail-Anbieter antwortete mit Status ${res.status}.`);
  const data = (await res.json().catch(() => null)) as { id?: unknown } | null;
  return { id: typeof data?.id === "string" ? data.id : null };
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
