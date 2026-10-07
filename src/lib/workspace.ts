import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";

/**
 * SECRET 58 ist als Multi-Tenant-System modelliert (siehe prisma/schema.prisma:
 * Workspace -> Users/Brand/Campaigns/... mit vollständiger Isolation pro
 * Workspace). Seit Einführung echter Nutzerkonten (`lib/auth.ts`) löst diese
 * Funktion die Workspace-ID ausschließlich aus der authentifizierten Session
 * auf — nie aus einer vom Client gelieferten ID, nie aus einem geteilten
 * Default-Workspace. Ohne gültige Session wirft sie `AuthError`; `proxy.ts`
 * sorgt dafür, dass geschützte Seiten/Routen diese Funktion ohnehin nur mit
 * gültiger Session erreichen.
 *
 * Der Rest der App fragt ausschließlich über diese Funktion nach der
 * Workspace-ID und musste bei dieser Umstellung nicht geändert werden.
 */
export async function getCurrentWorkspaceId(): Promise<string> {
  const user = await requireSessionUser();
  return user.workspaceId;
}

export async function getCurrentUser() {
  return requireSessionUser();
}

/**
 * Vollständiger Workspace-Datensatz (Name/Slug) des eingeloggten Nutzers —
 * Ersatz für das frühere `getDefaultWorkspace()`, das immer den einen
 * geteilten Default-Workspace zurückgab.
 */
export async function getCurrentWorkspace() {
  const user = await requireSessionUser();
  const workspace = await prisma.workspace.findUnique({ where: { id: user.workspaceId } });
  if (!workspace) {
    throw new Error("Workspace für aktuelle Session nicht gefunden.");
  }
  return workspace;
}
