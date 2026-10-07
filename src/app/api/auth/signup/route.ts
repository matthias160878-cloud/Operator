import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, createSessionToken, SESSION_COOKIE_NAME, isPasswordStrongEnough } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  name: z.string().min(1).max(120).default(""),
});

/**
 * Jeder Signup erzeugt genau einen neuen, leeren Workspace mit genau einem
 * Nutzer (Rolle OWNER) — niemals den geteilten Default-Workspace aus der
 * Zeit vor echten Nutzerkonten. Das ist die Grundlage für
 * Mandantentrennung: jeder Kunde bekommt ab hier seinen eigenen, privaten
 * Arbeitsbereich (Abschnitt 2 des Auftrags).
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`auth-signup:${ip}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Zu viele Registrierungsversuche. Bitte später erneut versuchen." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." },
      { status: 400 },
    );
  }
  const { email, password, name } = parsed.data;

  if (!isPasswordStrongEnough(password)) {
    return NextResponse.json(
      { error: "Das Passwort muss mindestens 8 Zeichen lang sein." },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Für diese E-Mail-Adresse existiert bereits ein Konto." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);
  const slug = `ws-${crypto.randomBytes(8).toString("hex")}`;

  const user = await prisma.user.create({
    data: {
      email,
      name: name || email.split("@")[0],
      passwordHash,
      role: "OWNER",
      workspace: {
        create: {
          name: name ? `${name}s Workspace` : "Mein Workspace",
          slug,
        },
      },
    },
  });

  const token = await createSessionToken(user.id);
  const response = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
  });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return response;
}
