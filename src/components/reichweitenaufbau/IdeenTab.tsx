"use client";

import { useState } from "react";
import Link from "next/link";
import { AUFFORDERUNGEN, PLATTFORMEN, TONALITAETEN, type Briefing, type Vorschlag } from "@/lib/reichweitenaufbau/ideen";
import { stufeInhalt, STUFEN_LABEL } from "@/lib/reichweitenaufbau/status";
import { Chip, DemoMarke, datum, useAktion } from "@/components/reichweitenaufbau/gemeinsam";
import { feld, karte, knopf, knopfPrimaer } from "@/components/reichweitenaufbau/stil";

interface Inhalt {
  id: string;
  title: string;
  status: string;
  platform: string;
  format: string;
  publishedAt: string | null;
  updatedAt: string;
  _count: { analytics: number };
}

const LEER: Briefing = {
  zielgruppe: "",
  problem: "",
  ergebnis: "",
  plattform: "INSTAGRAM",
  format: "Kurzvideo",
  tonalitaet: "LOCKER_DU",
  material: "",
  aufforderung: "TEILEN",
  grundlageVorherNachher: "",
};

export function IdeenTab({ kampagnen, inhalte, darfBearbeiten }: { kampagnen: { id: string; titel: string; istDemo: boolean }[]; inhalte: Inhalt[]; darfBearbeiten: boolean }) {
  const [b, setB] = useState<Briefing>(LEER);
  const [kampagneId, setKampagneId] = useState("");
  const [vorschlaege, setVorschlaege] = useState<Vorschlag[] | null>(null);
  const [uebernommen, setUebernommen] = useState<Record<string, string>>({});
  const { laedt, aufruf, rueckmeldung, setMeldung } = useAktion();
  const set = <K extends keyof Briefing>(k: K, v: Briefing[K]) => setB((alt) => ({ ...alt, [k]: v }));

  async function erzeugen(e: React.FormEvent) {
    e.preventDefault();
    const r = await aufruf<{ vorschlaege: Vorschlag[] }>("/api/reichweitenaufbau/ideen/vorschlaege", "POST", b);
    if (r) {
      setVorschlaege(r.vorschlaege);
      setUebernommen({});
    }
  }

  async function uebernehmen(v: Vorschlag, titel: string) {
    const r = await aufruf<{ item: { id: string }; warnung: string[] }>("/api/reichweitenaufbau/ideen/uebernehmen", "POST", {
      art: v.art,
      plattform: b.plattform,
      format: b.format,
      titel,
      einstieg: v.einstieg,
      text: v.text,
      bildVideoIdee: v.bildVideoIdee,
      beschreibung: v.beschreibung,
      aufforderung: v.aufforderung,
      grundlage: v.art === "VORHER_NACHHER" ? b.grundlageVorherNachher : "",
      kampagneId: kampagneId || null,
    });
    if (r) {
      setUebernommen((u) => ({ ...u, [v.art]: r.item.id }));
      setMeldung(
        `Als Entwurf in die Content Factory übernommen – noch nicht freigegeben.${r.warnung.length ? ` Achtung, Erfolgsversprechen im Text: ${r.warnung.join(", ")}.` : ""}`
      );
    }
  }

  return (
    <div className="space-y-5">
      <section className={karte}>
        <h2 className="text-sm font-semibold text-foreground">Inhalte zum Weiterempfehlen – Briefing</h2>
        <form onSubmit={erzeugen} className="grid gap-2 sm:grid-cols-2">
          <label className="space-y-1 text-xs text-muted">
            Zielgruppe
            <input className={feld} required maxLength={200} value={b.zielgruppe} onChange={(e) => set("zielgruppe", e.target.value)} placeholder="z. B. Selbstständige im Handwerk" />
          </label>
          <label className="space-y-1 text-xs text-muted">
            Thema oder konkretes Problem
            <input className={feld} required maxLength={300} value={b.problem} onChange={(e) => set("problem", e.target.value)} placeholder="z. B. keine Zeit für Social Media" />
          </label>
          <label className="space-y-1 text-xs text-muted">
            Gewünschtes Ergebnis
            <input className={feld} required maxLength={300} value={b.ergebnis} onChange={(e) => set("ergebnis", e.target.value)} placeholder="z. B. regelmäßig posten mit 1 Stunde pro Woche" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1 text-xs text-muted">
              Plattform
              <select className={feld} value={b.plattform} onChange={(e) => set("plattform", e.target.value as Briefing["plattform"])}>
                {PLATTFORMEN.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs text-muted">
              Format
              <input className={feld} maxLength={80} value={b.format} onChange={(e) => set("format", e.target.value)} />
            </label>
          </div>
          <label className="space-y-1 text-xs text-muted">
            Tonalität
            <select className={feld} value={b.tonalitaet} onChange={(e) => set("tonalitaet", e.target.value as Briefing["tonalitaet"])}>
              {Object.entries(TONALITAETEN).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs text-muted">
            Handlungsaufforderung
            <select className={feld} value={b.aufforderung} onChange={(e) => set("aufforderung", e.target.value as Briefing["aufforderung"])}>
              {Object.entries(AUFFORDERUNGEN).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs text-muted sm:col-span-2">
            Vorhandene Bilder, Videos oder Texte
            <textarea className={feld} rows={2} maxLength={500} value={b.material} onChange={(e) => set("material", e.target.value)} placeholder="z. B. 3 Fotos aus der Werkstatt, Kundenfragen aus dem Posteingang" />
          </label>
          <label className="space-y-1 text-xs text-muted sm:col-span-2">
            Grundlage für Vorher-nachher (nur mit echtem, belegbarem Fall)
            <input
              className={feld}
              maxLength={500}
              value={b.grundlageVorherNachher}
              onChange={(e) => set("grundlageVorherNachher", e.target.value)}
              placeholder="leer lassen, wenn es keinen echten Fall mit Aufnahmen gibt"
            />
          </label>
          <label className="space-y-1 text-xs text-muted">
            Kampagne (optional)
            <select className={feld} value={kampagneId} onChange={(e) => setKampagneId(e.target.value)}>
              <option value="">Keine</option>
              {kampagnen.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.titel}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button type="submit" className={knopfPrimaer} disabled={laedt}>
              Vorschläge erstellen
            </button>
          </div>
        </form>
        <p className="text-[11px] text-muted">
          Es entstehen Vorlagen mit Platzhaltern in [ ] – keine erfundenen Ergebnisse, Referenzen oder Garantien. Übernommene Vorschläge landen als Entwurf in der Content Factory und
          durchlaufen dort Prüfung und Freigabe.
        </p>
      </section>

      {rueckmeldung}

      {vorschlaege && (
        <section className="grid gap-3 lg:grid-cols-2" data-testid="vorschlaege">
          {vorschlaege.map((v) => (
            <VorschlagKarte
              key={v.art}
              v={v}
              darfBearbeiten={darfBearbeiten}
              laedt={laedt}
              uebernommenId={uebernommen[v.art] ?? null}
              onUebernehmen={(titel) => uebernehmen(v, titel)}
            />
          ))}
        </section>
      )}

      <section className={karte}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Übernommene Inhalte</h2>
          <Link href="/content-factory" className="text-xs text-accent-2 underline">
            Zur Freigabe in der Content Factory
          </Link>
        </div>
        {inhalte.length === 0 ? (
          <p className="text-xs text-muted">Noch keine.</p>
        ) : (
          <ul className="space-y-1.5">
            {inhalte.map((i) => {
              const s = stufeInhalt(i.status, i._count.analytics > 0);
              return (
                <li key={i.id} className="flex flex-wrap items-center gap-2 rounded-md border border-border px-2 py-1.5 text-xs">
                  <span className="text-foreground">{i.title}</span>
                  {i.format.startsWith("DEMO") && <DemoMarke />}
                  <Chip ton={s === "UMGESETZT" || s === "AUSGEWERTET" ? "gut" : "neutral"}>{s ? STUFEN_LABEL[s] : i.status}</Chip>
                  <span className="text-muted">
                    {i.platform} · geändert {datum(i.updatedAt)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function VorschlagKarte({
  v,
  darfBearbeiten,
  laedt,
  uebernommenId,
  onUebernehmen,
}: {
  v: Vorschlag;
  darfBearbeiten: boolean;
  laedt: boolean;
  uebernommenId: string | null;
  onUebernehmen: (titel: string) => void;
}) {
  const [titel, setTitel] = useState(v.einstieg.slice(0, 120));
  return (
    <article className="card space-y-2 p-4 text-sm" data-testid={`vorschlag-${v.art}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-foreground">{v.label}</h3>
        <Chip>Vorlage</Chip>
      </div>
      {v.gesperrt ? (
        <p className="rounded-md border border-warning/50 bg-warning/10 px-2 py-1.5 text-xs text-warning">{v.gesperrt}</p>
      ) : (
        <>
          <dl className="space-y-1.5 text-xs">
            <div>
              <dt className="text-muted">Einstieg</dt>
              <dd className="text-foreground">{v.einstieg}</dd>
            </div>
            <div>
              <dt className="text-muted">Skript / Beitragstext</dt>
              <dd className="whitespace-pre-line text-foreground">{v.text}</dd>
            </div>
            <div>
              <dt className="text-muted">Bild-/Videoidee</dt>
              <dd className="text-foreground">{v.bildVideoIdee}</dd>
            </div>
            <div>
              <dt className="text-muted">Beschreibung</dt>
              <dd className="text-foreground">{v.beschreibung}</dd>
            </div>
            <div>
              <dt className="text-muted">Aufforderung</dt>
              <dd className="text-foreground">{v.aufforderung}</dd>
            </div>
          </dl>
          <ul className="list-disc space-y-0.5 pl-4 text-[11px] text-muted">
            {v.hinweise.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
          {darfBearbeiten &&
            (uebernommenId ? (
              <p className="text-xs text-success">Als Entwurf übernommen – wartet auf Prüfung und Freigabe.</p>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                <input className={feld} value={titel} maxLength={160} onChange={(e) => setTitel(e.target.value)} aria-label="Titel für die Content Factory" />
                <button type="button" className={knopf} disabled={laedt || !titel.trim()} onClick={() => onUebernehmen(titel)}>
                  Als Entwurf übernehmen
                </button>
              </div>
            ))}
        </>
      )}
    </article>
  );
}
