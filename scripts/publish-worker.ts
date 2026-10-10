/**
 * Eigenständiger Versand-Worker für geplante Beiträge.
 *
 *   npm run worker            (z. B. als Render „Background Worker“)
 *
 * Braucht dieselbe DATABASE_URL wie die Web-App und PUBLIC_APP_URL (für
 * signierte Medien-Links, die Instagram/TikTok selbst abholen). Nur EIN
 * Worker-Modus gleichzeitig: entweder dieser Prozess oder PUBLISH_WORKER=inline
 * in der Web-App — Aufträge sind zwar atomar gesperrt, doppelt laufen muss
 * es trotzdem nicht.
 */
import { startPublishWorker } from "@/lib/publishWorker";

const origin = process.env.PUBLIC_APP_URL?.trim().replace(/\/+$/, "") ?? "";
if (!origin) console.warn("[publish-worker] PUBLIC_APP_URL fehlt — Instagram/TikTok können Medien dann nicht abholen.");
const intervalMs = Number(process.env.PUBLISH_WORKER_INTERVAL_MS ?? 30_000);

const stop = startPublishWorker({ publicOrigin: origin, intervalMs });
console.log(`[publish-worker] gestartet, Intervall ${intervalMs} ms`);
for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => {
    stop();
    console.log("[publish-worker] beendet");
    process.exit(0);
  });
}
