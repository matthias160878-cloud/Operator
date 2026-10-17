import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { route } from "@/lib/api";
import { requireSessionUser } from "@/lib/auth/session";
import { completeConnection } from "@/lib/composio/service";
import { getComposioToolkit } from "@/lib/composio/toolkits";
import { appOrigin } from "@/lib/composio/origin";

/**
 * Rückkehr von Composio nach der Anmeldung bei der Plattform. Verlangt die
 * Sitzung des Kunden, der die Verbindung gestartet hat (Proxy + hier), prüft
 * den Sicherheitscode und fragt das Konto bei Composio nach, bevor es dem
 * Arbeitsbereich zugeordnet wird.
 */
async function handleGET(request: Request) {
  const user = await requireSessionUser();
  const url = new URL(request.url);
  const origin = appOrigin(request);
  const toolkit = getComposioToolkit(url.searchParams.get("toolkit") ?? "");
  if (!toolkit) return NextResponse.redirect(new URL("/social-media?composio_error=unknown#composio", origin));

  const outcome = await completeConnection({
    workspaceId: user.workspaceId,
    toolkit,
    state: url.searchParams.get("state"),
    connectedAccountIdParam: url.searchParams.get("connected_account_id"),
  });
  await prisma.auditLog.create({
    data: {
      workspaceId: user.workspaceId,
      userId: user.userId,
      action: outcome.ok ? "composio.connected" : "composio.connect_failed",
      detail: outcome.ok ? toolkit.key : `${toolkit.key}:${outcome.reason}`,
    },
  });
  const target = outcome.ok
    ? `/social-media?composio_connected=${toolkit.key}#composio`
    : `/social-media?composio_error=${outcome.reason}&toolkit=${toolkit.key}#composio`;
  return NextResponse.redirect(new URL(target, origin));
}

export const GET = route(handleGET);
