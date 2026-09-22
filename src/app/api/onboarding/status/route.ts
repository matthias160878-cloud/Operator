import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getAllIntegrationStatuses } from "@/lib/integrations/registry";

export async function GET() {
  const ti = await getTranslations("common.integrationStatus");
  const integrations = await getAllIntegrationStatuses(ti);
  return NextResponse.json({ integrations });
}
