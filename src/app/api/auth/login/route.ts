import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword, createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  // Pro IP UND pro E-Mail begrenzen, damit weder ein einzelner Angreifer
  // viele Konten durchprobieren noch ein einzelnes Konto von vielen
  // IPs aus per Brute-Force angegriffen werden kann.
  const limit = checkRateLimit(`auth-login:${ip}`, 10, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Zu viele Anmeldeversuche. Bitte später erneut versuchen." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const emailLimit = checkRateLimit(`auth-login-email:${email.toLowerCase()}`, 10, 15 * 60 * 1000);
  if (!emailLimit.allowed) {
    return NextResponse.json(
      { error: "Zu viele Anmeldeversuche für dieses Konto. Bitte später erneut versuchen." },
      { status: 429 },
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // Bewusst dieselbe generische Fehlermeldung bei unbekannter E-Mail und
  // falschem Passwort — sonst ließe sich über die Fehlermeldung erraten,
  // welche E-Mail-Adressen registriert sind.
  const genericError = NextResponse.json({ error: "E-Mail oder Passwort ist falsch." }, { status: 401 });

  if (!user) return genericError;
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return genericError;

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
