import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Betriebsprüfung für Render (Health Check) und externe Überwachung:
 * Datenbank erreichbar, Medienablage beschreibbar. Gibt keine Inhalte,
 * Konfigurationswerte oder Fehlerdetails preis.
 */
export async function GET() {
  const checks: Record<string, "ok" | "fehler"> = { datenbank: "fehler", medienablage: "fehler" };
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.datenbank = "ok";
  } catch (err) {
    console.error("[health] Datenbank", err instanceof Error ? err.message : err);
  }
  try {
    const dir = process.env.MEDIA_STORAGE_DIR || path.join(process.cwd(), "storage", "media");
    await mkdir(dir, { recursive: true });
    const probe = path.join(dir, `.health-${process.pid}`);
    await writeFile(probe, "ok");
    await rm(probe, { force: true });
    checks.medienablage = "ok";
  } catch (err) {
    console.error("[health] Medienablage", err instanceof Error ? err.message : err);
  }
  const ok = Object.values(checks).every((v) => v === "ok");
  return NextResponse.json({ ok, checks }, { status: ok ? 200 : 503, headers: { "cache-control": "no-store" } });
}
