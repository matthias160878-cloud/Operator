import path from "node:path";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { MEDIA_CONTENT_TYPES, readMediaFile } from "@/lib/mediaStorage";
import { NotFoundError, route } from "@/lib/api";

async function handleGET(_request: Request, { params }: { params: Promise<{ folder: string; file: string }> }) {
  const { folder, file } = await params;
  const workspaceId = await getCurrentWorkspaceId();
  const data = await readMediaFile(workspaceId, folder, file);
  if (!data) throw new NotFoundError();
  const type = MEDIA_CONTENT_TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream";
  return new Response(new Uint8Array(data), {
    headers: {
      "content-type": type,
      "cache-control": "private, max-age=300",
      "x-content-type-options": "nosniff",
      "content-disposition": type.startsWith("text/") ? `attachment; filename="${file}"` : "inline",
    },
  });
}

export const GET = route(handleGET);
