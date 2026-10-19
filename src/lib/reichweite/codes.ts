import { randomBytes } from "node:crypto";

/**
 * Öffentliche Empfehlungscodes: zufällig, ohne Personenbezug, ohne
 * Rückschluss auf Workspace oder Kampagne. Sie sind KEIN Zugriffs- oder
 * Anmeldetoken — wer den Code kennt, sieht nur die öffentlichen Felder der
 * Kampagne, sonst nichts.
 */
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // ohne 0/o, 1/l/i
export const CODE_LAENGE = 10;
const CODE_MUSTER = new RegExp(`^[${ALPHABET}]{${CODE_LAENGE}}$`);

export function neuerCode(): string {
  const bytes = randomBytes(CODE_LAENGE);
  let code = "";
  for (const b of bytes) code += ALPHABET[b % ALPHABET.length];
  return code;
}

export function istGueltigerCode(code: unknown): code is string {
  return typeof code === "string" && CODE_MUSTER.test(code);
}
