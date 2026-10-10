import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, passwordProblem } from "@/lib/auth/password";
import { createSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { createWorkspaceForUser } from "@/lib/workspace";
import { clientIp, hitRateLimit } from "@/lib/rateLimit";
import { route } from "@/lib/api";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(200),
  name: z.string().trim().min(1).max(100),
  workspaceName: z.string().trim().min(1).max(100),
  acceptProcessing: z.literal(true),
});

async function handlePOST(request: Request) {
  if (!(await hitRateLimit(`signup:${clientIp(request)}`, 5, 3600))) {
    return NextResponse.json({ error: "Zu viele Registrierungen von dieser Adresse. Bitte später erneut versuchen." }, { status: 429 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Bitte alle Felder ausfüllen und der Datenverarbeitung zustimmen." }, { status: 400 });
  }
  // Private Vorschau/Staging: nur freigegebene Adressen dürfen sich registrieren.
  const allowed = (process.env.SIGNUP_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length > 0 && !allowed.includes(parsed.data.email.trim().toLowerCase())) {
    return NextResponse.json({ error: "Registrierung ist in dieser privaten Vorschau nur auf Einladung möglich." }, { status: 403 });
  }
  const problem = passwordProblem(parsed.data.password);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    // Keine Aussage darüber, ob die Adresse schon registriert ist.
    return NextResponse.json({ error: "Registrierung mit dieser E-Mail-Adresse nicht möglich. Bitte melde dich an." }, { status: 409 });
  }

  const workspace = await createWorkspaceForUser({
    email: parsed.data.email,
    name: parsed.data.name,
    passwordHash: await hashPassword(parsed.data.password),
    workspaceName: parsed.data.workspaceName,
  });
  const user = workspace.users[0];
  await prisma.setting.create({
    data: { workspaceId: workspace.id, key: "consent.aiProcessing", value: new Date().toISOString() },
  });
  await prisma.auditLog.create({
    data: { workspaceId: workspace.id, userId: user.id, action: "account.created", detail: "Registrierung" },
  });

  const { token, expiresAt } = await createSession(user.id);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  return response;
}

export const POST = route(handlePOST);
