import { NextResponse } from "next/server";
import { z } from "zod";
import { route } from "@/lib/api";
import { requireSessionUser } from "@/lib/auth/session";
import { bearbeiterOderAntwort } from "@/lib/reichweite/zugriff";
import { protokoll } from "@/lib/reichweite/service";
import { KampagnenFehler } from "@/lib/reichweitenaufbau/kampagnenService";
import { testlaufEntfernen, testlaufWeiter, testlaufZustand } from "@/lib/reichweitenaufbau/testlauf";

const schema = z.object({ aktion: z.enum(["weiter", "neu", "entfernen"]) });

async function handleGET() {
  const user = await requireSessionUser();
  return NextResponse.json(await testlaufZustand(user.workspaceId));
}

/** Demo-Testlauf schrittweise ausführen. Nichts wird veröffentlicht, versendet oder bezahlt. */
async function handlePOST(request: Request) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  if (parsed.data.aktion !== "weiter") {
    await testlaufEntfernen(user.workspaceId);
    await protokoll(user.workspaceId, user.userId, "reichweitenaufbau.testlauf_entfernt", "");
    if (parsed.data.aktion === "entfernen") return NextResponse.json(await testlaufZustand(user.workspaceId));
  }
  try {
    const zustand = await testlaufWeiter(user);
    await protokoll(user.workspaceId, user.userId, "reichweitenaufbau.testlauf_schritt", String(zustand.schritt));
    return NextResponse.json(zustand);
  } catch (e) {
    if (e instanceof KampagnenFehler) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
}

export const GET = route(handleGET);
export const POST = route(handlePOST);
