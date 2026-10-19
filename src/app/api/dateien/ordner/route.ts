import { NextResponse } from "next/server";
import { z } from "zod";
import { withKunde, jsonBody } from "@/lib/dateien/http";
import { ordnerAnlegen, ordnerLoeschen } from "@/lib/dateien/service";

export const dynamic = "force-dynamic";

const schema = z.object({ name: z.string().max(80) }).strict();

export async function POST(req: Request) {
  return withKunde(async (u) => NextResponse.json({ ordner: await ordnerAnlegen(u.workspaceId, schema.parse(await jsonBody(req)).name) }));
}

export async function DELETE(req: Request) {
  return withKunde(async (u) => {
    await ordnerLoeschen(u.workspaceId, schema.parse(await jsonBody(req)).name);
    return NextResponse.json({ ok: true });
  });
}
