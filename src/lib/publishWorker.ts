import { prisma } from "@/lib/db";
import { getActivePlan } from "@/lib/entitlements";
import { runAgent } from "@/lib/agents/runner";
import { publishContentItem } from "@/lib/agents/publishingAgent";
import { claimPublishLock, releasePublishLock } from "@/lib/contentWorkflow";

export { queuePublishJob, cancelOpenJobs } from "@/lib/contentWorkflow";

/**
 * Versand geplanter Beiträge zum Termin.
 *
 * Ablauf je Durchlauf (tick):
 *  1. Unterbrochene Versuche (RUNNING länger als STALE_MS) → UNKNOWN. Ob die
 *     Plattform veröffentlicht hat, ist dann unklar; es wird NICHT erneut
 *     gesendet, der Kunde prüft selbst und plant bei Bedarf neu.
 *  2. Fällige Aufträge (QUEUED, Termin erreicht) einzeln atomar übernehmen.
 *  3. Vor dem Senden erneut prüfen: Beitrag noch geplant, Termin unverändert,
 *     Paket aktiv; dazu dieselbe Doppelversand-Sperre wie beim Klick.
 *  4. Ergebnis festhalten. Kein Erfolg → Beitrag zurück auf „Freigegeben“,
 *     damit nichts still liegen bleibt; der Fehler steht am Auftrag.
 */
const STALE_MS = 15 * 60 * 1000;
const BATCH = 10;

export type JobOutcome = "SUCCEEDED" | "FAILED" | "CANCELED" | "UNKNOWN" | "REQUEUED";

async function finish(jobId: string, status: Exclude<JobOutcome, "REQUEUED">, message: string) {
  await prisma.publishJob.update({ where: { id: jobId }, data: { status, message: message.slice(0, 500), finishedAt: new Date() } });
}

export async function recoverStaleJobs(now = new Date()): Promise<number> {
  const stale = await prisma.publishJob.findMany({
    where: { status: "RUNNING", startedAt: { lt: new Date(now.getTime() - STALE_MS) } },
  });
  for (const job of stale) {
    const moved = await prisma.publishJob.updateMany({
      where: { id: job.id, status: "RUNNING" },
      data: {
        status: "UNKNOWN",
        finishedAt: now,
        message: "Versand wurde unterbrochen. Bitte auf der Plattform prüfen, ob der Beitrag erschienen ist; es wird nicht automatisch erneut gesendet.",
      },
    });
    if (moved.count === 1) await releasePublishLock(job.contentItemId);
  }
  return stale.length;
}

export async function processJob(jobId: string, publicOrigin: string, now = new Date()): Promise<JobOutcome> {
  // Atomar übernehmen — ein zweiter Worker bekommt count 0.
  const claimed = await prisma.publishJob.updateMany({
    where: { id: jobId, status: "QUEUED", scheduledFor: { lte: now } },
    data: { status: "RUNNING", startedAt: now, attempts: { increment: 1 } },
  });
  if (claimed.count !== 1) return "REQUEUED";
  const job = await prisma.publishJob.findUniqueOrThrow({ where: { id: jobId } });
  const item = await prisma.contentItem.findUnique({ where: { id: job.contentItemId } });

  if (!item || item.status !== "SCHEDULED" || item.scheduledAt?.getTime() !== job.scheduledFor.getTime()) {
    await finish(job.id, "CANCELED", "Nicht gesendet: Beitrag ist nicht mehr zu diesem Termin geplant oder nicht mehr freigegeben.");
    return "CANCELED";
  }
  if (!(await getActivePlan(job.workspaceId))) {
    await finish(job.id, "FAILED", "Nicht gesendet: Kein aktives Paket.");
    await prisma.contentItem.update({ where: { id: item.id }, data: { status: "APPROVED" } });
    return "FAILED";
  }
  if (!(await claimPublishLock(item.id))) {
    // Wird gerade per Klick veröffentlicht — Auftrag beim nächsten Durchlauf erneut prüfen.
    await prisma.publishJob.update({ where: { id: job.id }, data: { status: "QUEUED", startedAt: null } });
    return "REQUEUED";
  }

  try {
    const result = await runAgent("publishing", job.workspaceId, `Geplanter Versand von Content-Item ${item.id}`, () =>
      publishContentItem(item.id, publicOrigin)
    );
    if (result.published) {
      await finish(job.id, "SUCCEEDED", result.message);
      return "SUCCEEDED";
    }
    await finish(job.id, "FAILED", result.message);
    await prisma.contentItem.update({ where: { id: item.id }, data: { status: "APPROVED" } });
    return "FAILED";
  } catch (err) {
    // Fehler außerhalb des Plattform-Aufrufs: Ausgang unklar, nicht wiederholen.
    const message = err instanceof Error ? err.message : "Unbekannter Fehler.";
    await finish(job.id, "UNKNOWN", `Ausgang unklar (${message}). Bitte auf der Plattform prüfen.`);
    return "UNKNOWN";
  } finally {
    await releasePublishLock(item.id);
  }
}

export async function tick(publicOrigin: string, now = new Date()) {
  const recovered = await recoverStaleJobs(now);
  const due = await prisma.publishJob.findMany({
    where: { status: "QUEUED", scheduledFor: { lte: now } },
    orderBy: { scheduledFor: "asc" },
    take: BATCH,
    select: { id: true },
  });
  const outcomes: JobOutcome[] = [];
  for (const job of due) outcomes.push(await processJob(job.id, publicOrigin, now));
  return { recovered, processed: outcomes };
}

/** Endlosschleife für den eigenständigen Worker-Prozess bzw. den eingebetteten Modus. */
export function startPublishWorker(options: { intervalMs?: number; publicOrigin: string; log?: (msg: string) => void }) {
  const intervalMs = options.intervalMs ?? 30_000;
  const log = options.log ?? ((m: string) => console.log(`[publish-worker] ${m}`));
  let running = false;
  const run = async () => {
    if (running) return; // keine überlappenden Durchläufe
    running = true;
    try {
      const r = await tick(options.publicOrigin);
      if (r.recovered || r.processed.length) log(`unterbrochen→unklar: ${r.recovered}, bearbeitet: ${r.processed.join(", ") || "–"}`);
    } catch (err) {
      log(`Durchlauf fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      running = false;
    }
  };
  const timer = setInterval(run, intervalMs);
  void run();
  return () => clearInterval(timer);
}
