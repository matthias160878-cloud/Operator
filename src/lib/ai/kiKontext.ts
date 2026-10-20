import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Welche KI-Schlüssel der laufende Vorgang benutzt. Kunden-Workspaces laufen
 * mit ihren eigenen Schlüsseln (Einstellungen → Eigene Zugänge), ohne Rückgriff
 * auf die Schlüssel des Betreibers. Ohne gesetzten Kontext (SECRET-58-eigene
 * Webseiten-Chats, Betreiberbereich) gelten die Server-Schlüssel.
 */
export interface KiSchluessel {
  quelle: "KUNDE" | "BETREIBER";
  /** Workspace des Kunden – für Verbrauchslimits */
  workspaceId?: string;
  anthropic?: string;
  openai?: string;
  gemini?: string;
}

export const kiSpeicher = new AsyncLocalStorage<KiSchluessel>();
