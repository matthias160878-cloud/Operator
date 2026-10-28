import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { isLocale, DEFAULT_LOCALE } from "@/i18n/config";
import { isTrainingVideoKey, type TrainingCueTiming } from "@/lib/training/videos";

export const dynamic = "force-dynamic";

function loadTexts(lang: string): Record<string, { title: string; cues: Record<string, string> }> {
  for (const l of [lang, "en", DEFAULT_LOCALE]) {
    try {
      const file = path.join(process.cwd(), "messages", l, "schulungVideos.json");
      return JSON.parse(fs.readFileSync(file, "utf8")).videos;
    } catch {
      /* nächste Sprache */
    }
  }
  return {};
}

/** Untertitel-Zeilen (mit Zeitmarken) eines Erklärvideos in der gewählten Sprache. */
export async function GET(_req: Request, { params }: { params: Promise<{ key: string; lang: string }> }) {
  const { key, lang } = await params;
  if (!isTrainingVideoKey(key) || !isLocale(lang)) return NextResponse.json({ error: "Unbekannt." }, { status: 404 });
  let timing: { cues: TrainingCueTiming[] };
  try {
    timing = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public", "schulung", "videos", `${key}.json`), "utf8"));
  } catch {
    return NextResponse.json({ error: "Video noch nicht vorhanden." }, { status: 404 });
  }
  const texts = loadTexts(lang)[key]?.cues ?? {};
  const cues = timing.cues.map((c) => ({ ...c, text: texts[c.id] ?? "" })).filter((c) => c.text);
  return NextResponse.json({ lang, cues }, { headers: { "Cache-Control": "private, max-age=300" } });
}
