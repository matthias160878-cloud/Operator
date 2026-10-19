import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { bearbeiterOderAntwort } from "@/lib/reichweite/zugriff";
import { demoAnlegen, demoEntfernen, protokoll } from "@/lib/reichweite/service";

/** Demo-Kampagne mit erfundenen, deutlich gekennzeichneten Zahlen (nur im eigenen Workspace). */
async function handlePOST() {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const kampagne = await demoAnlegen(user.workspaceId);
  await protokoll(user.workspaceId, user.userId, "reichweite.demo_angelegt", kampagne.id);
  return NextResponse.json({ kampagne });
}

async function handleDELETE() {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const anzahl = await demoEntfernen(user.workspaceId);
  await protokoll(user.workspaceId, user.userId, "reichweite.demo_entfernt", String(anzahl));
  return NextResponse.json({ ok: true, anzahl });
}

export const POST = route(handlePOST);
export const DELETE = route(handleDELETE);
