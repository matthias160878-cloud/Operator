import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";

export const dynamic = "force-dynamic";

/** Öffentliche Texte für den Installieren-Knopf (kein Kundenbezug, nur feste Oberflächentexte). */
export async function GET(_req: Request, { params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) return NextResponse.json({ error: "Unbekannte Sprache." }, { status: 404 });
  for (const l of [lang, "en", DEFAULT_LOCALE]) {
    try {
      const texts = JSON.parse(fs.readFileSync(path.join(process.cwd(), "messages", l, "installieren.json"), "utf8"));
      return NextResponse.json(texts, { headers: { "Cache-Control": "public, max-age=3600" } });
    } catch {
      /* nächste Sprache */
    }
  }
  return NextResponse.json({ error: "Keine Texte." }, { status: 404 });
}
