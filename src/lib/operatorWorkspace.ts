import { prisma } from "@/lib/db";

/**
 * Arbeitsbereich des Betreibers (für Anfragen von der öffentlichen Webseite):
 * SECRET58_OPERATOR_WORKSPACE_ID, sonst der Arbeitsbereich des ersten
 * Betreiberkontos. null, solange kein Betreiberkonto eingerichtet ist.
 */
export async function operatorWorkspaceId(): Promise<string | null> {
  const configured = process.env.SECRET58_OPERATOR_WORKSPACE_ID?.trim();
  if (configured) {
    const ws = await prisma.workspace.findUnique({ where: { id: configured }, select: { id: true } });
    if (ws) return ws.id;
  }
  const operator = await prisma.user.findFirst({ where: { isOperator: true }, orderBy: { createdAt: "asc" } });
  return operator?.workspaceId ?? null;
}
