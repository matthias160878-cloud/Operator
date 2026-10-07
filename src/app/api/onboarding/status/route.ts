import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getAllIntegrationStatuses } from "@/lib/integrations/registry";
import { route } from "@/lib/api";

async function handleGET() {
  const ti = await getTranslations("common.integrationStatus");
  const integrations = await getAllIntegrationStatuses(ti);
  return NextResponse.json({ integrations });
}

export const GET = route(handleGET);
