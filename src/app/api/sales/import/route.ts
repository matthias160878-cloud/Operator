import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { isUniqueViolation } from "@/lib/billing/platformWebhook";
import { parseSalesCsv } from "@/lib/connect/salesImport";
import { route } from "@/lib/api";

/**
 * Weg A: Verkäufe eines bestehenden Shops/Zahlungsanbieters per CSV-Export
 * importieren. Je Workspace ist die externe ID eindeutig — ein bereits direkt
 * verarbeiteter oder früher importierter Verkauf wird übersprungen, nicht
 * doppelt gezählt.
 */
async function handlePOST(request: Request) {
  const workspaceId = await getCurrentWorkspaceId();
  const text = await request.text();
  if (text.length > 2_000_000) return NextResponse.json({ error: "Datei zu groß (max. 2 MB)." }, { status: 413 });
  const { rows, errors } = parseSalesCsv(text);
  let imported = 0;
  let duplicates = 0;
  for (const row of rows) {
    try {
      await prisma.customerSale.create({ data: { workspaceId, source: "IMPORT_CSV", status: "PAID", ...row } });
      imported += 1;
    } catch (err) {
      if (isUniqueViolation(err)) duplicates += 1;
      else throw err;
    }
  }
  return NextResponse.json({ imported, duplicates, errors: errors.slice(0, 20) });
}

export const POST = route(handlePOST);
