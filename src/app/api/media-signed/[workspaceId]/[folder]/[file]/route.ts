import path from "node:path";
import { timingSafeEqual } from "node:crypto";
import { MEDIA_CONTENT_TYPES, mediaSignature, readMediaFile } from "@/lib/mediaStorage";

/** Öffentlicher Abruf NUR mit gültiger, nicht abgelaufener Signatur (für Plattform-Uploads per URL). */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string; folder: string; file: string }> }
) {
  const { workspaceId, folder, file } = await params;
  const url = new URL(request.url);
  const exp = Number(url.searchParams.get("exp"));
  const sig = url.searchParams.get("sig") ?? "";
  if (!Number.isFinite(exp) || exp < Date.now() / 1000) return new Response("Abgelaufen.", { status: 403 });
  let expected: string;
  try {
    expected = mediaSignature(workspaceId, folder, file, exp);
  } catch {
    return new Response("Nicht verfügbar.", { status: 503 });
  }
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return new Response("Ungültig.", { status: 403 });
  const data = await readMediaFile(workspaceId, folder, file);
  if (!data) return new Response("Nicht gefunden.", { status: 404 });
  const type = MEDIA_CONTENT_TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream";
  return new Response(new Uint8Array(data), { headers: { "content-type": type, "cache-control": "private, no-store" } });
}
