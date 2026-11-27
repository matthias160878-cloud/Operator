#!/usr/bin/env node
/**
 * SECRET 58 — Einrichtung in einem Schritt (`npm run setup`).
 *
 * - legt .env aus .env.example an (eine vorhandene .env wird nie überschrieben)
 * - erzeugt fehlende Geheimnisse, die niemand von Hand erfinden sollte
 *   (TOKEN_ENCRYPTION_KEY, NEXTAUTH_SECRET)
 * - synchronisiert das Datenbankschema (prisma db push), optional Demo-Daten
 * - druckt die Redirect-URLs für die Entwicklerportale der Plattformen
 *   und eine Übersicht, welche Integrationen schon Zugangsdaten haben
 *
 * Gibt niemals Werte von Schlüsseln aus, nur Variablennamen.
 *
 * Optionen: --yes (keine Rückfragen), --seed / --no-seed, --skip-db,
 *           --url=https://meine-domain.de, --root=<Projektordner>
 */
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const args = new Map(
  process.argv.slice(2).map((a) => {
    const [k, ...rest] = a.replace(/^--/, "").split("=");
    return [k, rest.length ? rest.join("=") : "true"];
  })
);
const yes = args.has("yes");
const root = resolve(args.get("root") ?? resolve(dirname(fileURLToPath(import.meta.url)), ".."));
const envPath = resolve(root, ".env");
const examplePath = resolve(root, ".env.example");

/** Variablen, die bei Leerstand automatisch mit Zufallswerten gefüllt werden. */
const GENERATED = ["TOKEN_ENCRYPTION_KEY", "NEXTAUTH_SECRET"];

/** OAuth-Schlüssel → Variablen, die dafür gesetzt sein müssen (siehe src/lib/oauth/providers.ts). */
const PLATFORMS = [
  ["YOUTUBE", ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET"], "Veröffentlichen + Kommentare"],
  ["INSTAGRAM", ["INSTAGRAM_CLIENT_ID", "INSTAGRAM_CLIENT_SECRET"], "Veröffentlichen + Kommentare/DMs"],
  ["FACEBOOK", ["FACEBOOK_APP_ID", "FACEBOOK_APP_SECRET"], "Veröffentlichen + Kommentare/Messenger"],
  ["TIKTOK", ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"], "Veröffentlichen"],
  ["TIKTOK_BUSINESS", ["TIKTOK_BUSINESS_APP_ID", "TIKTOK_BUSINESS_APP_SECRET"], "Posteingang (zweite App)"],
  ["LINKEDIN", ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"], "Veröffentlichen"],
  ["LINKEDIN_PAGE", ["LINKEDIN_PAGE_CLIENT_ID", "LINKEDIN_PAGE_CLIENT_SECRET"], "Posteingang (zweite App)"],
];

/** Weitere Integrationen für die Übersicht am Ende. */
const SERVICES = [
  ["KI (Anthropic)", ["ANTHROPIC_API_KEY"]],
  ["KI (OpenAI)", ["OPENAI_API_KEY"]],
  ["ElevenLabs", ["ELEVENLABS_API_KEY"]],
  ["Stripe-Kauf", ["STRIPE_SECRET_KEY", "STRIPE_PRICE_ID"]],
  ["Website-Widget", ["WEBSITE_WIDGET_KEY", "WEBSITE_WIDGET_ORIGINS"]],
];

function parseEnv(text) {
  const values = new Map();
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=(.*)$/.exec(line);
    if (!m) continue;
    values.set(m[1], m[2].trim().replace(/^(["'])(.*)\1$/, "$2"));
  }
  return values;
}

/** Setzt KEY=value in der .env-Datei; fehlt die Zeile, wird sie angehängt. */
function setEnvValue(text, key, value) {
  const re = new RegExp(`^(\\s*${key}\\s*=).*$`, "m");
  if (re.test(text)) return text.replace(re, `$1${value}`);
  return `${text.replace(/\s*$/, "")}\n${key}=${value}\n`;
}

function run(cmd, cmdArgs) {
  console.log(`\n$ ${cmd} ${cmdArgs.join(" ")}`);
  const res = spawnSync(cmd, cmdArgs, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
  if (res.status !== 0) {
    console.error(`\nAbbruch: "${cmd} ${cmdArgs.join(" ")}" ist fehlgeschlagen.`);
    process.exit(res.status ?? 1);
  }
}

async function ask(question, fallback) {
  if (yes || !stdin.isTTY) return fallback;
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const answer = (await rl.question(`${question} [${fallback}] `)).trim();
    return answer || fallback;
  } finally {
    rl.close();
  }
}

console.log("SECRET 58 — Einrichtung\n=======================");

// 1) .env anlegen
if (!existsSync(envPath)) {
  if (!existsSync(examplePath)) {
    console.error("Weder .env noch .env.example gefunden — bitte im Projektordner ausführen.");
    process.exit(1);
  }
  copyFileSync(examplePath, envPath);
  console.log("✓ .env aus .env.example angelegt");
} else {
  console.log("✓ .env vorhanden (wird nicht überschrieben)");
}

// 2) Geheimnisse erzeugen
let envText = readFileSync(envPath, "utf8");
let values = parseEnv(envText);
for (const key of GENERATED) {
  if (!values.get(key)) {
    envText = setEnvValue(envText, key, randomBytes(32).toString("hex"));
    console.log(`✓ ${key} erzeugt`);
  } else {
    console.log(`✓ ${key} bereits gesetzt`);
  }
}
if (!values.get("DATABASE_URL")) {
  envText = setEnvValue(envText, "DATABASE_URL", '"file:./dev.db"');
  console.log("✓ DATABASE_URL auf lokale SQLite-Datei gesetzt");
}
writeFileSync(envPath, envText);
values = parseEnv(envText);

// 3) Datenbank
if (!args.has("skip-db")) {
  run("npx", ["prisma", "generate"]);
  run("npx", ["prisma", "db", "push"]);
  const wantSeed = args.has("seed")
    ? "j"
    : args.has("no-seed")
      ? "n"
      : await ask("Demo-Daten laden? (j/n)", "n");
  if (/^[jy]/i.test(wantSeed)) run("npm", ["run", "db:seed"]);
} else {
  console.log("\n(Datenbank übersprungen: --skip-db)");
}

// 4) Redirect-URLs
const url = (args.get("url") ?? (await ask("Unter welcher Adresse läuft die App?", "http://localhost:3000"))).replace(
  /\/+$/,
  ""
);
console.log("\nRedirect-/Callback-URLs für die Entwicklerportale:");
console.log("(je Plattform im Portal eintragen — ohne diesen Eintrag lehnt der Anbieter das Verbinden ab)\n");
for (const [key, vars, purpose] of PLATFORMS) {
  const ready = vars.every((v) => values.get(v));
  console.log(`  ${ready ? "✓" : "·"} ${key.padEnd(16)} ${url}/api/oauth/${key}/callback`);
  console.log(`    ${purpose} — Variablen: ${vars.join(", ")}${ready ? "" : " (noch leer)"}`);
}

// 5) Übersicht
console.log("\nWeitere Integrationen:");
for (const [name, vars] of SERVICES) {
  const ready = vars.every((v) => values.get(v));
  console.log(`  ${ready ? "✓" : "·"} ${name.padEnd(16)} ${ready ? "Zugangsdaten gesetzt" : `fehlt: ${vars.filter((v) => !values.get(v)).join(", ")}`}`);
}

console.log(`
Nächste Schritte:
  1. Fehlende Werte in .env eintragen (live: im Hosting-Dashboard unter Environment).
  2. App starten: npm run dev  →  ${url}
  3. Unter „Integrationen“ je Dienst „Einrichten“ aufklappen und „Verbindung prüfen“.
  4. Unter „Social Media“ die Plattformen mit „Verbinden“ anmelden.
`);
