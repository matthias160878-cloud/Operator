import { kiSpeicher } from "@/lib/ai/kiKontext";
import { currentTextProvider, type TextGenProvider } from "@/lib/ai/textGenerator";
import { kiSchluesselFuer } from "@/lib/zugaenge/service";

/** Führt `fn` mit den KI-Schlüsseln des Workspaces aus (eigene des Kunden bzw. Betreiber-Schlüssel). */
export async function mitKiZugang<T>(workspaceId: string, fn: () => Promise<T>): Promise<T> {
  return kiSpeicher.run(await kiSchluesselFuer(workspaceId), fn);
}

/** Welcher KI-Anbieter für diesen Workspace aktiv wäre ("template" ohne eigenen Zugang). */
export async function kiAnbieterFuer(workspaceId: string): Promise<TextGenProvider> {
  return mitKiZugang(workspaceId, async () => currentTextProvider());
}
