import { prisma } from "@/lib/db";

/**
 * Pausenschalter für automatische Abläufe eines Workspaces (z. B. geplante
 * Veröffentlichungen). Pausiert = fällige Aufträge bleiben unverändert in der
 * Warteschlange und laufen erst nach dem Fortsetzen. Nichts geht verloren,
 * nichts wird doppelt ausgeführt.
 */
export const AUTOMATIK_PAUSIERT = "automatik.pausiert";

export async function automatikPausiert(workspaceId: string): Promise<boolean> {
  const s = await prisma.setting.findUnique({ where: { workspaceId_key: { workspaceId, key: AUTOMATIK_PAUSIERT } } });
  return s?.value === "1";
}

export async function pausierteWorkspaces(): Promise<string[]> {
  return (await prisma.setting.findMany({ where: { key: AUTOMATIK_PAUSIERT, value: "1" }, select: { workspaceId: true } })).map((s) => s.workspaceId);
}

export async function automatikSetzen(workspaceId: string, pausiert: boolean) {
  await prisma.setting.upsert({
    where: { workspaceId_key: { workspaceId, key: AUTOMATIK_PAUSIERT } },
    create: { workspaceId, key: AUTOMATIK_PAUSIERT, value: pausiert ? "1" : "0" },
    update: { value: pausiert ? "1" : "0" },
  });
}
