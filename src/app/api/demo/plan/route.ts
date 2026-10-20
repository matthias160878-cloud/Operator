import { NextResponse } from "next/server";
import { clientIp, hitRateLimit } from "@/lib/rateLimit";
// Unverändert aus der Zentrale übernommen (src/lib/zentrale/README.md).
import * as kernPlaner from "@/lib/zentrale/kern/planer.js";
import * as kernRechte from "@/lib/zentrale/kern/rechte.js";
import { pruefe as gatePruefe } from "@/lib/zentrale/agenten/gate.js";

const HOECHSTENS_ZEICHEN = 500;

/**
 * Demo der Startseite: rechnet aus einem Ziel einen Plan (Regeln, kein
 * KI-Aufruf). Ausgeführt wird nichts. Gleiche Logik wie in der Zentrale;
 * nur der Hinweis ist an die gemeinsame Anwendung angepasst — der
 * Kundenbereich der App führt diese Schritte nicht aus.
 */
export async function POST(request: Request) {
  if (!(await hitRateLimit(`demo-plan:${clientIp(request)}`, 20, 600))) {
    return NextResponse.json({ meldung: "Zu viele Anfragen. Bitte in ein paar Minuten erneut versuchen." }, { status: 429 });
  }
  const roh = await request.json().catch(() => null);
  if (!roh) return NextResponse.json({ meldung: "Ungültige Anfrage." }, { status: 400 });
  const ziel = String(roh?.ziel || "").trim().slice(0, HOECHSTENS_ZEICHEN);
  if (!ziel) return NextResponse.json({ meldung: "Ohne Ziel lässt sich nichts planen.", ausgefuehrt: false }, { status: 400 });

  // Banking, Behörden und Zahlungen bekommen keinen Plan — auch keinen, der nur angezeigt wird.
  const tor = gatePruefe({ stufe: 0, nachricht: ziel });
  if (tor.entscheidung === "abgelehnt") {
    return NextResponse.json({ ziel, gesperrt: true, meldung: tor.grund, ausgefuehrt: false });
  }
  const plan = kernPlaner.planen(ziel);
  if (!plan.ok) return NextResponse.json({ meldung: plan.grund, ausgefuehrt: false }, { status: 400 });
  const geprueft = kernPlaner.planPruefen(plan.schritte);
  if (!geprueft.ok) return NextResponse.json({ meldung: geprueft.grund, ausgefuehrt: false }, { status: 500 });

  const sicht = kernPlaner.oeffentlich(plan);
  const vorgabe = kernRechte.VORGABE as Record<string, { zweck?: string }>;
  return NextResponse.json({
    ziel,
    gesperrt: false,
    absicht: sicht.absicht,
    warum: sicht.warum,
    schritte: sicht.schritte.map((s: { nr: number; agent: string; name: string; recht: string; warum: string; offen: unknown }) => ({
      nr: s.nr,
      agent: s.agent,
      name: s.name,
      recht: s.recht,
      freigabe: kernRechte.brauchtFreigabe(s.recht),
      wirkung: vorgabe[s.recht]?.zweck || "",
      warum: s.warum,
      offen: s.offen,
    })),
    ausgefuehrt: false,
    modell_bereit: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
    hinweis:
      "Dieser Plan ist gerechnet, nicht erfunden: Er zeigt, wie Secret 58 die Aufgabe auf Agenten verteilen würde. " +
      "Ausgeführt wurde nichts. Für die Umsetzung sprechen Sie uns über das Kontaktformular an; " +
      "jeder Schritt mit Außenwirkung braucht Ihre Freigabe.",
  });
}
