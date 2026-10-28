"use client";

import { useState } from "react";
import { AUSGABE_STATUS, darfUebergang, themenLesen } from "@/lib/reichweitenaufbau/newsletterRegeln";
import { Chip, DemoMarke, datum, datumZeit, useAktion } from "@/components/reichweitenaufbau/gemeinsam";
import { feld, karte, knopf, knopfPrimaer } from "@/components/reichweitenaufbau/stil";

interface Seite {
  id: string;
  code: string;
  titel: string;
  themenBeschreibung: string;
  themen: string;
  aktiv: boolean;
  istDemo: boolean;
  kampagne: { titel: string } | null;
}
interface Kontakt {
  id: string;
  email: string;
  status: string;
  themen: string;
  consentAt: string;
  confirmedAt: string | null;
  unsubscribedAt: string | null;
  istDemo: boolean;
  seiteId: string | null;
}
interface Ausgabe {
  id: string;
  betreff: string;
  text: string;
  bildIdee: string;
  themen: string;
  status: string;
  versandFehler: string;
  zugestelltAnzahl: number | null;
  geplantAm: string | null;
  versendetAm: string | null;
  empfaengerAnzahl: number | null;
  freigegebenAm: string | null;
  istDemo: boolean;
  kampagne: { titel: string } | null;
}

const KONTAKT_STATUS: Record<string, string> = { PENDING: "unbestätigt", ACTIVE: "bestätigt", UNSUBSCRIBED: "abgemeldet" };

export function NewsletterTab(props: {
  seiten: Seite[];
  kontakte: Kontakt[];
  ausgaben: Ausgabe[];
  zahlen: { ereignisse: { seiteId: string; art: string; anzahl: number }[]; kontakte: { seiteId: string | null; status: string; anzahl: number }[] };
  kampagnen: { id: string; titel: string }[];
  modus: "ECHT" | "DEMO";
  fehlt: string[];
  rechte: { bearbeiten: boolean; freigeben: boolean };
  origin: string;
}) {
  const { laedt, aufruf, rueckmeldung } = useAktion();
  const ev = (seiteId: string, art: string) => props.zahlen.ereignisse.find((e) => e.seiteId === seiteId && e.art === art)?.anzahl ?? 0;
  const ko = (seiteId: string, status: string) => props.zahlen.kontakte.find((k) => k.seiteId === seiteId && k.status === status)?.anzahl ?? 0;

  async function seiteAnlegen(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const ok = await aufruf("/api/reichweitenaufbau/newsletter/seiten", "POST", {
      titel: f.get("titel"),
      themenBeschreibung: f.get("beschreibung"),
      themen: String(f.get("themen") ?? "").split(",").map((t) => t.trim()).filter(Boolean),
      kampagneId: String(f.get("kampagneId") ?? "") || null,
    });
    if (ok) form.reset();
  }

  async function ausgabeAnlegen(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const ok = await aufruf("/api/reichweitenaufbau/newsletter/ausgaben", "POST", {
      betreff: f.get("betreff"),
      text: f.get("text"),
      bildIdee: f.get("bildIdee"),
      themen: String(f.get("themen") ?? "").split(",").map((t) => t.trim()).filter(Boolean),
      kampagneId: String(f.get("kampagneId") ?? "") || null,
    });
    if (ok) form.reset();
  }

  return (
    <div className="space-y-5">
      <div
        className={`rounded-lg border px-4 py-3 text-xs ${props.modus === "DEMO" ? "border-warning/50 bg-warning/10 text-warning" : "border-success/50 text-success"}`}
        data-testid="nl-modus"
      >
        {props.modus === "DEMO" ? (
          <>
            <strong>Demo-Modus:</strong> Es werden keine E-Mails versendet; Anmeldungen und Versand sind als DEMO gekennzeichnet. Für echten Versand fehlt:{" "}
            {props.fehlt.join(", ")}.{" "}
            <a href="/settings/zugaenge" className="underline">
              Eigenen Resend-Zugang eintragen
            </a>{" "}
            ·{" "}
            <a href="/sales" className="underline">
              Anbieterangaben
            </a>
          </>
        ) : (
          <>
            <strong>Echter Versand aktiv</strong> über Ihren eigenen Resend-Zugang: Bestätigungsmails (Double-Opt-in) und freigegebene Ausgaben – nur per Klick, nie automatisch.{" "}
            <a href="/settings/zugaenge" className="underline">
              Zugang verwalten
            </a>
          </>
        )}
      </div>
      <p className="text-xs text-muted">
        Ablauf: Social-Media-Beitrag → Landingpage → freiwillige Anmeldung → Bestätigung per E-Mail → freigegebene Inhalte → mögliche Anfrage. Der Versand läuft über Ihr eigenes
        Resend-Konto – Kosten und Limits nach Ihrem Resend-Tarif; SECRET 58 berechnet dafür nichts.
      </p>
      {rueckmeldung}

      <section className={karte}>
        <h2 className="text-sm font-semibold text-foreground">Anmeldeseiten</h2>
        {props.seiten.length === 0 && <p className="text-xs text-muted">Noch keine Anmeldeseite.</p>}
        <div className="grid gap-3 lg:grid-cols-2">
          {props.seiten.map((s) => (
            <article key={s.id} className="space-y-2 rounded-lg border border-border p-3 text-xs" data-testid="nl-seite">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">{s.titel}</span>
                {s.istDemo && <DemoMarke />}
                <Chip ton={s.aktiv ? "gut" : "neutral"}>{s.aktiv ? "aktiv" : "pausiert"}</Chip>
              </div>
              <a href={`/n/${s.code}`} target="_blank" rel="noopener noreferrer" className="block break-all font-mono text-accent-2">
                {props.origin}/n/{s.code}
              </a>
              <div className="text-muted">
                Kampagne: {s.kampagne?.titel ?? "—"} · Themen: {themenLesen(s.themen).join(", ") || "—"}
              </div>
              <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
                <Zahl label="Formularaufrufe" wert={ev(s.id, "AUFRUF")} />
                <Zahl label="Anmeldungen abgeschickt" wert={ev(s.id, "ANMELDUNG")} />
                <Zahl label="Bestätigt (aktuell)" wert={ko(s.id, "ACTIVE")} hervor />
                <Zahl label="Abgemeldet" wert={ko(s.id, "UNSUBSCRIBED")} />
              </div>
              <p className="text-[11px] text-muted">
                Nur bestätigte Anmeldungen zählen als Kontakte. Formularaufrufe sind Seitenaufrufe (keine Personen). Öffnungsraten werden nicht erhoben – sie sind technisch eingeschränkt (Bildblocker,
                Datenschutzfunktionen der Mailprogramme).
              </p>
              {props.rechte.bearbeiten && (
                <button type="button" className={knopf} disabled={laedt} onClick={() => aufruf(`/api/reichweitenaufbau/newsletter/seiten/${s.id}`, "PATCH", { aktiv: !s.aktiv })}>
                  {s.aktiv ? "Pausieren" : "Aktivieren"}
                </button>
              )}
            </article>
          ))}
        </div>
        {props.rechte.bearbeiten && (
          <details className="rounded-lg border border-border p-3">
            <summary className="cursor-pointer text-xs text-foreground">Neue Anmeldeseite</summary>
            <form onSubmit={seiteAnlegen} className="mt-2 grid gap-2 sm:grid-cols-2">
              <input name="titel" required maxLength={160} placeholder="Titel, z. B. „Monatliche Praxistipps“" className={feld} />
              <select name="kampagneId" className={feld} defaultValue="" aria-label="Kampagne">
                <option value="">Keine Kampagne</option>
                {props.kampagnen.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.titel}
                  </option>
                ))}
              </select>
              <textarea name="beschreibung" required minLength={10} maxLength={1000} rows={2} placeholder="Klare Beschreibung: Worum geht es, wie oft, was nicht?" className={`${feld} sm:col-span-2`} />
              <input name="themen" maxLength={500} placeholder="Themen zur Auswahl, durch Komma getrennt" className={feld} />
              <button type="submit" className={knopfPrimaer} disabled={laedt}>
                Anlegen
              </button>
            </form>
          </details>
        )}
      </section>

      <section className={karte}>
        <h2 className="text-sm font-semibold text-foreground">Ausgaben</h2>
        {props.ausgaben.length === 0 && <p className="text-xs text-muted">Noch keine Ausgabe.</p>}
        {props.ausgaben.map((a) => (
          <AusgabeKarte key={a.id} a={a} rechte={props.rechte} aufruf={aufruf} laedt={laedt} modus={props.modus} />
        ))}
        {props.rechte.bearbeiten && (
          <details className="rounded-lg border border-border p-3">
            <summary className="cursor-pointer text-xs text-foreground">Neue Ausgabe (Entwurf)</summary>
            <form onSubmit={ausgabeAnlegen} className="mt-2 grid gap-2 sm:grid-cols-2">
              <input name="betreff" required maxLength={200} placeholder="Betreff" className={`${feld} sm:col-span-2`} />
              <textarea name="text" required maxLength={20000} rows={6} placeholder="Text" className={`${feld} sm:col-span-2`} />
              <input name="bildIdee" maxLength={500} placeholder="Bildvorschlag" className={feld} />
              <input name="themen" maxLength={500} placeholder="Nur für Themen (Komma; leer = alle)" className={feld} />
              <select name="kampagneId" className={feld} defaultValue="" aria-label="Kampagne">
                <option value="">Keine Kampagne</option>
                {props.kampagnen.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.titel}
                  </option>
                ))}
              </select>
              <button type="submit" className={knopfPrimaer} disabled={laedt}>
                Entwurf speichern
              </button>
            </form>
          </details>
        )}
      </section>

      <section className={karte}>
        <h2 className="text-sm font-semibold text-foreground">Kontakte ({props.kontakte.length})</h2>
        <p className="text-[11px] text-muted">Nur Personen, die sich selbst angemeldet haben. Kein Import fremder Adressbücher. Unbestätigte und abgemeldete Einträge werden nach 30 Tagen gelöscht.</p>
        {props.kontakte.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead className="text-muted">
                <tr>
                  <th className="py-1 pr-2 font-normal">E-Mail</th>
                  <th className="py-1 pr-2 font-normal">Status</th>
                  <th className="py-1 pr-2 font-normal">Themen</th>
                  <th className="py-1 pr-2 font-normal">Einwilligung / Bestätigung</th>
                  <th className="py-1 font-normal" />
                </tr>
              </thead>
              <tbody className="text-foreground">
                {props.kontakte.map((k) => (
                  <tr key={k.id} className="border-t border-border">
                    <td className="break-all py-1.5 pr-2">
                      {k.email} {k.istDemo && <DemoMarke />}
                    </td>
                    <td className="py-1.5 pr-2">{KONTAKT_STATUS[k.status] ?? k.status}</td>
                    <td className="py-1.5 pr-2">{themenLesen(k.themen).join(", ") || "—"}</td>
                    <td className="py-1.5 pr-2">
                      {datum(k.consentAt)} / {k.confirmedAt ? datum(k.confirmedAt) : "—"}
                      {k.unsubscribedAt && ` · abgemeldet ${datum(k.unsubscribedAt)}`}
                    </td>
                    <td className="py-1.5">
                      {props.rechte.freigeben && (
                        <button type="button" className="text-muted underline hover:text-danger" disabled={laedt} onClick={() => confirm("Kontakt endgültig löschen?") && aufruf(`/api/reichweitenaufbau/newsletter/kontakte/${k.id}`, "DELETE")}>
                          löschen
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Zahl({ label, wert, hervor = false }: { label: string; wert: number; hervor?: boolean }) {
  return (
    <div className={`rounded-md border px-2 py-1 ${hervor ? "border-accent/60" : "border-border"}`}>
      <div className="text-sm font-semibold text-foreground">{wert}</div>
      <div className="text-[10px] leading-tight text-muted">{label}</div>
    </div>
  );
}

function AusgabeKarte({ a, rechte, aufruf, laedt, modus }: { a: Ausgabe; rechte: { bearbeiten: boolean; freigeben: boolean }; aufruf: ReturnType<typeof useAktion>["aufruf"]; laedt: boolean; modus: "ECHT" | "DEMO" }) {
  const [vorschau, setVorschau] = useState(false);
  const [bearbeiten, setBearbeiten] = useState(false);
  const [geplant, setGeplant] = useState("");
  const aktion = (name: string, extra: Record<string, unknown> = {}) => aufruf(`/api/reichweitenaufbau/newsletter/ausgaben/${a.id}/aktion`, "POST", { aktion: name, ...extra });
  const versendet = a.status === "VERSENDET" || a.status === "VERSENDET_DEMO";

  return (
    <article className="space-y-2 rounded-lg border border-border p-3 text-xs" data-testid="nl-ausgabe">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-foreground">{a.betreff}</span>
        {a.istDemo && <DemoMarke />}
        <Chip ton={a.status === "VERSENDET" ? "gut" : a.status === "VERSENDET_DEMO" ? "warn" : "neutral"}>{AUSGABE_STATUS[a.status as keyof typeof AUSGABE_STATUS] ?? a.status}</Chip>
      </div>
      <div className="text-muted">
        Kampagne: {a.kampagne?.titel ?? "—"} · Themen: {themenLesen(a.themen).join(", ") || "alle"} · Bildvorschlag: {a.bildIdee || "—"}
        {a.freigegebenAm && ` · freigegeben ${datumZeit(a.freigegebenAm)}`}
        {a.geplantAm && ` · geplant für ${datumZeit(a.geplantAm)}`}
        {a.versendetAm && ` · ${a.status === "VERSENDET_DEMO" ? "Demo-Versand" : "versendet"} ${datumZeit(a.versendetAm)} an ${a.empfaengerAnzahl ?? 0} bestätigte Kontakte`}
        {a.status === "VERSENDET" && a.zugestelltAnzahl !== null && ` (${a.zugestelltAnzahl} vom Versanddienst angenommen)`}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={knopf} onClick={() => setVorschau(!vorschau)}>
          Vorschau
        </button>
        {rechte.bearbeiten && !versendet && (
          <button type="button" className={knopf} onClick={() => setBearbeiten(!bearbeiten)}>
            Bearbeiten
          </button>
        )}
        {rechte.bearbeiten && darfUebergang("pruefen", a.status) && (
          <button type="button" className={knopf} disabled={laedt} onClick={() => aktion("pruefen")}>
            Zur Prüfung
          </button>
        )}
        {rechte.freigeben && darfUebergang("freigeben", a.status) && (
          <button type="button" className={knopfPrimaer} disabled={laedt} onClick={() => aktion("freigeben")}>
            Freigeben
          </button>
        )}
        {rechte.bearbeiten && darfUebergang("zurueck", a.status) && (
          <button type="button" className={knopf} disabled={laedt} onClick={() => aktion("zurueck")}>
            Zurück zu Entwurf
          </button>
        )}
        {rechte.freigeben && darfUebergang("versenden", a.status) && (
          <button
            type="button"
            className={knopf}
            disabled={laedt}
            onClick={() => (a.istDemo || modus === "DEMO" || confirm(`„${a.betreff}“ jetzt an alle bestätigten Kontakte mit passenden Themen versenden? Das lässt sich nicht rückgängig machen.`)) && aktion("versenden")}
          >
            {a.istDemo || modus === "DEMO" ? "Versenden (DEMO)" : "Jetzt an bestätigte Kontakte versenden"}
          </button>
        )}
      </div>
      {rechte.freigeben && darfUebergang("planen", a.status) && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <input type="datetime-local" value={geplant} onChange={(e) => setGeplant(e.target.value)} className={feld} aria-label="Versandzeitpunkt" />
          <button type="button" className={knopf} disabled={laedt || !geplant} onClick={() => aktion("planen", { geplantAm: new Date(geplant).toISOString() })}>
            Versand planen
          </button>
        </div>
      )}
      {!rechte.freigeben && (darfUebergang("freigeben", a.status) || darfUebergang("planen", a.status)) && (
        <p className="text-[11px] text-muted">Freigeben, Planen und Versenden dürfen nur Inhaber und Admins.</p>
      )}
      {a.status === "GEPLANT" && <p className="text-[11px] text-warning">Geplant ist eine Erinnerung: Es gibt keinen automatischen Versand. Versendet wird erst per Klick auf „versenden“.</p>}
      {a.versandFehler && <p className="text-[11px] text-danger">Letzter Versandversuch: {a.versandFehler}</p>}
      {vorschau && (
        <div className="rounded-md border border-border bg-surface-2 p-3" data-testid="nl-vorschau">
          <div className="text-muted">Betreff</div>
          <div className="mb-2 font-medium text-foreground">{a.betreff}</div>
          <div className="whitespace-pre-line text-foreground">{a.text}</div>
          <div className="mt-2 text-muted">[Bild: {a.bildIdee || "kein Vorschlag"}]</div>
          <div className="mt-2 text-[10px] text-muted">Fußzeile: Abmeldelink und Anbieterangaben werden beim Versand ergänzt.</div>
        </div>
      )}
      {bearbeiten && (
        <form
          className="grid gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const ok = await aufruf(`/api/reichweitenaufbau/newsletter/ausgaben/${a.id}`, "PATCH", {
              betreff: f.get("betreff"),
              text: f.get("text"),
              bildIdee: f.get("bildIdee"),
              themen: themenLesen(a.themen),
            });
            if (ok) setBearbeiten(false);
          }}
        >
          <input name="betreff" defaultValue={a.betreff} required maxLength={200} className={feld} aria-label="Betreff" />
          <textarea name="text" defaultValue={a.text} required rows={6} maxLength={20000} className={feld} aria-label="Text" />
          <input name="bildIdee" defaultValue={a.bildIdee} maxLength={500} className={feld} aria-label="Bildvorschlag" />
          <p className="text-[11px] text-muted">Speichern setzt die Ausgabe auf „Entwurf“ zurück – eine bestehende Freigabe gilt dann nicht mehr.</p>
          <button type="submit" className={knopf} disabled={laedt}>
            Speichern
          </button>
        </form>
      )}
      {rechte.bearbeiten && !versendet && (
        <button type="button" className="text-muted underline hover:text-danger" disabled={laedt} onClick={() => confirm("Ausgabe löschen?") && aufruf(`/api/reichweitenaufbau/newsletter/ausgaben/${a.id}`, "DELETE")}>
          Löschen
        </button>
      )}
    </article>
  );
}
