import { NextResponse } from "next/server";
import { z } from "zod";
import { route } from "@/lib/api";
import { bearbeiterOderAntwort } from "@/lib/reichweite/zugriff";
import { runAgent } from "@/lib/agents/runner";
import { generateText, currentTextProvider } from "@/lib/ai/textGenerator";
import { mitKiZugang } from "@/lib/ai/kundenKi";
import { kostenSchaetzen } from "@/lib/ai/kosten";
import { kiLimitsLesen, kiVerbrauch } from "@/lib/ai/kiLimits";
import { faktZeile, UNGEPRUEFT } from "@/lib/reichweitenaufbau/plattformformate";
import { eigeneReichweitenKampagne } from "@/lib/reichweitenaufbau/kampagnenService";

const schema = z.object({
  text: z.string().min(1).max(6000),
  fakten: z.array(z.object({ text: z.string().max(500), quelle: z.string().max(300), geprueft: z.boolean() })).max(10),
  bestaetigt: z.boolean().default(false),
});
const MAX_TOKENS = 900;
const SYSTEM = [
  "Du überarbeitest einen Social-Media-Text sprachlich (flüssiger, klarer, gleiche Länge oder kürzer).",
  "Zeilen, die mit [n] enden (n = Zahl), sind Fakten: übernimm sie Zeichen für Zeichen unverändert, einschließlich der Markierung [UNGEPRÜFT].",
  "Den Abschnitt „Quellen:“ und Links übernimmst du unverändert. Erfinde keine neuen Fakten, Zahlen, Preise oder Versprechen.",
  "Antworte nur mit dem überarbeiteten Text.",
].join("\n");

/**
 * Kostenpflichtige KI-Überarbeitung einer Variante mit dem eigenen Schlüssel.
 * Ohne `bestaetigt` wird nur die Kostenschätzung geliefert, nichts generiert.
 * Fakten, die die KI verändert, führen zum Verwerfen des Ergebnisses.
 */
async function handlePOST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const { id } = await params;
  const k = await eigeneReichweitenKampagne(user.workspaceId, id);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  const { text, fakten, bestaetigt } = parsed.data;
  return mitKiZugang(user.workspaceId, async () => {
    const anbieter = currentTextProvider();
    if (anbieter === "template") {
      return NextResponse.json({ error: "Kein eigener KI-Schlüssel eingetragen (Einstellungen → Eigene Zugänge). Es entstehen keine Kosten." }, { status: 409 });
    }
    const schaetzung = kostenSchaetzen(anbieter, SYSTEM.length + text.length, MAX_TOKENS);
    if (!bestaetigt) {
      const [limits, verbrauch] = await Promise.all([kiLimitsLesen(user.workspaceId), kiVerbrauch(user.workspaceId)]);
      return NextResponse.json({ schaetzung, limits, verbrauch });
    }
    const r = await runAgent("content-brain", user.workspaceId, `Plattformformat überarbeiten (${k.titel})`, () => generateText({ system: SYSTEM, prompt: text, maxTokens: MAX_TOKENS }), "AI_TEXT");
    const neu = r.text.trim();
    const fehlend = fakten.map((f, i) => faktZeile(f, i + 1)).filter((z) => !neu.includes(z));
    const markierungen = (s: string) => s.split(UNGEPRUEFT).length - 1;
    if (fehlend.length || markierungen(neu) < markierungen(text)) {
      return NextResponse.json({ ok: false, schaetzung, fehler: "Die KI hat Fakten oder Markierungen verändert – das Ergebnis wurde verworfen, der ursprüngliche Text bleibt.", fehlend });
    }
    return NextResponse.json({ ok: true, schaetzung, text: neu });
  });
}

export const POST = route(handlePOST);
