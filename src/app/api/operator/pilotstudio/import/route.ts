import { NextResponse } from "next/server";
import { withOperator, readJson } from "@/lib/pilotstudio/http";
import { importAll } from "@/lib/pilotstudio/demand";

export const dynamic = "force-dynamic";

/** Erwartet { mode: "ergaenzen" | "ueberschreiben", confirmed?: true, data: <Export> }. */
export async function POST(req: Request) {
  return withOperator(async (u, actor) => {
    const b = (await readJson(req, 3_000_000)) as { mode?: unknown; confirmed?: unknown; data?: unknown } | null;
    const overwrite = b?.mode === "ueberschreiben";
    const r = await importAll(u.workspaceId, actor, b?.data, { overwrite, confirmed: b?.confirmed === true });
    return NextResponse.json({ ok: true, ...r });
  });
}
