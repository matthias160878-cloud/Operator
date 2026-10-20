import { NextResponse } from "next/server";
import { websiteAiEnabled } from "@/lib/websiteAi";
import { isEmailConfigured } from "@/lib/email";

export const dynamic = "force-dynamic";

/** Was die öffentliche Startseite gerade anbieten kann (keine Konfigurationswerte). */
export async function GET() {
  return NextResponse.json({ ki: websiteAiEnabled(), newsletter: isEmailConfigured() }, { headers: { "cache-control": "no-store" } });
}
