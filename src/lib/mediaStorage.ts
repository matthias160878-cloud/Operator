import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Strukturierte lokale Medienablage (Abschnitt 25). Liegt unter /public/media,
 * damit Next.js die Dateien direkt ausliefert. Für Produktion: durch einen
 * Cloud-Storage-Adapter (S3/GCS/Blob) mit derselben Ordnerstruktur ersetzen —
 * `saveMediaFile` ist die einzige Stelle, die dafür angepasst werden muss.
 */
export type MediaFolder = "audio" | "video" | "images" | "thumbnails" | "subtitles";

const MEDIA_ROOT = path.join(process.cwd(), "public", "media");

export async function saveMediaFile(
  folder: MediaFolder,
  filename: string,
  data: Buffer | ArrayBuffer | string
): Promise<string> {
  const dir = path.join(MEDIA_ROOT, folder);
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, filename);
  const buffer =
    typeof data === "string"
      ? Buffer.from(data, "utf-8")
      : Buffer.isBuffer(data)
        ? data
        : Buffer.from(data);
  await writeFile(filePath, buffer);
  return `/media/${folder}/${filename}`;
}
