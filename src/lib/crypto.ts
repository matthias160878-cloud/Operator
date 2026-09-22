import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

/**
 * Verschlüsselt OAuth-Zugangstokens vor dem Speichern in der Datenbank
 * (AES-256-GCM). Der Schlüssel wird aus TOKEN_ENCRYPTION_KEY abgeleitet
 * (beliebige Zeichenkette, per scrypt zu 32 Byte verdichtet) — nicht aus
 * den API-Schlüsseln selbst, damit ein DB-Leak allein nicht reicht, um
 * gespeicherte Plattform-Zugänge zu missbrauchen.
 */
function getKey(): Buffer {
  const secret = process.env.TOKEN_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY ist nicht gesetzt — zum Speichern von Plattform-Zugangstoken erforderlich."
    );
  }
  return scryptSync(secret, "secret58-token-encryption", 32);
}

export function isTokenEncryptionConfigured(): boolean {
  return Boolean(process.env.TOKEN_ENCRYPTION_KEY);
}

export function encryptToken(plainText: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptToken(cipherText: string): string {
  const key = getKey();
  const raw = Buffer.from(cipherText, "base64");
  const iv = raw.subarray(0, 12);
  const authTag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
