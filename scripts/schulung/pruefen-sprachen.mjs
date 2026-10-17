// Prüft Übersetzungsdateien gegen die deutsche Vorlage: gleiche Dateien, gleiche
// Schlüssel, gleiche {Platzhalter}, keine leeren Texte.
// Aufruf: node scripts/schulung/pruefen-sprachen.mjs de en fr ...   (ohne Argument: alle aus i18n/config.ts)
import fs from "node:fs";
import path from "node:path";
const root = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "..", "messages");
const args = process.argv.slice(2);
const cfg = fs.readFileSync(path.join(root, "..", "src", "i18n", "config.ts"), "utf8");
const all = [...cfg.match(/LOCALES = \[([\s\S]*?)\] as const/)[1].matchAll(/"([a-z]{2})"/g)].map((m) => m[1]);
const targets = args.length ? args : all.filter((l) => l !== "de");
const files = fs.readdirSync(path.join(root, "de")).filter((f) => f.endsWith(".json"));
const flat = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" && !Array.isArray(v) ? flat(v, `${p}${k}.`) : [[`${p}${k}`, v]]));
const ph = (s) => [...new Set([...String(s).matchAll(/\{\s*([A-Za-z_]\w*)\s*[,}]/g)].map((m) => m[1]))].sort().join("|");
let bad = 0;
for (const loc of targets) {
  const errs = [];
  for (const f of files) {
    const fp = path.join(root, loc, f);
    if (!fs.existsSync(fp)) { errs.push(`${f}: fehlt`); continue; }
    let t; try { t = JSON.parse(fs.readFileSync(fp, "utf8")); } catch (e) { errs.push(`${f}: kein gültiges JSON`); continue; }
    const s = JSON.parse(fs.readFileSync(path.join(root, "de", f), "utf8"));
    const A = new Map(flat(s)), B = new Map(flat(t));
    for (const [k, v] of A) {
      if (!B.has(k)) { errs.push(`${f}: Schlüssel fehlt ${k}`); continue; }
      const w = B.get(k);
      if (Array.isArray(v)) { if (!Array.isArray(w) || w.length !== v.length) errs.push(`${f}: Liste ${k} hat andere Länge`); continue; }
      if (typeof v === "string" && (typeof w !== "string" || (v.trim() && !w.trim()))) errs.push(`${f}: leer/falscher Typ ${k}`);
      else if (typeof v === "string" && ph(v) !== ph(w)) errs.push(`${f}: Platzhalter ${k}: ${ph(v)} ≠ ${ph(w)}`);
    }
    for (const k of B.keys()) if (!A.has(k)) errs.push(`${f}: überzähliger Schlüssel ${k}`);
  }
  if (errs.length) { bad++; console.log(`✗ ${loc}: ${errs.length} Fehler`); errs.slice(0, 12).forEach((e) => console.log("   " + e)); } else console.log(`✓ ${loc}`);
}
process.exit(bad ? 1 : 0);
