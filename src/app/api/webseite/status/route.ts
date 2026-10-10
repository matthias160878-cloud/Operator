import { NextResponse } from "next/server";
import { websiteAiEnabled } from "@/lib/websiteAi";

export const dynamic = "force-dynamic";

/** Was die öffentliche Startseite gerade anbieten kann (keine Konfigurationswerte). */
export async function GET() {
  return NextResponse.json({ ki: websiteAiEnabled() }, { headers: { "cache-control": "no-store" } });
}
