import { NextResponse } from "next/server";
import { z } from "zod";
import { withOperator, readJson } from "@/lib/pilotstudio/http";
import { pilotState } from "@/lib/pilotstudio/overview";
import { createInquiry, importWebsiteInquiries, loadDemo, PilotError } from "@/lib/pilotstudio/service";
import { saveConfig } from "@/lib/pilotstudio/demand";

export const dynamic = "force-dynamic";

export async function GET() {
  return withOperator(async (u) => NextResponse.json(await pilotState(u.workspaceId)));
}

const schema = z.object({ action: z.enum(["anfrage", "demo", "demo-zuruecksetzen", "webseite-uebernehmen", "einrichtung"]), data: z.unknown().optional(), confirmed: z.boolean().optional() });

export async function POST(req: Request) {
  return withOperator(async (u, actor) => {
    const p = schema.safeParse(await readJson(req, 200_000));
    if (!p.success) throw new PilotError(400, "Unbekannte Aktion.");
    const { action, data, confirmed } = p.data;
    switch (action) {
      case "anfrage":
        return NextResponse.json({ inquiry: await createInquiry(u.workspaceId, actor, data) });
      case "demo":
        await loadDemo(u.workspaceId, actor, false);
        break;
      case "demo-zuruecksetzen":
        if (!confirmed) throw new PilotError(409, "Zurücksetzen bitte bestätigen.");
        await loadDemo(u.workspaceId, actor, true);
        break;
      case "webseite-uebernehmen":
        return NextResponse.json({ uebernommen: await importWebsiteInquiries(u.workspaceId, actor) });
      case "einrichtung":
        await saveConfig(u.workspaceId, actor, data);
        break;
    }
    return NextResponse.json({ ok: true });
  });
}
