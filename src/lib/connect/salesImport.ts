/**
 * CSV-Import für Verkäufe aus bestehenden Shops (Weg A).
 * Erwartete Kopfzeile (Reihenfolge beliebig, Trennzeichen , oder ;):
 *   external_id, date, amount, currency, product
 * amount mit Dezimalpunkt oder -komma in der Hauptwährungseinheit (z. B. 19,90).
 */
export interface ImportRow {
  externalId: string;
  occurredAt: Date;
  amount: number; // Cent
  currency: string;
  productName: string;
}

function splitLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === sep && !quoted) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out.map((v) => v.trim());
}

/** "1.234,56" / "1,234.56" / "19,90" / "19.90" -> Cent (ganzzahlig, ohne Fließkommafehler). */
export function parseAmountToCents(raw: string): number | null {
  const s = raw.replace(/\s/g, "");
  if (!/^-?[\d.,]+$/.test(s)) return null;
  const lastSep = Math.max(s.lastIndexOf(","), s.lastIndexOf("."));
  let intPart = s;
  let frac = "";
  if (lastSep !== -1 && s.length - lastSep - 1 <= 2) {
    intPart = s.slice(0, lastSep);
    frac = s.slice(lastSep + 1);
  }
  intPart = intPart.replace(/[.,]/g, "");
  if (!/^-?\d+$/.test(intPart || "0") || !/^\d{0,2}$/.test(frac)) return null;
  const negative = intPart.startsWith("-");
  const cents = Math.abs(Number(intPart || "0")) * 100 + Number(frac.padEnd(2, "0") || "0");
  return negative ? -cents : cents;
}

export function parseSalesCsv(text: string): { rows: ImportRow[]; errors: string[] } {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { rows: [], errors: ["Leere Datei."] };
  const sep = (lines[0].match(/;/g)?.length ?? 0) > (lines[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const header = splitLine(lines[0], sep).map((h) => h.toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const idx = { id: col("external_id"), date: col("date"), amount: col("amount"), currency: col("currency"), product: col("product") };
  if (idx.id < 0 || idx.amount < 0 || idx.currency < 0) {
    return { rows: [], errors: ["Kopfzeile braucht mindestens external_id, amount, currency."] };
  }
  const rows: ImportRow[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  for (let i = 1; i < lines.length && rows.length < 5000; i++) {
    const cells = splitLine(lines[i], sep);
    const externalId = cells[idx.id]?.slice(0, 200);
    const amount = parseAmountToCents(cells[idx.amount] ?? "");
    const currency = (cells[idx.currency] ?? "").toLowerCase();
    const date = idx.date >= 0 && cells[idx.date] ? new Date(cells[idx.date]) : new Date();
    if (!externalId || amount === null || amount < 0 || !/^[a-z]{3}$/.test(currency) || Number.isNaN(date.getTime())) {
      errors.push(`Zeile ${i + 1}: ungültig`);
      continue;
    }
    if (seen.has(externalId)) {
      errors.push(`Zeile ${i + 1}: doppelte external_id in der Datei`);
      continue;
    }
    seen.add(externalId);
    rows.push({ externalId, occurredAt: date, amount, currency, productName: (idx.product >= 0 ? cells[idx.product] : "")?.slice(0, 200) ?? "" });
  }
  return { rows, errors };
}
