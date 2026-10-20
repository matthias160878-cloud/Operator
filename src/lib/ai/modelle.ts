/** Aktive Modelle je Anbieter (bei jedem Aufruf gelesen, damit Änderungen sofort gelten). */
export type KiAnbieter = "anthropic" | "openai" | "gemini";

export function aktivesModell(p: KiAnbieter): string {
  if (p === "anthropic") return process.env.ANTHROPIC_MODEL?.trim() || "claude-haiku-4-5-20251001";
  if (p === "openai") return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  return process.env.GEMINI_MODEL?.trim() || "gemini-flash-latest";
}
