import { NextResponse } from "next/server";
import { z } from "zod";
import { route } from "@/lib/api";
import { requireSessionUser } from "@/lib/auth/session";
import { darfFreigeben } from "@/lib/reichweite/zugriff";
import { protokoll } from "@/lib/reichweite/service";
import { kiLimitsSpeichern } from "@/lib/ai/kiLimits";

const schema = z.object({
  aufrufeMonat: z.number().int().positive().max(1_000_000).nullable(),
  kostenMonatUsd: z.number().positive().max(100_000).nullable(),
});

/** Verbrauchslimits für KI mit eigenem Schlüssel (nur Inhaber/Admin). */
async function handlePUT(request: Request) {
  const user = await requireSessionUser();
  if (!darfFreigeben(user.role)) return NextResponse.json({ error: "Limits dürfen nur Inhaber und Admins ändern." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bitte ganze Zahlen über 0 angeben oder das Feld leer lassen." }, { status: 400 });
  await kiLimitsSpeichern(user.workspaceId, parsed.data);
  await protokoll(user.workspaceId, user.userId, "ki.limits", JSON.stringify(parsed.data));
  return NextResponse.json({ ok: true });
}

export const PUT = route(handlePUT);
