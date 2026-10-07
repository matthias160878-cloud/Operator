import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { MediaFolder } from "@/lib/mediaStorage";

/**
 * Liefert generierte Mediendateien (Sprachausgaben, Videos, Untertitel,
 * Thumbnails) nur an den Workspace aus, dem sie laut `MediaAsset.
 * workspaceId` gehören --- vorher lagen diese Dateien unter /public/media
 * und waren für JEDEN ohne Anmeldung erreichbar, teilweise sogar mit
 * erratbarem Dateinamen (`voiceover-<timestamp>.mp3`). Siehe
 * src/lib/mediaStorage.ts für die Ablage selbst.
 */
const MEDIA_ROOT = path.join(process.cwd(), "media-storage");
const ERLAUBTE_ORDNER: MediaFolder[] = ["audio", "video", "images", "thumbnails", "subtitles"];

const MIME_NACH_ENDUNG: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".srt": "application/x-subrip",
  ".vtt": "text/vtt",
};

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segmente } = await params;

  // Genau zwei Segmente erwartet: [ordner, dateiname] --- alles andere
  // (auch ein einzelnes ".." irgendwo drin) wird abgelehnt, bevor überhaupt
  // ein Dateisystemzugriff versucht wird.
  if (
    segmente.length !== 2 ||
    !ERLAUBTE_ORDNER.includes(segmente[0] as MediaFolder) ||
    segmente.some((teil) => teil.includes("..") || teil.includes("/") || teil.includes("\\"))
  ) {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }
  const [ordner, dateiname] = segmente;

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  const url = `/media/${ordner}/${dateiname}`;
  const asset = await prisma.mediaAsset.findFirst({ where: { url } });
  if (!asset || asset.workspaceId !== user.workspaceId) {
    // Bewusst dieselbe 404-Antwort wie "Datei existiert nicht" --- ein
    // falscher Workspace soll nicht einmal erfahren, dass die Datei
    // überhaupt existiert (kein Orakel über fremde Inhalte).
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }

  const absoluterPfad = path.join(MEDIA_ROOT, ordner, dateiname);
  if (!absoluterPfad.startsWith(MEDIA_ROOT + path.sep)) {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }

  try {
    const info = await stat(absoluterPfad);
    if (!info.isFile()) throw new Error("kein regulaeres File");
    const inhalt = await readFile(absoluterPfad);
    const contentType = MIME_NACH_ENDUNG[path.extname(dateiname).toLowerCase()] || "application/octet-stream";
    return new NextResponse(inhalt, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(info.size),
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }
}
