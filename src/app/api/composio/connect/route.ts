import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { route } from "@/lib/api";
import { requireSessionUser } from "@/lib/auth/session";
import { hitRateLimit } from "@/lib/rateLimit";
import { ComposioError } from "@/lib/composio/client";
import { startConnection } from "@/lib/composio/service";
import { getComposioToolkit } from "@/lib/composio/toolkits";
import { appOrigin } from "@/lib/composio/origin";

const Body = z.object({ toolkit: z.string().min(2).max(20) });

/** Startet (oder erneuert) die Composio-Anmeldung für ein Plattform-Konto. */
async function handlePOST(request: Request) {
  const user = await requireSessionUser();
  const parsed = Body.safeParse(await request.json().catch(() => null));
  const toolkit = parsed.success ? getComposioToolkit(parsed.data.toolkit) : undefined;
  if (!toolkit) return NextResponse.json({ error: "Unbekannte Plattform." }, { status: 400 });

  if (!(await hitRateLimit(`composio-connect:${user.workspaceId}`, 10, 3600))) {
    return NextResponse.json({ error: "Zu viele Verbindungsversuche. Bitte in einer Stunde erneut versuchen." }, { status: 429 });
  }
  try {
    const { redirectUrl } = await startConnection({
      workspaceId: user.workspaceId,
      toolkit,
      appOrigin: appOrigin(request),
    });
    await prisma.auditLog.create({
      data: { workspaceId: user.workspaceId, userId: user.userId, action: "composio.connect_started", detail: toolkit.key },
    });
    return NextResponse.json({ redirectUrl });
  } catch (err) {
    if (err instanceof ComposioError) return NextResponse.json({ error: err.message }, { status: 502 });
    throw err;
  }
}

export const POST = route(handlePOST);
