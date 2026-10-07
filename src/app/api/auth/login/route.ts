import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { clientIp, hitRateLimit } from "@/lib/rateLimit";
import { route } from "@/lib/api";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(200),
});

const GENERIC = "E-Mail-Adresse oder Passwort ist falsch.";

async function handlePOST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: GENERIC }, { status: 400 });
  const ip = clientIp(request);
  const allowed =
    (await hitRateLimit(`login-ip:${ip}`, 30, 900)) &&
    (await hitRateLimit(`login-user:${parsed.data.email}`, 10, 900));
  if (!allowed) {
    return NextResponse.json({ error: "Zu viele Anmeldeversuche. Bitte in 15 Minuten erneut versuchen." }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  const ok = await verifyPassword(parsed.data.password, user?.passwordHash ?? null);
  if (!user || !ok) return NextResponse.json({ error: GENERIC }, { status: 401 });

  const { token, expiresAt } = await createSession(user.id);
  await prisma.auditLog.create({
    data: { workspaceId: user.workspaceId, userId: user.id, action: "auth.login", detail: "" },
  });
  const response = NextResponse.json({ ok: true, isOperator: user.isOperator });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  return response;
}

export const POST = route(handlePOST);
