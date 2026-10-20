"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HAUPTKENNZAHLEN, SCHRITT_ARTEN, kampagneFehlt } from "@/lib/reichweitenaufbau/kampagnenplan";
import { FORMAT_PLATTFORMEN, UNGEPRUEFT, type Fakt, type FormatPlattform, type FormatVariante } from "@/lib/reichweitenaufbau/plattformformate";
import { usdBetrag } from "@/lib/ai/kosten";
import { Chip, DemoMarke, datum, tagInput, useAktion } from "@/components/reichweitenaufbau/gemeinsam";
import { feld, karte, knopf, knopfPrimaer } from "@/components/reichweitenaufbau/stil";

export interface KSchritt {
  id: string;
  reihenfolge: number;
  art: string;
  titel: string;
  notiz: string;
  faelligAm: string | null;
  erledigtAm: string | null;
}
export interface KKampagne {
  id: string;
  titel: string;
  istDemo: boolean;
  ziel: string;
  hauptkennzahl: string;
  zielgruppe: string;
  zielUrl: string;
  startAm: string | null;
  endeAm: string | null;
  verantwortlichId: string | null;
  budgetCent: number | null;
  schritte: KSchritt[];
}
export interface KInhalt {
  id: string;
  title: string;
  platform: string;
  status: string;
  hook: string;
  caption: string;
  faktenJson: string;
  simuliertAm: string | null;
  reichweitenKampagneId: string | null;
}
export interface KLink {
  id: string;
  code: string;
  bezeichnung: string;
  herkunft: string;
  stufe: number;
  angebotUrl: string;
  widerrufenAm: string | null;
  kampagneId: string;
}
export interface KErgebnis {
  hauptkennzahl: { label: string; wert: number | null; istDemo: boolean } | null;
  zuordnung: {
    zeilen: { schluessel: string; link: string; herkunft: string; angebotsseite: string; aufrufe: number; zielKlicks: number; anfragen: number; neueLinks: number }[];
    jeAngebotsseite: { angebotsseite: string; aufrufe: number; zielKlicks: number; anfragen: number }[];
  };
}
type Person = { id: string; name: string | null; email: string };

const STATUS: Record<string, string> = { DRAFT: "Entwurf", IN_REVIEW: "In Prüfung", APPROVED: "Freigegeben", SCHEDULED: "Geplant", PUBLISHED: "Veröffentlicht", REJECTED: "Abgelehnt", ARCHIVED: "Archiviert" };
const name = (p?: Person) => (p ? p.name || p.email : "—");
const euro = (cent: number) => (cent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
const neueKennung = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

interface PlanFelder {
  titel: string;
  ziel: string;
  hauptkennzahl: string;
  zielgruppe: string;
  zielUrl: string;
  startAm: string;
  endeAm: string;
  verantwortlichId: string;
  mitBudget: boolean;
  budgetEuro: string;
}

function PlanFormular({ wert, setWert, freigeber, darfBudget }: { wert: PlanFelder; setWert: (w: PlanFelder) => void; freigeber: Person[]; darfBudget: boolean }) {
  const set = <K extends keyof PlanFelder>(k: K, v: PlanFelder[K]) => setWert({ ...wert, [k]: v });
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="space-y-1 text-xs text-muted">
        Titel
        <input className={feld} required maxLength={120} value={wert.titel} onChange={(e) => set("titel", e.target.value)} placeholder="z. B. Herbstaktion Kurs" />
      </label>
      <label className="space-y-1 text-xs text-muted">
        Konkretes Ziel
        <input className={feld} required maxLength={300} value={wert.ziel} onChange={(e) => set("ziel", e.target.value)} placeholder="z. B. 20 Anfragen bis Ende November" />
      </label>
      <label className="space-y-1 text-xs text-muted">
        Hauptkennzahl
        <select className={feld} value={wert.hauptkennzahl} onChange={(e) => set("hauptkennzahl", e.target.value)}>
          {Object.entries(HAUPTKENNZAHLEN).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-xs text-muted">
        Zielgruppe
        <input className={feld} required maxLength={300} value={wert.zielgruppe} onChange={(e) => set("zielgruppe", e.target.value)} placeholder="z. B. Selbstständige im Handwerk" />
      </label>
      <label className="space-y-1 text-xs text-muted sm:col-span-2">
        Passende Zielseite (Angebotsseite)
        <input className={feld} required type="url" maxLength={500} value={wert.zielUrl} onChange={(e) => set("zielUrl", e.target.value)} placeholder="https://…" />
      </label>
      <label className="space-y-1 text-xs text-muted">
        Start
        <input className={feld} required type="date" value={wert.startAm} onChange={(e) => set("startAm", e.target.value)} />
      </label>
      <label className="space-y-1 text-xs text-muted">
        Ende
        <input className={feld} required type="date" value={wert.endeAm} onChange={(e) => set("endeAm", e.target.value)} />
      </label>
      <label className="space-y-1 text-xs text-muted">
        Verantwortlich für Freigaben
        <select className={feld} required value={wert.verantwortlichId} onChange={(e) => set("verantwortlichId", e.target.value)}>
          <option value="">– bitte wählen –</option>
          {freigeber.map((p) => (
            <option key={p.id} value={p.id}>
              {name(p)}
            </option>
          ))}
        </select>
      </label>
      <div className="space-y-1 text-xs text-muted">
        Budget
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1">
            <input type="checkbox" disabled={!darfBudget} checked={wert.mitBudget} onChange={(e) => set("mitBudget", e.target.checked)} /> ausdrücklich festlegen
          </label>
          {wert.mitBudget && (
            <input className={`${feld} w-32`} type="number" min="1" step="0.01" value={wert.budgetEuro} onChange={(e) => set("budgetEuro", e.target.value)} placeholder="€" aria-label="Budget in Euro" />
          )}
        </div>
        {!darfBudget && <p>Ein Budget legen nur Inhaber und Admins fest. Ohne Budget ist keine Werbung für diese Kampagne möglich.</p>}
      </div>
    </div>
  );
}

function planDaten(w: PlanFelder) {
  const budgetCent = w.mitBudget ? Math.round(Number(w.budgetEuro.replace(",", ".")) * 100) : null;
  return {
    titel: w.titel,
    ziel: w.ziel,
    hauptkennzahl: w.hauptkennzahl,
    zielgruppe: w.zielgruppe,
    zielUrl: w.zielUrl,
    startAm: w.startAm,
    endeAm: w.endeAm,
    verantwortlichId: w.verantwortlichId,
    budgetCent: budgetCent && budgetCent > 0 ? budgetCent : null,
  };
}

const LEERER_PLAN: PlanFelder = { titel: "", ziel: "", hauptkennzahl: "ANFRAGEN", zielgruppe: "", zielUrl: "", startAm: "", endeAm: "", verantwortlichId: "", mitBudget: false, budgetEuro: "" };

function Assistent({ freigeber, darfBudget, ichId }: { freigeber: Person[]; darfBudget: boolean; ichId: string }) {
  const [plan, setPlan] = useState<PlanFelder>({ ...LEERER_PLAN, verantwortlichId: freigeber.some((p) => p.id === ichId) ? ichId : "" });
  const [kennung, setKennung] = useState(neueKennung);
  const router = useRouter();
  const { laedt, aufruf, rueckmeldung, setMeldung } = useAktion();
  async function anlegen(e: React.FormEvent) {
    e.preventDefault();
    const r = await aufruf<{ kampagne: { id: string }; neu: boolean }>("/api/reichweitenaufbau/kampagnen", "POST", { ...planDaten(plan), erstellKennung: kennung });
    if (r) {
      setMeldung(r.neu ? "Kampagne mit Ablauf angelegt. Sie ist unten ausgewählt." : "Diese Kampagne wurde bereits angelegt (kein Duplikat).");
      setKennung(neueKennung());
      setPlan({ ...LEERER_PLAN, verantwortlichId: plan.verantwortlichId });
      router.push(`/reichweitenaufbau?tab=kampagnen&k=${r.kampagne.id}`);
    }
  }
  return (
    <section className={karte} data-testid="kampagnenassistent">
      <h2 className="text-sm font-semibold text-foreground">Kampagnenassistent</h2>
      <p className="text-xs text-muted">
        Aus Ziel, Hauptkennzahl, Zielgruppe, Zielseite, Zeitraum und verantwortlicher Person entsteht ein Ablauf, den du danach frei bearbeitest. Es wird nichts
        veröffentlicht, versendet oder bezahlt.
      </p>
      <form onSubmit={anlegen} className="space-y-3">
        <PlanFormular wert={plan} setWert={setPlan} freigeber={freigeber} darfBudget={darfBudget} />
        <button type="submit" className={knopfPrimaer} disabled={laedt}>
          Kampagne mit Ablauf anlegen
        </button>
      </form>
      {rueckmeldung}
    </section>
  );
}

function PlanBearbeiten({ k, freigeber, darfBudget }: { k: KKampagne; freigeber: Person[]; darfBudget: boolean }) {
  const [offen, setOffen] = useState(false);
  const [plan, setPlan] = useState<PlanFelder>({
    titel: k.titel,
    ziel: k.ziel,
    hauptkennzahl: k.hauptkennzahl || "ANFRAGEN",
    zielgruppe: k.zielgruppe,
    zielUrl: k.zielUrl,
    startAm: tagInput(k.startAm),
    endeAm: tagInput(k.endeAm),
    verantwortlichId: k.verantwortlichId ?? "",
    mitBudget: k.budgetCent !== null,
    budgetEuro: k.budgetCent !== null ? String(k.budgetCent / 100) : "",
  });
  const { laedt, aufruf, rueckmeldung, setMeldung } = useAktion();
  async function speichern(e: React.FormEvent) {
    e.preventDefault();
    const d: Record<string, unknown> = planDaten(plan);
    if (!d.verantwortlichId) delete d.verantwortlichId;
    if (!darfBudget) delete d.budgetCent;
    if (await aufruf(`/api/reichweitenaufbau/kampagnen/${k.id}`, "PATCH", d)) setMeldung("Gespeichert.");
  }
  const fehlt = kampagneFehlt(k);
  return (
    <div className="space-y-2">
      <dl className="grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
        <div><dt className="inline text-muted">Ziel: </dt><dd className="inline text-foreground">{k.ziel || "—"}</dd></div>
        <div><dt className="inline text-muted">Hauptkennzahl: </dt><dd className="inline text-foreground">{HAUPTKENNZAHLEN[k.hauptkennzahl as keyof typeof HAUPTKENNZAHLEN]?.label ?? "—"}</dd></div>
        <div><dt className="inline text-muted">Zielgruppe: </dt><dd className="inline text-foreground">{k.zielgruppe || "—"}</dd></div>
        <div><dt className="inline text-muted">Zielseite: </dt><dd className="inline break-all text-foreground">{k.zielUrl || "—"}</dd></div>
        <div><dt className="inline text-muted">Zeitraum: </dt><dd className="inline text-foreground">{datum(k.startAm)} – {datum(k.endeAm)}</dd></div>
        <div><dt className="inline text-muted">Freigabe durch: </dt><dd className="inline text-foreground">{name(freigeber.find((p) => p.id === k.verantwortlichId))}</dd></div>
        <div><dt className="inline text-muted">Budget: </dt><dd className="inline text-foreground">{k.budgetCent !== null ? euro(k.budgetCent) : "kein Budget festgelegt (keine Werbung)"}</dd></div>
      </dl>
      {fehlt.length > 0 && <p className="text-xs text-warning">Es fehlen: {fehlt.join(", ")}.</p>}
      <button type="button" className={knopf} onClick={() => setOffen(!offen)}>
        {offen ? "Bearbeiten schließen" : "Angaben bearbeiten"}
      </button>
      {offen && (
        <form onSubmit={speichern} className="space-y-2">
          <PlanFormular wert={plan} setWert={setPlan} freigeber={freigeber} darfBudget={darfBudget} />
          <button type="submit" className={knopfPrimaer} disabled={laedt}>
            Speichern
          </button>
        </form>
      )}
      {rueckmeldung}
    </div>
  );
}

function SchrittZeile({ s, erster, letzter, darfBearbeiten }: { s: KSchritt; erster: boolean; letzter: boolean; darfBearbeiten: boolean }) {
  const [bearbeiten, setBearbeiten] = useState(false);
  const [titel, setTitel] = useState(s.titel);
  const [notiz, setNotiz] = useState(s.notiz);
  const [faellig, setFaellig] = useState(tagInput(s.faelligAm));
  const { laedt, aufruf, rueckmeldung } = useAktion();
  const url = `/api/reichweitenaufbau/schritte/${s.id}`;
  return (
    <li className="rounded-lg border border-border p-2" data-testid="ablauf-schritt">
      <div className="flex flex-wrap items-start gap-2">
        <input
          type="checkbox"
          aria-label="erledigt"
          disabled={!darfBearbeiten || laedt}
          checked={!!s.erledigtAm}
          onChange={(e) => aufruf(url, "PATCH", { erledigt: e.target.checked })}
          className="mt-1"
        />
        <div className="min-w-0 flex-1">
          <div className={`text-sm ${s.erledigtAm ? "text-muted line-through" : "text-foreground"}`}>{s.titel}</div>
          <div className="text-xs text-muted">
            {SCHRITT_ARTEN[s.art as keyof typeof SCHRITT_ARTEN] ?? s.art} · fällig {datum(s.faelligAm)}
            {s.notiz && ` · ${s.notiz}`}
          </div>
        </div>
        {darfBearbeiten && (
          <div className="flex gap-1">
            <button type="button" className={knopf} disabled={laedt || erster} onClick={() => aufruf(url, "PATCH", { verschieben: "hoch" })} aria-label="nach oben">↑</button>
            <button type="button" className={knopf} disabled={laedt || letzter} onClick={() => aufruf(url, "PATCH", { verschieben: "runter" })} aria-label="nach unten">↓</button>
            <button type="button" className={knopf} onClick={() => setBearbeiten(!bearbeiten)}>Bearbeiten</button>
            <button type="button" className={knopf} disabled={laedt} onClick={() => confirm("Schritt löschen?") && aufruf(url, "DELETE")}>Löschen</button>
          </div>
        )}
      </div>
      {bearbeiten && (
        <form
          className="mt-2 grid gap-2 sm:grid-cols-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await aufruf(url, "PATCH", { titel, notiz, faelligAm: faellig || null })) setBearbeiten(false);
          }}
        >
          <input className={feld} required maxLength={200} value={titel} onChange={(e) => setTitel(e.target.value)} aria-label="Titel" />
          <input className={feld} maxLength={1000} value={notiz} onChange={(e) => setNotiz(e.target.value)} aria-label="Notiz" placeholder="Notiz" />
          <div className="flex gap-2">
            <input className={feld} type="date" value={faellig} onChange={(e) => setFaellig(e.target.value)} aria-label="fällig am" />
            <button type="submit" className={knopfPrimaer} disabled={laedt}>OK</button>
          </div>
        </form>
      )}
      {rueckmeldung}
    </li>
  );
}

function Ablauf({ k, darfBearbeiten }: { k: KKampagne; darfBearbeiten: boolean }) {
  const [titel, setTitel] = useState("");
  const [art, setArt] = useState("SONSTIGES");
  const { laedt, aufruf, rueckmeldung } = useAktion();
  const schritte = [...k.schritte].sort((a, b) => a.reihenfolge - b.reihenfolge);
  return (
    <div className="space-y-2">
      <ol className="space-y-2">
        {schritte.map((s, i) => (
          <SchrittZeile key={s.id} s={s} erster={i === 0} letzter={i === schritte.length - 1} darfBearbeiten={darfBearbeiten} />
        ))}
      </ol>
      {darfBearbeiten && (
        <form
          className="flex flex-wrap gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await aufruf(`/api/reichweitenaufbau/kampagnen/${k.id}/schritte`, "POST", { titel, art })) setTitel("");
          }}
        >
          <input className={`${feld} flex-1`} required maxLength={200} value={titel} onChange={(e) => setTitel(e.target.value)} placeholder="Neuer Schritt" aria-label="Neuer Schritt" />
          <select className={`${feld} w-40`} value={art} onChange={(e) => setArt(e.target.value)} aria-label="Art">
            {Object.entries(SCHRITT_ARTEN).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <button type="submit" className={knopf} disabled={laedt}>Hinzufügen</button>
        </form>
      )}
      {rueckmeldung}
    </div>
  );
}

interface Schaetzung {
  schaetzung: { anbieter: string; modell: string; berechenbar: boolean; eingabeToken: number; ausgabeTokenMax: number; usdMax: number | null; hinweis: string };
  limits?: { aufrufeMonat: number | null; kostenMonatUsd: number | null };
  verbrauch?: { aufrufe: number; kostenUsd: number; ohnePreis: number };
}

function VarianteKarte({ v, kampagneId, darfBearbeiten, onText }: { v: FormatVariante; kampagneId: string; darfBearbeiten: boolean; onText: (t: string) => void }) {
  const [schaetzung, setSchaetzung] = useState<Schaetzung | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);
  const { laedt, aufruf, rueckmeldung, setMeldung } = useAktion();
  const p = FORMAT_PLATTFORMEN[v.plattform];
  async function kiSchaetzen() {
    const r = await aufruf<Schaetzung>(`/api/reichweitenaufbau/kampagnen/${kampagneId}/formate/ki`, "POST", { text: v.text, fakten: v.fakten });
    if (r) setSchaetzung(r);
  }
  async function kiAusfuehren() {
    const r = await aufruf<{ ok: boolean; text?: string; fehler?: string }>(`/api/reichweitenaufbau/kampagnen/${kampagneId}/formate/ki`, "POST", { text: v.text, fakten: v.fakten, bestaetigt: true });
    setSchaetzung(null);
    if (r?.ok && r.text) {
      onText(r.text);
      setMeldung("Text überarbeitet. Fakten und Markierungen wurden geprüft und sind unverändert.");
    } else if (r) setMeldung(r.fehler ?? "Ergebnis verworfen.");
  }
  async function uebernehmen() {
    const r = await aufruf<{ item: { id: string }; neu: boolean }>(`/api/reichweitenaufbau/kampagnen/${kampagneId}/formate`, "POST", { aktion: "uebernehmen", variante: v });
    if (r) {
      setItemId(r.item.id);
      setMeldung(r.neu ? "Als eigener Entwurf übernommen – noch nicht freigegeben." : "Diese Variante ist bereits als Entwurf vorhanden (kein Duplikat).");
    }
  }
  return (
    <article className="space-y-2 rounded-lg border border-border p-3" data-testid="format-variante">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-foreground">{p.name}</h4>
        <span className="text-xs text-muted">{v.format}</span>
      </div>
      <div className="text-xs text-muted">Vorschau</div>
      <div className="max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-surface-2 p-3 text-sm text-foreground">{v.text}</div>
      {v.videoablauf.length > 0 && (
        <details className="text-xs text-muted">
          <summary>Videoablauf</summary>
          <ol className="mt-1 list-decimal pl-5">{v.videoablauf.map((z, i) => <li key={i}>{z}</li>)}</ol>
        </details>
      )}
      <div className="flex flex-wrap gap-1">
        <Chip ton={v.zeichen > v.limit ? "schlecht" : "neutral"}>{v.zeichen} / {v.limit} Zeichen</Chip>
        {v.ungeprueft > 0 ? <Chip ton="warn">{v.ungeprueft} ungeprüfte Aussage(n) – Freigabe gesperrt</Chip> : <Chip ton="gut">alle Fakten geprüft</Chip>}
      </div>
      {v.hinweise.length > 0 && <ul className="list-disc pl-5 text-xs text-warning">{v.hinweise.map((h, i) => <li key={i}>{h}</li>)}</ul>}
      {darfBearbeiten && (
        <div className="flex flex-wrap gap-2">
          <button type="button" className={knopfPrimaer} disabled={laedt || !!itemId} onClick={uebernehmen}>
            {itemId ? "Übernommen" : "Als Entwurf übernehmen"}
          </button>
          <button type="button" className={knopf} disabled={laedt} onClick={kiSchaetzen}>
            Sprachlich glätten (KI, kostenpflichtig)…
          </button>
          {itemId && <Link className={knopf} href={`/content-factory/${itemId}`}>Entwurf öffnen</Link>}
        </div>
      )}
      {schaetzung && (
        <div className="space-y-2 rounded-lg border border-warning/50 bg-warning/10 p-3 text-xs text-foreground" data-testid="ki-schaetzung">
          <div>
            <strong>Kostenschätzung vorab:</strong>{" "}
            {schaetzung.schaetzung.berechenbar && schaetzung.schaetzung.usdMax !== null
              ? `höchstens ca. ${usdBetrag(schaetzung.schaetzung.usdMax)} (${schaetzung.schaetzung.modell}, ~${schaetzung.schaetzung.eingabeToken} Eingabe-Token, max. ${schaetzung.schaetzung.ausgabeTokenMax} Ausgabe-Token)`
              : `nicht berechenbar für ${schaetzung.schaetzung.modell} – Kosten offen.`}
          </div>
          <div className="text-muted">{schaetzung.schaetzung.hinweis}</div>
          {schaetzung.verbrauch && (
            <div className="text-muted">
              Verbrauch diesen Monat: {schaetzung.verbrauch.aufrufe} Aufrufe, ca. {usdBetrag(schaetzung.verbrauch.kostenUsd)}
              {schaetzung.verbrauch.ohnePreis > 0 && `, ${schaetzung.verbrauch.ohnePreis} ohne bekannten Preis`}. Limits:{" "}
              {schaetzung.limits?.aufrufeMonat ?? "keins"} Aufrufe / {schaetzung.limits?.kostenMonatUsd != null ? usdBetrag(schaetzung.limits.kostenMonatUsd) : "keins"} pro Monat.
            </div>
          )}
          <div className="flex gap-2">
            <button type="button" className={knopfPrimaer} disabled={laedt} onClick={kiAusfuehren}>Kostenpflichtig ausführen</button>
            <button type="button" className={knopf} onClick={() => setSchaetzung(null)}>Abbrechen</button>
          </div>
        </div>
      )}
      {rueckmeldung}
    </article>
  );
}

function Plattformformate({ k, darfBearbeiten }: { k: KKampagne; darfBearbeiten: boolean }) {
  const [thema, setThema] = useState("");
  const [kernaussage, setKernaussage] = useState("");
  const [aufforderung, setAufforderung] = useState("");
  const [plattformen, setPlattformen] = useState<FormatPlattform[]>(["INSTAGRAM", "LINKEDIN"]);
  const [fakten, setFakten] = useState<Fakt[]>([{ text: "", quelle: "", geprueft: false }]);
  const [varianten, setVarianten] = useState<FormatVariante[] | null>(null);
  const { laedt, aufruf, rueckmeldung } = useAktion();
  const setFakt = (i: number, f: Partial<Fakt>) => setFakten((alt) => alt.map((x, j) => (j === i ? { ...x, ...f } : x)));
  async function vorschau(e: React.FormEvent) {
    e.preventDefault();
    const r = await aufruf<{ varianten: FormatVariante[] }>(`/api/reichweitenaufbau/kampagnen/${k.id}/formate`, "POST", {
      aktion: "vorschau",
      eingabe: { thema, kernaussage, aufforderung, zielUrl: k.zielUrl, zielgruppe: k.zielgruppe, plattformen, fakten: fakten.filter((f) => f.text.trim()) },
    });
    if (r) setVarianten(r.varianten);
  }
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">
        Aus einem Thema entstehen Varianten je Plattform – regelbasiert, ohne KI und ohne Kosten. Fakten werden wortgleich mit Quelle übernommen; nicht geprüfte
        Aussagen erhalten die Markierung {UNGEPRUEFT} und sperren die Freigabe.
      </p>
      <form onSubmit={vorschau} className="space-y-2">
        <div className="grid gap-2 sm:grid-cols-2">
          <input className={feld} required maxLength={200} value={thema} onChange={(e) => setThema(e.target.value)} placeholder="Thema" aria-label="Thema" />
          <input className={feld} maxLength={200} value={aufforderung} onChange={(e) => setAufforderung(e.target.value)} placeholder="Aufforderung (z. B. Jetzt anfragen)" aria-label="Aufforderung" />
          <textarea className={`${feld} sm:col-span-2`} required maxLength={400} rows={2} value={kernaussage} onChange={(e) => setKernaussage(e.target.value)} placeholder="Kernaussage" aria-label="Kernaussage" />
        </div>
        <fieldset className="flex flex-wrap gap-3 text-xs text-muted">
          <legend className="mb-1">Plattformen</legend>
          {(Object.keys(FORMAT_PLATTFORMEN) as FormatPlattform[]).map((p) => (
            <label key={p} className="flex items-center gap-1">
              <input type="checkbox" checked={plattformen.includes(p)} onChange={(e) => setPlattformen((a) => (e.target.checked ? [...a, p] : a.filter((x) => x !== p)))} />
              {FORMAT_PLATTFORMEN[p].name}
            </label>
          ))}
        </fieldset>
        <div className="space-y-2">
          <div className="text-xs text-muted">Fakten mit Quelle</div>
          {fakten.map((f, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[2fr_1.5fr_auto_auto]">
              <input className={feld} maxLength={500} value={f.text} onChange={(e) => setFakt(i, { text: e.target.value })} placeholder="Aussage" aria-label={`Fakt ${i + 1}`} />
              <input className={feld} maxLength={300} value={f.quelle} onChange={(e) => setFakt(i, { quelle: e.target.value })} placeholder="Quelle (Link oder Dokument)" aria-label={`Quelle ${i + 1}`} />
              <label className="flex items-center gap-1 text-xs text-muted">
                <input type="checkbox" checked={f.geprueft} onChange={(e) => setFakt(i, { geprueft: e.target.checked })} /> geprüft
              </label>
              <button type="button" className={knopf} onClick={() => setFakten((a) => a.filter((_, j) => j !== i))}>Entfernen</button>
            </div>
          ))}
          {fakten.length < 10 && (
            <button type="button" className={knopf} onClick={() => setFakten((a) => [...a, { text: "", quelle: "", geprueft: false }])}>Fakt hinzufügen</button>
          )}
        </div>
        <button type="submit" className={knopfPrimaer} disabled={laedt}>Vorschau je Plattform erstellen</button>
      </form>
      {rueckmeldung}
      {varianten && (
        <div className="grid gap-3 lg:grid-cols-2">
          {varianten.map((v, i) => (
            <VarianteKarte
              key={`${v.plattform}-${i}`}
              v={v}
              kampagneId={k.id}
              darfBearbeiten={darfBearbeiten}
              onText={(t) => setVarianten((a) => a!.map((x, j) => (j === i ? { ...x, text: t, zeichen: t.length } : x)))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InhaltZeile({ i, darfBearbeiten }: { i: KInhalt; darfBearbeiten: boolean }) {
  const { laedt, aufruf, rueckmeldung } = useAktion();
  const status = (action: string) => aufruf(`/api/content-items/${i.id}/status`, "POST", { action });
  const fakten = (() => {
    try {
      return JSON.parse(i.faktenJson) as Fakt[];
    } catch {
      return [];
    }
  })();
  const ungeprueft = `${i.hook}\n${i.caption}`.includes(UNGEPRUEFT);
  return (
    <li className="space-y-1 rounded-lg border border-border p-2" data-testid="kampagnen-inhalt">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-foreground">{i.title}</span>
        <Chip ton={i.status === "APPROVED" ? "gut" : "neutral"}>{STATUS[i.status] ?? i.status}</Chip>
        {ungeprueft && <Chip ton="warn">ungeprüfte Aussagen</Chip>}
        {i.simuliertAm && <Chip>simuliert ausgeführt</Chip>}
      </div>
      {fakten.length > 0 && <div className="text-xs text-muted">Quellen: {fakten.map((f, n) => `[${n + 1}] ${f.quelle || "keine"}${f.geprueft ? "" : " (ungeprüft)"}`).join(" · ")}</div>}
      <div className="flex flex-wrap gap-2">
        <Link className={knopf} href={`/content-factory/${i.id}`}>Vorschau öffnen</Link>
        {darfBearbeiten && i.status === "DRAFT" && <button type="button" className={knopf} disabled={laedt} onClick={() => status("review")}>Zur Prüfung</button>}
        {darfBearbeiten && i.status === "IN_REVIEW" && (
          <>
            <button type="button" className={knopfPrimaer} disabled={laedt} onClick={() => status("approve")}>Freigeben</button>
            <button type="button" className={knopf} disabled={laedt} onClick={() => status("reject")}>Ablehnen</button>
          </>
        )}
      </div>
      {rueckmeldung}
    </li>
  );
}

function LinkZeile({ l, origin, darfBearbeiten }: { l: KLink; origin: string; darfBearbeiten: boolean }) {
  const [angebot, setAngebot] = useState(l.angebotUrl);
  const { laedt, aufruf, rueckmeldung, setMeldung } = useAktion();
  return (
    <li className="space-y-1 rounded-lg border border-border p-2 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-foreground">{l.herkunft === "BESUCHER" ? `Weitergegeben (Stufe ${l.stufe})` : l.bezeichnung || "Team-Link"}</span>
        <code className="break-all text-muted">{origin}/e/{l.code}</code>
        {l.widerrufenAm && <Chip ton="schlecht">widerrufen</Chip>}
      </div>
      {l.herkunft === "TEAM" && darfBearbeiten ? (
        <form
          className="flex flex-wrap gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await aufruf(`/api/reichweite/links/${l.id}`, "PATCH", { angebotUrl: angebot })) setMeldung("Angebotsseite gespeichert.");
          }}
        >
          <input className={`${feld} flex-1`} type="url" maxLength={500} value={angebot} onChange={(e) => setAngebot(e.target.value)} placeholder="Angebotsseite (leer = Zielseite der Kampagne)" aria-label="Angebotsseite" />
          <button type="submit" className={knopf} disabled={laedt}>Speichern</button>
        </form>
      ) : (
        <div className="text-muted">Angebotsseite: {l.angebotUrl || "vom Ursprungslink bzw. Zielseite der Kampagne"}</div>
      )}
      {rueckmeldung}
    </li>
  );
}

function NeuerLink({ k }: { k: KKampagne }) {
  const [bezeichnung, setBezeichnung] = useState("");
  const [angebotUrl, setAngebotUrl] = useState("");
  const { laedt, aufruf, rueckmeldung } = useAktion();
  return (
    <form
      className="space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (await aufruf(`/api/reichweite/kampagnen/${k.id}/links`, "POST", { bezeichnung, angebotUrl })) {
          setBezeichnung("");
          setAngebotUrl("");
        }
      }}
    >
      <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
        <input className={feld} maxLength={80} value={bezeichnung} onChange={(e) => setBezeichnung(e.target.value)} placeholder="Kanal, z. B. LinkedIn-Beitrag" aria-label="Bezeichnung" />
        <input className={feld} type="url" maxLength={500} value={angebotUrl} onChange={(e) => setAngebotUrl(e.target.value)} placeholder="Angebotsseite (optional)" aria-label="Angebotsseite neuer Link" />
        <button type="submit" className={knopf} disabled={laedt}>Link anlegen</button>
      </div>
      {rueckmeldung}
    </form>
  );
}

export function ErgebnisTabelle({ ergebnis }: { ergebnis: KErgebnis }) {
  const z = ergebnis.zuordnung;
  return (
    <div className="space-y-3" data-testid="ergebnis-zuordnung">
      {ergebnis.hauptkennzahl && (
        <div className="text-sm text-foreground">
          Hauptkennzahl – {ergebnis.hauptkennzahl.label}: <strong>{ergebnis.hauptkennzahl.wert ?? "keine Daten"}</strong> {ergebnis.hauptkennzahl.istDemo && <DemoMarke />}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="text-muted">
            <tr>
              <th className="py-1 pr-2">Link</th>
              <th className="py-1 pr-2">Herkunft</th>
              <th className="py-1 pr-2">Angebotsseite</th>
              <th className="py-1 pr-2 text-right">Aufrufe</th>
              <th className="py-1 pr-2 text-right">Klicks</th>
              <th className="py-1 pr-2 text-right">Anfragen</th>
              <th className="py-1 text-right">neue Links</th>
            </tr>
          </thead>
          <tbody className="text-foreground">
            {z.zeilen.map((r) => (
              <tr key={r.schluessel} className={`border-t border-border ${r.schluessel === "unbekannt" ? "text-muted" : ""}`}>
                <td className="py-1 pr-2">{r.link}</td>
                <td className="py-1 pr-2">{r.herkunft}</td>
                <td className="break-all py-1 pr-2">{r.angebotsseite}</td>
                <td className="py-1 pr-2 text-right">{r.aufrufe}</td>
                <td className="py-1 pr-2 text-right">{r.zielKlicks}</td>
                <td className="py-1 pr-2 text-right">{r.anfragen}</td>
                <td className="py-1 text-right">{r.neueLinks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {z.jeAngebotsseite.length > 0 && (
        <div className="text-xs text-muted">
          Je Angebotsseite: {z.jeAngebotsseite.map((s) => `${s.angebotsseite}: ${s.aufrufe} Aufrufe, ${s.zielKlicks} Klicks, ${s.anfragen} Anfragen`).join(" · ")}
        </div>
      )}
      <p className="text-xs text-muted">Gezählt wird nur, was über die eigenen Links gemessen wurde. Ereignisse ohne Link bleiben „Herkunft unbekannt“ – es wird nichts geschätzt oder zugeordnet.</p>
    </div>
  );
}

export function KampagnenTab({
  kampagnen,
  auswahl,
  inhalte,
  links,
  ergebnis,
  freigeber,
  rechte,
  ichId,
  origin,
}: {
  kampagnen: KKampagne[];
  auswahl: string | null;
  inhalte: KInhalt[];
  links: KLink[];
  ergebnis: KErgebnis | null;
  freigeber: Person[];
  rechte: { bearbeiten: boolean; freigeben: boolean };
  ichId: string;
  origin: string;
}) {
  const k = kampagnen.find((x) => x.id === auswahl) ?? null;
  return (
    <div className="space-y-5">
      {rechte.bearbeiten && <Assistent freigeber={freigeber} darfBudget={rechte.freigeben} ichId={ichId} />}
      <section className={karte}>
        <h2 className="text-sm font-semibold text-foreground">Kampagnen</h2>
        {kampagnen.length === 0 ? (
          <p className="text-sm text-muted">Noch keine Kampagne. Lege oben die erste an.</p>
        ) : (
          <ul className="space-y-1">
            {kampagnen.map((x) => {
              const fehlt = kampagneFehlt(x);
              return (
                <li key={x.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <Link href={`/reichweitenaufbau?tab=kampagnen&k=${x.id}`} className={`underline ${x.id === auswahl ? "font-semibold text-foreground" : "text-muted"}`}>
                    {x.titel}
                  </Link>
                  {x.istDemo && <DemoMarke />}
                  {fehlt.length ? <Chip ton="warn">fehlt: {fehlt.join(", ")}</Chip> : <Chip ton="gut">vollständig</Chip>}
                </li>
              );
            })}
          </ul>
        )}
      </section>
      {k && (
        <>
          <section className={karte} data-testid="kampagne-detail">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              {k.titel} {k.istDemo && <DemoMarke />}
            </h2>
            <PlanBearbeiten key={k.id} k={k} freigeber={freigeber} darfBudget={rechte.freigeben} />
          </section>
          <section className={karte}>
            <h3 className="text-sm font-semibold text-foreground">Ablauf</h3>
            <Ablauf k={k} darfBearbeiten={rechte.bearbeiten} />
          </section>
          <section className={karte}>
            <h3 className="text-sm font-semibold text-foreground">Plattformformate aus einem Thema</h3>
            <Plattformformate key={k.id} k={k} darfBearbeiten={rechte.bearbeiten} />
          </section>
          <section className={karte}>
            <h3 className="text-sm font-semibold text-foreground">Inhalte dieser Kampagne – Prüfung und Freigabe je Variante</h3>
            <p className="text-xs text-muted">
              Freigeben darf nur {name(freigeber.find((p) => p.id === k.verantwortlichId))} (oder der Inhaber). Freigegeben heißt nicht veröffentlicht – veröffentlicht wird erst nach
              einem eigenen Schritt in der Content Factory.
            </p>
            {inhalte.length ? (
              <ul className="space-y-2">{inhalte.map((i) => <InhaltZeile key={i.id} i={i} darfBearbeiten={rechte.bearbeiten} />)}</ul>
            ) : (
              <p className="text-sm text-muted">Noch keine Inhalte. Übernimm oben eine Variante als Entwurf.</p>
            )}
          </section>
          <section className={karte}>
            <h3 className="text-sm font-semibold text-foreground">Kampagnenlinks und Angebotsseiten</h3>
            <p className="text-xs text-muted">Jeder Kanal bekommt einen eigenen Link. Der Link führt auf seine Angebotsseite; weitergegebene Links übernehmen sie.</p>
            <ul className="space-y-2">{links.map((l) => <LinkZeile key={l.id} l={l} origin={origin} darfBearbeiten={rechte.bearbeiten} />)}</ul>
            {rechte.bearbeiten && <NeuerLink k={k} />}
          </section>
          {ergebnis && (
            <section className={karte}>
              <h3 className="text-sm font-semibold text-foreground">Ergebnis und Zuordnung</h3>
              <ErgebnisTabelle ergebnis={ergebnis} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
