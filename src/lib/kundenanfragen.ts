/**
 * Filter für die Kundenseite /kundenanfragen.
 *
 * Anfragen über Empfehlungslinks (Kanal „empfehlung“) sieht der Kunde immer —
 * unabhängig vom Pilot-Schalter. Weitere Pilot-Anfragen (Echtfälle aus dem
 * Kundenanfragen-Pilot) erscheinen nur mit PILOTSTUDIO_KUNDENBEREICH=true.
 * Die Workspace-ID kommt immer aus der Sitzung (getCurrentWorkspaceId()).
 */
export const EMPFEHLUNG_KANAL = "empfehlung";

export function pilotKundenbereichFreigeschaltet(env: Record<string, string | undefined> = process.env): boolean {
  return env.PILOTSTUDIO_KUNDENBEREICH === "true";
}

export function kundenanfragenFilter(workspaceId: string, pilotFreigeschaltet: boolean) {
  if (!workspaceId) throw new Error("workspaceId fehlt");
  return {
    workspaceId,
    OR: pilotFreigeschaltet
      ? [{ channel: EMPFEHLUNG_KANAL }, { isDemo: false }]
      : [{ channel: EMPFEHLUNG_KANAL }],
  };
}
