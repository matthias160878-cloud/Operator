/**
 * Optional: Versand-Worker im Web-Prozess mitlaufen lassen
 * (PUBLISH_WORKER=inline), z. B. für eine Staging-Umgebung mit nur einem
 * Dienst. Für den Dauerbetrieb besser einen eigenen Prozess (npm run worker).
 * Achtung: Schläft der Web-Dienst (Render-Gratistarif), schläft auch der Versand.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.PUBLISH_WORKER !== "inline") return;
  const { startPublishWorker } = await import("@/lib/publishWorker");
  const origin = process.env.PUBLIC_APP_URL?.trim().replace(/\/+$/, "") ?? "";
  startPublishWorker({ publicOrigin: origin, intervalMs: Number(process.env.PUBLISH_WORKER_INTERVAL_MS ?? 30_000) });
}
