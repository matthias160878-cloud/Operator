import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { bearbeiterOderAntwort } from "@/lib/reichweite/zugriff";
import { protokoll } from "@/lib/reichweite/service";
import { demoAnlegen, demoEntfernen } from "@/lib/reichweitenaufbau/service";

async function handlePOST() {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const k = await demoAnlegen(user.workspaceId);
  await protokoll(user.workspaceId, user.userId, "reichweitenaufbau.demo_angelegt", k.id);
  return NextResponse.json({ ok: true, kampagneId: k.id });
}

async function handleDELETE() {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  await demoEntfernen(user.workspaceId);
  await protokoll(user.workspaceId, user.userId, "reichweitenaufbau.demo_entfernt", "");
  return NextResponse.json({ ok: true });
}

export const POST = route(handlePOST);
export const DELETE = route(handleDELETE);
