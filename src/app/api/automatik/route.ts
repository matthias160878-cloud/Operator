import { NextResponse } from "next/server";
import { z } from "zod";
import { route } from "@/lib/api";
import { requireSessionUser } from "@/lib/auth/session";
import { darfFreigeben } from "@/lib/reichweite/zugriff";
import { protokoll } from "@/lib/reichweite/service";
import { automatikPausiert, automatikSetzen } from "@/lib/automatik";

async function handleGET() {
  const user = await requireSessionUser();
  return NextResponse.json({ pausiert: await automatikPausiert(user.workspaceId) });
}

/** Automatische Abläufe (geplante Veröffentlichungen) pausieren oder fortsetzen. */
async function handlePUT(request: Request) {
  const user = await requireSessionUser();
  if (!darfFreigeben(user.role)) return NextResponse.json({ error: "Pausieren dürfen nur Inhaber und Admins." }, { status: 403 });
  const parsed = z.object({ pausiert: z.boolean() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  await automatikSetzen(user.workspaceId, parsed.data.pausiert);
  await protokoll(user.workspaceId, user.userId, parsed.data.pausiert ? "automatik.pausiert" : "automatik.fortgesetzt");
  return NextResponse.json({ pausiert: parsed.data.pausiert });
}

export const GET = route(handleGET);
export const PUT = route(handlePUT);
