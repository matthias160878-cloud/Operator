import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth/session";

/**
 * Mehrkundenbetrieb: Die Workspace-ID kommt ausschließlich aus der
 * angemeldeten Sitzung (Cookie -> Session -> User -> workspaceId), niemals
 * aus Anfrage-Parametern oder Formularfeldern. Ohne Sitzung wirft diese
 * Funktion AuthRequiredError; der Proxy (src/proxy.ts) fängt nicht
 * angemeldete Anfragen vorher ab.
 */
export async function getCurrentWorkspaceId(): Promise<string> {
  const user = await requireSessionUser();
  return user.workspaceId;
}

export async function getCurrentWorkspace() {
  const workspaceId = await getCurrentWorkspaceId();
  return prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
}

/**
 * Legt für ein neues Konto einen eigenen, leeren Workspace an. Jede
 * Registrierung bekommt einen eigenen Bereich — es gibt keinen geteilten
 * Standard-Workspace mehr.
 */
export async function createWorkspaceForUser(input: {
  email: string;
  name: string;
  passwordHash: string;
  workspaceName: string;
  isOperator?: boolean;
}) {
  const slugBase =
    input.workspaceName
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "workspace";
  const slug = `${slugBase}-${Math.random().toString(36).slice(2, 8)}`;
  return prisma.workspace.create({
    data: {
      name: input.workspaceName,
      slug,
      users: {
        create: {
          email: input.email,
          name: input.name,
          role: "OWNER",
          passwordHash: input.passwordHash,
          isOperator: input.isOperator ?? false,
        },
      },
      brand: { create: { name: input.workspaceName } },
    },
    include: { users: true },
  });
}
