import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Strukturierte lokale Medienablage (Abschnitt 25). Liegt AUSSERHALB von
 * /public, damit Next.js die Dateien NICHT direkt und ungeprüft ausliefert
 * --- das war bis zur Sicherheitsprüfung der Fall und hätte jedem mit der
 * (teilweise erratbaren, z.B. `voiceover-<timestamp>.mp3`) URL Zugriff auf
 * private Kundeninhalte fremder Workspaces gegeben, ganz ohne Anmeldung.
 * Ausgeliefert wird jetzt ausschließlich über `src/app/media/[...path]/
 * route.ts`, die Anmeldung UND Workspace-Zugehörigkeit (`MediaAsset.
 * workspaceId`) prüft, bevor sie eine Datei streamt. Für Produktion: durch
 * einen Cloud-Storage-Adapter (S3/GCS/Blob) mit derselben Ordnerstruktur
 * ersetzen --- `saveMediaFile` ist die einzige Stelle, die dafür angepasst
 * werden muss.
 */
export type MediaFolder = "audio" | "video" | "images" | "thumbnails" | "subtitles";

const MEDIA_ROOT = path.join(process.cwd(), "media-storage");

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
