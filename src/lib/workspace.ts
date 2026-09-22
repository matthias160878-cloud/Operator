import { prisma } from "@/lib/db";

/**
 * SECRET 58 ist als Multi-Tenant-System modelliert (siehe prisma/schema.prisma:
 * Workspace -> Users/Brand/Campaigns/... mit vollständiger Isolation pro Workspace).
 * Es gibt noch keine Login-/Auth-UI (Phase 14 ist als Nächstes geplant, siehe
 * README-SOCIAL-MEDIA.md). Bis dahin arbeitet die App mit genau einem
 * Default-Workspace, der beim ersten Aufruf angelegt wird. Jede spätere
 * Auth-Integration muss nur `getCurrentWorkspaceId()` durch eine echte
 * Session-Auflösung ersetzen — der Rest des Codes fragt ausschließlich über
 * diese Funktion nach der Workspace-ID und bleibt unverändert.
 */
const DEFAULT_WORKSPACE_SLUG = "secret-58";

let cachedWorkspaceId: string | null = null;

export async function getDefaultWorkspace() {
  if (cachedWorkspaceId) {
    const existing = await prisma.workspace.findUnique({
      where: { id: cachedWorkspaceId },
    });
    if (existing) return existing;
  }

  const workspace = await prisma.workspace.upsert({
    where: { slug: DEFAULT_WORKSPACE_SLUG },
    update: {},
    create: {
      name: "Secret 58 Media",
      slug: DEFAULT_WORKSPACE_SLUG,
      users: {
        create: {
          email: "max.mustermann@secret58.media",
          name: "Max Mustermann",
          role: "OWNER",
        },
      },
      brand: {
        create: {
          name: "Secret 58",
          description:
            "KI-natives Social-Media-Studio für autonome Content-Produktion.",
          targetAudience: "25-45 Jahre, Tech-Interessierte",
          industry: "KI & Technologie",
          language: "Deutsch",
          tonality: "Professionell & Inspirierend",
          humor: "Dezent",
          formality: "Neutral, geduzt",
          preferredWords: JSON.stringify(["autonom", "Wirkung", "Klarheit"]),
          forbiddenWords: JSON.stringify(["revolutionär", "disruptiv"]),
          preferredCtas: JSON.stringify([
            "Jetzt mehr erfahren",
            "Starte deine erste Kampagne",
          ]),
          brandValues: JSON.stringify(["Innovation", "Vertrauen", "Erfolg"]),
          topics: JSON.stringify([
            "KI-Agenten",
            "Content-Automatisierung",
            "Social Media Strategie",
          ]),
          colors: JSON.stringify(["#6D5BFF", "#22D3EE", "#0B0F1A"]),
          fonts: JSON.stringify(["Geist Sans", "Geist Mono"]),
          visualRules: "Dunkles UI, HUD-Elemente, klare Typografie.",
        },
      },
    },
  });

  cachedWorkspaceId = workspace.id;
  return workspace;
}

export async function getCurrentWorkspaceId() {
  const workspace = await getDefaultWorkspace();
  return workspace.id;
}
