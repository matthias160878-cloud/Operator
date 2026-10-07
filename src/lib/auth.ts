import crypto from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

/**
 * Echte Authentifizierung (Abschnitt "Authentifizierung" — auf Nutzerwunsch
 * ergänzt, Abschnitt 2 des Auftrags: Berechtigung MUSS aus der
 * authentifizierten Sitzung abgeleitet werden, nie aus einer vom Client
 * gelieferten Workspace-ID). Ersetzt den bisherigen Single-Default-Workspace
 * aus `lib/workspace.ts` durch echte Nutzerkonten mit eigenem Workspace pro
 * Signup.
 *
 * Passwort-Hashing: `node:crypto.scrypt` (im Node-Standard enthalten, keine
 * zusätzliche Abhängigkeit) statt bcrypt/argon2 — für diese Nutzerzahl
 * ausreichend sicher; bei Bedarf später austauschbar, ohne Aufrufer
 * anzufassen (gleiches Prinzip wie bei `getCurrentWorkspaceId()`).
 *
 * Session-Tokens: zufällig (32 Byte), nur der SHA-256-Hash landet in der DB
 * (siehe `Session`-Modell) — ein DB-Leak allein reicht nicht, um eine
 * Sitzung zu übernehmen.
 */

export const SESSION_COOKIE_NAME = "s58_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 Tage

export class AuthError extends Error {}

// --- Passwörter --------------------------------------------------------

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const derived = await scrypt(password, salt);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const derived = await scrypt(password, salt);
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

function scrypt(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derived) => {
      if (err) reject(err);
      else resolve(derived as Buffer);
    });
  });
}

export function isPasswordStrongEnough(password: string): boolean {
  return typeof password === "string" && password.length >= 8;
}

// --- Sessions ------------------------------------------------------------

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSessionToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  return token;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  workspaceId: string;
}

/**
 * Liest die Session ausschließlich aus dem httpOnly-Cookie (serverseitig
 * gesetzt) — niemals aus einem Query-/Body-Parameter, damit kein Request
 * sich selbst als anderer Nutzer ausgeben kann.
 */
export async function getSessionUser(): Promise<AuthenticatedUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return resolveSessionToken(token);
}

export async function resolveSessionToken(token: string): Promise<AuthenticatedUser | null> {
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    // Abgelaufene Session aufräumen statt stillschweigend zu ignorieren.
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    workspaceId: session.user.workspaceId,
  };
}

/**
 * Für API-Routen: liefert den eingeloggten Nutzer oder wirft `AuthError`
 * (vom Aufrufer als 401 zu behandeln). Ersetzt den alten, ungeschützten
 * `getCurrentWorkspaceId()`-Fallback auf den geteilten Default-Workspace.
 */
export async function requireSessionUser(): Promise<AuthenticatedUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new AuthError("Nicht angemeldet.");
  }
  return user;
}

export async function destroySessionByToken(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}
