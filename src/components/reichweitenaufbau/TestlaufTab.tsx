"use client";

import Link from "next/link";
import { Chip, DemoMarke, datum, useAktion } from "@/components/reichweitenaufbau/gemeinsam";
import { ErgebnisTabelle, type KErgebnis } from "@/components/reichweitenaufbau/KampagnenTab";
import { karte, knopf, knopfPrimaer } from "@/components/reichweitenaufbau/stil";

export interface TestlaufDaten {
  schritt: number;
  schritte: readonly string[];
  kampagne: { id: string; titel: string; ziel: string; zielgruppe: string; zielUrl: string; startAm: string | null; endeAm: string | null } | null;
  ablauf: { id: string; titel: string; erledigtAm: string | null; faelligAm: string | null }[];
  inhalte: { id: string; title: string; platform: string; status: string; simuliertAm: string | null; publishedAt: string | null }[];
  links: { id: string; code: string; bezeichnung: string; herkunft: string; stufe: number; angebotUrl: string }[];
  ergebnis: KErgebnis | null;
}

const STATUS: Record<string, string> = { DRAFT: "Entwurf", IN_REVIEW: "In Prüfung", APPROVED: "Freigegeben", PUBLISHED: "Veröffentlicht" };

export function TestlaufTab({ daten, darfBearbeiten }: { daten: TestlaufDaten; darfBearbeiten: boolean }) {
  const { laedt, aufruf, rueckmeldung } = useAktion();
  const fertig = daten.schritt >= daten.schritte.length;
  return (
    <div className="space-y-5" data-testid="testlauf">
      <section className={karte}>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          Demo-Testlauf <DemoMarke />
        </h2>
        <p className="text-xs text-muted">
          Ein kompletter Durchlauf mit erfundenen Daten: Briefing → Entwurf → Prüfung → Freigabe → simulierte Ausführung → Auswertung. Es wird nichts
          veröffentlicht, versendet, bezahlt oder per KI erzeugt. Jeder Schritt kann gefahrlos wiederholt werden, ohne Doppelungen.
        </p>
        <ol className="grid grid-cols-2 gap-1 sm:grid-cols-6">
          {daten.schritte.map((s, i) => (
            <li
              key={s}
              data-testid="testlauf-schritt"
              data-stand={i < daten.schritt ? "erledigt" : i === daten.schritt ? "naechster" : "offen"}
              className={`rounded-md border px-2 py-1 text-center text-xs ${i < daten.schritt ? "border-success/60 text-success" : i === daten.schritt ? "border-accent text-foreground" : "border-border text-muted"}`}
            >
              {i + 1}. {s}
            </li>
          ))}
        </ol>
        {darfBearbeiten && (
          <div className="flex flex-wrap gap-2">
            {!fertig && (
              <button type="button" className={knopfPrimaer} disabled={laedt} onClick={() => aufruf("/api/reichweitenaufbau/testlauf", "POST", { aktion: "weiter" })}>
                {daten.schritt === 0 ? "Testlauf starten (Briefing)" : `Weiter: ${daten.schritte[daten.schritt]}`}
              </button>
            )}
            {daten.schritt > 0 && (
              <>
                <button type="button" className={knopf} disabled={laedt} onClick={() => aufruf("/api/reichweitenaufbau/testlauf", "POST", { aktion: "neu" })}>
                  Neu starten
                </button>
                <button type="button" className={knopf} disabled={laedt} onClick={() => aufruf("/api/reichweitenaufbau/testlauf", "POST", { aktion: "entfernen" })}>
                  Testlauf entfernen
                </button>
              </>
            )}
          </div>
        )}
        {rueckmeldung}
      </section>

      {daten.kampagne && (
        <section className={karte}>
          <h3 className="text-sm font-semibold text-foreground">1. Briefing</h3>
          <div className="text-xs text-muted">
            {daten.kampagne.titel} · Ziel: {daten.kampagne.ziel} · Zielgruppe: {daten.kampagne.zielgruppe} · Zeitraum {datum(daten.kampagne.startAm)} – {datum(daten.kampagne.endeAm)} ·
            Zielseite {daten.kampagne.zielUrl}
          </div>
          <Link className="text-xs underline" href={`/reichweitenaufbau?tab=kampagnen&k=${daten.kampagne.id}`}>
            Kampagne im Bereich „Kampagnen“ öffnen
          </Link>
          <ul className="space-y-0.5 text-xs">
            {daten.ablauf.map((s) => (
              <li key={s.id} className={s.erledigtAm ? "text-success" : "text-muted"}>
                {s.erledigtAm ? "✓" : "○"} {s.titel} (fällig {datum(s.faelligAm)})
              </li>
            ))}
          </ul>
        </section>
      )}

      {daten.inhalte.length > 0 && (
        <section className={karte}>
          <h3 className="text-sm font-semibold text-foreground">2.–5. Entwürfe, Prüfung, Freigabe und simulierte Ausführung</h3>
          <ul className="space-y-1 text-sm">
            {daten.inhalte.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-2" data-testid="testlauf-inhalt">
                <Link className="underline" href={`/content-factory/${i.id}`}>{i.title}</Link>
                <Chip ton={i.status === "APPROVED" ? "gut" : "neutral"}>{STATUS[i.status] ?? i.status}</Chip>
                {i.simuliertAm && <Chip>simuliert ausgeführt {datum(i.simuliertAm)} – nicht gepostet</Chip>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {daten.ergebnis && (
        <section className={karte}>
          <h3 className="text-sm font-semibold text-foreground">6. Auswertung</h3>
          <ErgebnisTabelle ergebnis={daten.ergebnis} />
        </section>
      )}
    </div>
  );
}
