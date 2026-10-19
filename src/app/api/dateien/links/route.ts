import { NextResponse } from "next/server";
import { withKunde, jsonBody } from "@/lib/dateien/http";
import { linkAnlegen } from "@/lib/dateien/service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return withKunde(async (u) => NextResponse.json({ link: await linkAnlegen(u.workspaceId, u.userId, await jsonBody(req)) }));
}
