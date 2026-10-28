import { NextResponse } from "next/server";
import { z } from "zod";
import { route } from "@/lib/api";
import { requireSessionUser } from "@/lib/auth/session";
import { darfFreigeben } from "@/lib/reichweite/zugriff";
import { clientIp, hitRateLimit } from "@/lib/rateLimit";
import { ZUGANG_ANBIETER } from "@/lib/zugaenge/anbieter";
import { zugangPruefen } from "@/lib/zugaenge/service";

const schema = z.object({ anbieter: z.enum(Object.keys(ZUGANG_ANBIETER) as [keyof typeof ZUGANG_ANBIETER, ...(keyof typeof ZUGANG_ANBIETER)[]]) });

/** Prüft einen gespeicherten Zugang erneut beim Anbieter. */
async function handlePOST(request: Request) {
  const user = await requireSessionUser();
  if (!darfFreigeben(user.role)) return NextResponse.json({ error: "Nur Inhaber und Admins." }, { status: 403 });
  if (!(await hitRateLimit(`zugang-pruefen:${user.workspaceId}:${clientIp(request)}`, 20, 3600))) return NextResponse.json({ error: "Zu viele Prüfungen. Bitte später erneut." }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Unbekannter Anbieter." }, { status: 400 });
  return NextResponse.json({ pruefung: await zugangPruefen(user.workspaceId, parsed.data.anbieter) });
}

export const POST = route(handlePOST);
