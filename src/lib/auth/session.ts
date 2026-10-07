import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const SESSION_COOKIE = "s58_session";
const SESSION_DAYS = 30;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { id: hashToken(token), userId, expiresAt } });
  return { token, expiresAt };
}

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

export interface SessionUser {
  userId: string;
  workspaceId: string;
  email: string;
  name: string;
  isOperator: boolean;
}

/** Löst ein Cookie-Token zur Sitzung auf. Abgelaufene Sitzungen zählen nicht. */
export async function resolveSessionToken(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { id: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  return {
    userId: session.user.id,
    workspaceId: session.user.workspaceId,
    email: session.user.email,
    name: session.user.name,
    isOperator: session.user.isOperator,
  };
}

/** Aktuelle Sitzung aus dem Request-Cookie (Server Components, Route Handler). */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return resolveSessionToken(store.get(SESSION_COOKIE)?.value);
}

export class AuthRequiredError extends Error {
  readonly status = 401;
  constructor() {
    super("Anmeldung erforderlich.");
  }
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthRequiredError();
  return user;
}

export async function destroySession(token: string | undefined | null) {
  if (!token) return;
  await prisma.session.deleteMany({ where: { id: hashToken(token) } });
}
