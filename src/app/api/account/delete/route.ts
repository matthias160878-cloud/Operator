import { rm } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSessionUser, SESSION_COOKIE } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { route } from "@/lib/api";
import { ComposioError, deleteConnectedAccount } from "@/lib/composio/client";

const schema = z.object({ password: z.string().min(1).max(200), confirm: z.literal("LÖSCHEN") });

/**
 * Löscht den eigenen Arbeitsbereich vollständig (Datenbank kaskadierend +
 * private Dateien). Laufende Abos müssen vorher über „Abo verwalten“ beendet
 * werden, damit nach der Löschung nicht weiter abgebucht wird. Bei Stripe
 * gespeicherte Zahlungs- und Händlerdaten unterliegen den Aufbewahrungspflichten
 * dort und werden nicht von hier gelöscht.
 */
async function handlePOST(request: Request) {
  const user = await requireSessionUser();
  if (user.isOperator) return NextResponse.json({ error: "Das Betreiberkonto kann hier nicht gelöscht werden." }, { status: 400 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bitte Passwort eingeben und „LÖSCHEN“ bestätigen." }, { status: 400 });
  const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
  if (!(await verifyPassword(parsed.data.password, dbUser?.passwordHash ?? null))) {
    return NextResponse.json({ error: "Passwort ist falsch." }, { status: 403 });
  }
  const plan = await prisma.workspacePlan.findUnique({ where: { workspaceId: user.workspaceId } });
  if (plan?.billingMode === "subscription" && ["ACTIVE", "PAST_DUE", "PENDING"].includes(plan.status) && !plan.cancelAtPeriodEnd) {
    return NextResponse.json({ error: "Bitte beende zuerst dein Abo unter „Paket & Abrechnung“." }, { status: 409 });
  }
  // Über Composio verbundene Plattformzugänge zuerst dort löschen, sonst
  // blieben sie nach der Kontolöschung bei Composio bestehen.
  const composio = await prisma.composioConnection.findMany({ where: { workspaceId: user.workspaceId } });
  try {
    for (const row of composio) {
      for (const id of [row.connectedAccountId, row.pendingAccountId]) if (id) await deleteConnectedAccount(id);
    }
  } catch (err) {
    if (!(err instanceof ComposioError)) throw err;
    return NextResponse.json(
      { error: "Verbundene Konten konnten bei Composio nicht getrennt werden. Bitte später erneut versuchen." },
      { status: 502 }
    );
  }
  // Betreiber-Buchungen bleiben (Aufbewahrungspflicht), verlieren aber den Bezug zum Arbeitsbereich.
  await prisma.operatorPayment.updateMany({ where: { workspaceId: user.workspaceId }, data: { workspaceId: null } });
  await prisma.workspace.delete({ where: { id: user.workspaceId } });
  const dir = path.join(process.env.MEDIA_STORAGE_DIR || path.join(process.cwd(), "storage", "media"), user.workspaceId);
  await rm(dir, { recursive: true, force: true });
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

export const POST = route(handlePOST);
