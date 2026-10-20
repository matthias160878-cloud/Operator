import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { bearbeiterOderAntwort } from "@/lib/reichweite/zugriff";
import { protokoll } from "@/lib/reichweite/service";
import { pruefeZielUrl } from "@/lib/reichweite/texte";
import { assistentSchema } from "@/lib/reichweitenaufbau/kampagnenApi";
import { KampagnenFehler, kampagneAusAssistent } from "@/lib/reichweitenaufbau/kampagnenService";

/** Kampagnenassistent: Kampagne mit Pflichtangaben und bearbeitbarem Ablauf anlegen. */
async function handlePOST(request: Request) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const parsed = assistentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Bitte alle Pflichtangaben ausfüllen." }, { status: 400 });
  const url = pruefeZielUrl(parsed.data.zielUrl);
  if (!url.ok) return NextResponse.json({ error: `Zielseite: ${url.fehler}` }, { status: 400 });
  try {
    const r = await kampagneAusAssistent(user, { ...parsed.data, zielUrl: url.url });
    if (r.neu) await protokoll(user.workspaceId, user.userId, "reichweitenaufbau.kampagne_assistent", r.kampagne.id);
    return NextResponse.json(r);
  } catch (e) {
    if (e instanceof KampagnenFehler) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
}

export const POST = route(handlePOST);
