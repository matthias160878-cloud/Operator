import { prisma } from "@/lib/db";
import { getPackage, isPackageId, type PackageId } from "@/lib/packages";

/**
 * Monatliche Kontingent-Durchsetzung je Paket (Abschnitt 3 des Auftrags:
 * "feste Kontingente, keine automatischen kostenpflichtigen
 * Überschreitungen"). Zählquelle ist die bereits bestehende `agent_runs`-
 * Tabelle (jeder Agenten-Aufruf wird dort via `runAgent()` protokolliert,
 * siehe lib/agents/runner.ts) — kein separater Zähler nötig, und die
 * Zählung ist automatisch pro Workspace getrennt (kein Risiko, Kontingente
 * über Mandantengrenzen hinweg zu vermischen).
 *
 * Nur drei Ressourcen werden gedeckelt — dieselben drei, die bereits die
 * (noch nicht buchbare) Autopilot-Vorschau als Kontingent-Dimensionen
 * nutzt: Ideen, Videos, Sprachausgabe. Alle anderen Agenten (Script, Hook,
 * Hashtag, Thumbnail, Subtitle, Content-Brain, …) bleiben nur durch das
 * bestehende Rate-Limiting geschützt, nicht zusätzlich durch ein
 * Monatskontingent — das ist eine bewusste Scope-Entscheidung, siehe
 * Projektbericht.
 */
export type QuotaResource = "idea" | "video" | "voice";

const RESOURCE_AGENT_KEYS: Record<QuotaResource, string> = {
  idea: "idea",
  video: "video",
  voice: "voice",
};

export class QuotaExceededError extends Error {
  constructor(
    public readonly resource: QuotaResource,
    public readonly limit: number,
    public readonly used: number
  ) {
    super(`Monatliches Kontingent erreicht (${used}/${limit}).`);
  }
}

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

async function resolveWorkspacePackage(workspaceId: string): Promise<PackageId | null> {
  const license = await prisma.license.findFirst({
    where: { workspaceId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: { packageId: true },
  });
  return license?.packageId && isPackageId(license.packageId) ? license.packageId : null;
}

export interface QuotaStatus {
  packageId: PackageId | null;
  used: number;
  /** null = keine Beschränkung aktiv (Bezahlschranke insgesamt deaktiviert). */
  limit: number | null;
  allowed: boolean;
}

/**
 * Prüft, OHNE den aktuellen Aufruf schon mitzuzählen — der Aufrufer prüft
 * das vor dem eigentlichen (teuren) Agenten-Call und bricht bei
 * `allowed === false` ab, bevor überhaupt ein Provider-Request passiert.
 * Der aktuelle Aufruf selbst zählt erst durch seinen eigenen
 * `runAgent()`-Log-Eintrag zum nächsten Check dazu.
 *
 * Wie die Bezahlschranke selbst (proxy.ts) nur aktiv, wenn
 * OWNER_ACCESS_KEY gesetzt ist — im offenen Entwicklungsmodus bleibt die
 * App wie bisher ohne Kontingent nutzbar.
 */
export async function checkQuota(workspaceId: string, resource: QuotaResource): Promise<QuotaStatus> {
  if (!process.env.OWNER_ACCESS_KEY) {
    return { packageId: null, used: 0, limit: null, allowed: true };
  }

  const packageId = await resolveWorkspacePackage(workspaceId);
  if (!packageId) {
    // Sollte durch proxy.ts praktisch nicht erreichbar sein (dort wird
    // ohne aktive Lizenz schon auf /buy umgeleitet) — im Zweifel sicher
    // ablehnen statt unbegrenzt zuzulassen.
    return { packageId: null, used: 0, limit: 0, allowed: false };
  }

  const limit =
    resource === "idea"
      ? getPackage(packageId).quotas.ideasPerMonth
      : resource === "video"
        ? getPackage(packageId).quotas.videosPerMonth
        : getPackage(packageId).quotas.voiceGenerationsPerMonth;

  const used = await prisma.agentRun.count({
    where: {
      workspaceId,
      agentKey: RESOURCE_AGENT_KEYS[resource],
      startedAt: { gte: startOfCurrentMonth() },
    },
  });

  return { packageId, used, limit, allowed: used < limit };
}

/** Wirft `QuotaExceededError`, wenn das Kontingent erreicht ist. */
export async function requireQuota(workspaceId: string, resource: QuotaResource): Promise<void> {
  const status = await checkQuota(workspaceId, resource);
  if (!status.allowed) {
    throw new QuotaExceededError(resource, status.limit ?? 0, status.used);
  }
}
