/**
 * Optional: Versand-Worker im Web-Prozess mitlaufen lassen
 * (PUBLISH_WORKER=inline), z. B. für eine Staging-Umgebung mit nur einem
 * Dienst. Für den Dauerbetrieb besser einen eigenen Prozess (npm run worker).
 * Achtung: Schläft der Web-Dienst (Render-Gratistarif), schläft auch der Versand.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // Server-Zeitzone = Anzeige-Zeitzone, damit Datumsanzeigen und die
  // Kalender-Tageszuordnung nicht in UTC rechnen (Render-Standard).
  const { APP_TIME_ZONE } = await import("@/lib/timezone");
  if (!process.env.TZ) process.env.TZ = APP_TIME_ZONE;
  // In der App hinterlegte Zugänge (Betreiberbereich → Zugänge) übernehmen.
  const { applyOperatorSettings } = await import("@/lib/operatorSettings");
  await applyOperatorSettings().catch((err) => console.error("[zugaenge] Übernahme fehlgeschlagen:", err instanceof Error ? err.message : err));
  // Startmeldung zur Konfiguration — nur ob etwas gesetzt ist, nie die Werte.
  const { isComposioConfigured, authConfigIdFor } = await import("@/lib/composio/client");
  const { COMPOSIO_TOOLKITS } = await import("@/lib/composio/toolkits");
  const plattformen = COMPOSIO_TOOLKITS.filter((t) => authConfigIdFor(t)).map((t) => t.key).join(", ") || "keine";
  console.log(
    `[start] Composio: Schlüssel ${isComposioConfigured() ? "gesetzt" : "fehlt"}, Plattformen: ${plattformen}; ` +
      `PUBLIC_APP_URL ${process.env.PUBLIC_APP_URL?.trim() ? "gesetzt" : "fehlt"}`
  );
  const { currentTextProvider } = await import("@/lib/ai/textGenerator");
  console.log(`[start] KI-Anbieter: ${currentTextProvider()}; Webseiten-Chat mit KI: ${process.env.WEBSITE_KI === "true" ? "an" : "aus"}`);
  if (process.env.PUBLISH_WORKER !== "inline") return;
  const { startPublishWorker } = await import("@/lib/publishWorker");
  const origin = process.env.PUBLIC_APP_URL?.trim().replace(/\/+$/, "") ?? "";
  startPublishWorker({ publicOrigin: origin, intervalMs: Number(process.env.PUBLISH_WORKER_INTERVAL_MS ?? 30_000) });
}
