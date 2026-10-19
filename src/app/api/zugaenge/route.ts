import { NextResponse } from "next/server";
import { z } from "zod";
import { route } from "@/lib/api";
import { requireSessionUser } from "@/lib/auth/session";
import { darfFreigeben } from "@/lib/reichweite/zugriff";
import { protokoll } from "@/lib/reichweite/service";
import { ZUGANG_ANBIETER } from "@/lib/zugaenge/anbieter";
import { zugaengeUebersicht, zugangLoeschen, zugangSpeichern } from "@/lib/zugaenge/service";

const anbieter = z.enum(Object.keys(ZUGANG_ANBIETER) as [keyof typeof ZUGANG_ANBIETER, ...(keyof typeof ZUGANG_ANBIETER)[]]);
const schema = z.object({ anbieter, werte: z.record(z.string(), z.string().max(300)) });
const NUR_ADMIN = "Eigene Zugänge dürfen nur Inhaber und Admins ändern.";

/** Eigene Zugänge des Workspaces: nur Status und letzte vier Zeichen, nie der Schlüssel. */
async function handleGET() {
  const user = await requireSessionUser();
  return NextResponse.json({ zugaenge: await zugaengeUebersicht(user.workspaceId) });
}

async function handlePUT(request: Request) {
  const user = await requireSessionUser();
  if (!darfFreigeben(user.role)) return NextResponse.json({ error: NUR_ADMIN }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  const r = await zugangSpeichern(user.workspaceId, user.userId, parsed.data.anbieter, parsed.data.werte);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: 400 });
  await protokoll(user.workspaceId, user.userId, "zugang.gespeichert", parsed.data.anbieter);
  return NextResponse.json({ pruefung: r });
}

async function handleDELETE(request: Request) {
  const user = await requireSessionUser();
  if (!darfFreigeben(user.role)) return NextResponse.json({ error: NUR_ADMIN }, { status: 403 });
  const a = anbieter.safeParse(new URL(request.url).searchParams.get("anbieter"));
  if (!a.success) return NextResponse.json({ error: "Unbekannter Anbieter." }, { status: 400 });
  await zugangLoeschen(user.workspaceId, a.data);
  await protokoll(user.workspaceId, user.userId, "zugang.geloescht", a.data);
  return NextResponse.json({ ok: true });
}

export const GET = route(handleGET);
export const PUT = route(handlePUT);
export const DELETE = route(handleDELETE);
