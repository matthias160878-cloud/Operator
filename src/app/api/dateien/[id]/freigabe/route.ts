import { NextResponse } from "next/server";
import { withKunde, jsonBody } from "@/lib/dateien/http";
import { freigabeErstellen } from "@/lib/dateien/service";
import { appOrigin } from "@/lib/composio/origin";

export const dynamic = "force-dynamic";

/** Freigabe-Link erstellen ({ tage, maxAbrufe }). Der Schlüssel wird nur in dieser Antwort gezeigt. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withKunde(async (u) => {
    const { id } = await params;
    const f = await freigabeErstellen(u.workspaceId, u.userId, id, await jsonBody(req));
    return NextResponse.json({ freigabe: { ...f, url: `${appOrigin(req)}${f.pfad}` } });
  });
}
