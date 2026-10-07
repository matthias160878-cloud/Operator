import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, passwordProblem } from "@/lib/auth/password";
import { createSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { createWorkspaceForUser } from "@/lib/workspace";
import { clientIp, hitRateLimit } from "@/lib/rateLimit";
import { route } from "@/lib/api";

/**
 * Einmaliger, geschützter Einrichtungsablauf für das Betreiberkonto.
 * Voraussetzungen: OPERATOR_SETUP_TOKEN ist gesetzt (mind. 32 Zeichen) und
 * es existiert noch KEIN Betreiberkonto. Danach ist dieser Weg gesperrt —
 * ein einfaches, öffentlich erreichbares Admin-Passwort gibt es nicht.
 */
const schema = z.object({
  setupToken: z.string().min(1).max(500),
  email: z.string().trim().toLowerCase().email().max(200),
  name: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(200),
});

function tokenMatches(given: string): boolean {
  const expected = process.env.OPERATOR_SETUP_TOKEN ?? "";
  if (expected.length < 32) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function handlePOST(request: Request) {
  if (!(await hitRateLimit(`setup:${clientIp(request)}`, 5, 3600))) {
    return NextResponse.json({ error: "Zu viele Versuche." }, { status: 429 });
  }
  if ((await prisma.user.count({ where: { isOperator: true } })) > 0) {
    return NextResponse.json({ error: "Das Betreiberkonto ist bereits eingerichtet." }, { status: 409 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  if (!tokenMatches(parsed.data.setupToken)) {
    return NextResponse.json({ error: "Einrichtungsschlüssel ungültig oder auf dem Server nicht gesetzt." }, { status: 403 });
  }
  const problem = passwordProblem(parsed.data.password);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });
  if (await prisma.user.findUnique({ where: { email: parsed.data.email } })) {
    return NextResponse.json({ error: "Diese E-Mail-Adresse ist bereits vergeben." }, { status: 409 });
  }

  const workspace = await createWorkspaceForUser({
    email: parsed.data.email,
    name: parsed.data.name,
    passwordHash: await hashPassword(parsed.data.password),
    workspaceName: "Betreiber",
    isOperator: true,
  });
  const user = workspace.users[0];
  await prisma.auditLog.create({
    data: { workspaceId: workspace.id, userId: user.id, action: "operator.setup", detail: "Betreiberkonto eingerichtet" },
  });
  const { token, expiresAt } = await createSession(user.id);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  return response;
}

export const POST = route(handlePOST);
