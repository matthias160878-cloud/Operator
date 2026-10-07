import { createHash, createHmac } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Private, nach Workspace getrennte Medienablage. Dateien liegen NICHT mehr
 * unter /public (dort wären sie für jeden mit der URL abrufbar), sondern unter
 * MEDIA_STORAGE_DIR/<workspaceId>/<ordner>/<datei>. Ausgeliefert werden sie
 * nur über /api/media/..., das den Workspace aus der Sitzung nimmt — eine
 * fremde Datei ist so auch mit bekannter URL nicht erreichbar.
 */
export type MediaFolder = "audio" | "video" | "images" | "thumbnails" | "subtitles";
const FOLDERS: MediaFolder[] = ["audio", "video", "images", "thumbnails", "subtitles"];

function storageRoot(): string {
  return process.env.MEDIA_STORAGE_DIR || path.join(process.cwd(), "storage", "media");
}

const SAFE_NAME = /^[A-Za-z0-9._-]{1,120}$/;
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

function resolvePath(workspaceId: string, folder: string, filename: string): string | null {
  if (!SAFE_ID.test(workspaceId) || !FOLDERS.includes(folder as MediaFolder) || !SAFE_NAME.test(filename)) {
    return null;
  }
  if (filename.startsWith(".")) return null;
  return path.join(storageRoot(), workspaceId, folder, filename);
}

export async function saveMediaFile(
  workspaceId: string,
  folder: MediaFolder,
  filename: string,
  data: Buffer | ArrayBuffer | string
): Promise<string> {
  const filePath = resolvePath(workspaceId, folder, filename);
  if (!filePath) throw new Error("Ungültiger Dateiname.");
  await mkdir(path.dirname(filePath), { recursive: true });
  const buffer =
    typeof data === "string" ? Buffer.from(data, "utf-8") : Buffer.isBuffer(data) ? data : Buffer.from(data);
  await writeFile(filePath, buffer);
  return `/api/media/${folder}/${filename}`;
}

export async function readMediaFile(workspaceId: string, folder: string, filename: string): Promise<Buffer | null> {
  const filePath = resolvePath(workspaceId, folder, filename);
  if (!filePath) return null;
  try {
    return await readFile(filePath);
  } catch {
    return null;
  }
}

export const MEDIA_CONTENT_TYPES: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".srt": "text/plain; charset=utf-8",
  ".vtt": "text/vtt; charset=utf-8",
};

/** Interne URL /api/media/<ordner>/<datei> -> Teile; null bei fremdem Format. */
export function parseMediaUrl(url: string): { folder: string; file: string } | null {
  const m = /^\/api\/media\/([a-z]+)\/([A-Za-z0-9._-]+)$/.exec(url);
  return m ? { folder: m[1], file: m[2] } : null;
}

function mediaSigningKey(): Buffer {
  const secret = process.env.MEDIA_URL_SECRET || process.env.TOKEN_ENCRYPTION_KEY;
  if (!secret) throw new Error("MEDIA_URL_SECRET (oder TOKEN_ENCRYPTION_KEY) fehlt — signierte Medien-Links nicht möglich.");
  return createHash("sha256").update(`secret58-media:${secret}`).digest();
}

export function mediaSignature(workspaceId: string, folder: string, file: string, expires: number): string {
  return createHmac("sha256", mediaSigningKey()).update(`${workspaceId}/${folder}/${file}/${expires}`).digest("base64url");
}

/**
 * Kurzlebiger, signierter Link für Plattformen, die eine Datei selbst abholen
 * (Instagram, TikTok). Gilt nur für genau diese Datei und läuft ab.
 */
export function signedMediaUrl(origin: string, workspaceId: string, url: string, ttlSeconds = 3600): string {
  const parts = parseMediaUrl(url);
  if (!parts) throw new Error("Unbekanntes Medien-URL-Format.");
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const sig = mediaSignature(workspaceId, parts.folder, parts.file, expires);
  return `${origin}/api/media-signed/${workspaceId}/${parts.folder}/${parts.file}?exp=${expires}&sig=${sig}`;
}
