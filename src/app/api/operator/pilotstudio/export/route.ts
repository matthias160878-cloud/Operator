import { NextResponse } from "next/server";
import { withOperator } from "@/lib/pilotstudio/http";
import { exportAll } from "@/lib/pilotstudio/demand";

export const dynamic = "force-dynamic";

export async function GET() {
  return withOperator(async (u) => {
    const data = await exportAll(u.workspaceId);
    const day = new Date().toISOString().slice(0, 10);
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="pilotstudio-export-${day}.json"`,
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    });
  });
}
