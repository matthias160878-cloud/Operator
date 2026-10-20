"use client";

import { useState } from "react";
import {
  PLATTFORM_VORAUSSETZUNGEN,
  WERBE_PLATTFORMEN,
  WERBE_ZIELE,
  ZIELGRUPPEN_ARTEN,
  euro,
  laufzeitTage,
  planHinweise,
  type KampagnenBeleg,
  type WerbePlattform,
} from "@/lib/reichweitenaufbau/werbung";
import { Chip, DemoMarke, datum, datumZeit, tagInput, useAktion } from "@/components/reichweitenaufbau/gemeinsam";
import { feld, karte, knopf, knopfPrimaer } from "@/components/reichweitenaufbau/stil";

interface Plan {
  id: string;
  titel: string;
  plattform: string;
  ziel: string;
  zielgruppe: string;
  zielgruppenArt: string;
  region: string;
  sprache: string;
  startAm: string;
  endeAm: string;
  tagesbudgetCent: number;
  gesamtbudgetCent: number;
  zielUrl: string;
  erfolgsmessung: string;
  status: string;
  freigegebenAm: string | null;
  gemeldeteAusgabenCent: number | null;
  gemeldetQuelle: string;
  gemeldetAm: string | null;
  istDemo: boolean;
  contentItem: { title: string } | null;
  kampagne: { titel: string } | null;
}

const STATUS_TEXT: Record<string, string> = { ENTWURF: "Entwurf", PRUEFUNG: "Prüfung", FREIGEGEBEN: "Freigegeben (nicht gestartet)" };
const cent = (eingabe: FormDataEntryValue | null) => Math.round(Number(String(eingabe ?? "").replace(",", ".")) * 100);

export function WerbungTab(props: {
  plaene: Plan[];
  kampagnen: { id: string; titel: string }[];
  inhalte: { id: string; title: string }[];
  vorschlaege: (KampagnenBeleg & { begruendung: string })[];
  rechte: { bearbeiten: boolean; freigeben: boolean };
}) {
  const { laedt, aufruf, rueckmeldung } = useAktion();
  const [plattform, setPlattform] = useState<WerbePlattform>("META");
  const [vorlageKampagne, setVorlageKampagne] = useState("");

  async function anlegen(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const ok = await aufruf("/api/reichweitenaufbau/werbung", "POST", {
      titel: f.get("titel"),
      contentItemId: String(f.get("contentItemId") ?? "") || null,
      kampagneId: String(f.get("kampagneId") ?? "") || null,
      plattform: f.get("plattform"),
      ziel: f.get("ziel"),
      zielgruppe: f.get("zielgruppe"),
      zielgruppenArt: f.get("zielgruppenArt"),
      region: f.get("region"),
      sprache: f.get("sprache"),
      startAm: f.get("startAm"),
      endeAm: f.get("endeAm"),
      tagesbudgetCent: cent(f.get("tagesbudget")),
      gesamtbudgetCent: cent(f.get("gesamtbudget")),
      zielUrl: f.get("zielUrl"),
      erfolgsmessung: f.get("erfolgsmessung"),
    });
    if (ok) form.reset();
  }

  const v = PLATTFORM_VORAUSSETZUNGEN[plattform];

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-warning/50 bg-warning/10 px-4 py-3 text-xs text-warning">
        Keine Werbe-Schnittstelle angebunden. Hier entstehen Planung, Freigabe und ein exportierbarer Kampagnenentwurf – es wird nichts gestartet und nichts bezahlt. Geplante Budgets sind keine
        Ausgaben; eine feste Obergrenze setzt nur die Werbeplattform selbst.
      </div>
      {rueckmeldung}

      <section className={karte}>
        <h2 className="text-sm font-semibold text-foreground">Vorschläge zum Bewerben (auf Basis gemessener Ergebnisse)</h2>
        {props.vorschlaege.length === 0 ? (
          <p className="text-xs text-muted">Noch keine ausreichend belegten Ergebnisse (mind. 20 Linkaufrufe und eine Anfrage, Anmeldung oder Klick).</p>
        ) : (
          <ul className="space-y-2">
            {props.vorschlaege.map((b) => (
              <li key={b.kampagneId} className="rounded-md border border-border p-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{b.titel}</span>
                  {b.istDemo && <DemoMarke />}
                  {props.rechte.bearbeiten && (
                    <button type="button" className="text-accent-2 underline" onClick={() => setVorlageKampagne(b.kampagneId)}>
                      als Vorlage für einen Plan
                    </button>
                  )}
                </div>
                <p className="mt-1 text-muted">{b.begruendung}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {props.rechte.bearbeiten && (
        <details className={karte} open={!!vorlageKampagne}>
          <summary className="cursor-pointer text-sm font-semibold text-foreground">Werbeplan anlegen</summary>
          <form onSubmit={anlegen} className="mt-3 grid gap-2 sm:grid-cols-2" key={vorlageKampagne}>
            <input name="titel" required maxLength={160} placeholder="Titel des Plans" className={feld} />
            <select name="contentItemId" className={feld} defaultValue="" aria-label="Beitrag oder Video">
              <option value="">Beitrag/Video wählen (optional)</option>
              {props.inhalte.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.title}
                </option>
              ))}
            </select>
            <select name="kampagneId" className={feld} defaultValue={vorlageKampagne} aria-label="Kampagne">
              <option value="">Keine Kampagne</option>
              {props.kampagnen.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.titel}
                </option>
              ))}
            </select>
            <select name="plattform" className={feld} value={plattform} onChange={(e) => setPlattform(e.target.value as WerbePlattform)} aria-label="Plattform">
              {WERBE_PLATTFORMEN.map((p) => (
                <option key={p} value={p}>
                  {PLATTFORM_VORAUSSETZUNGEN[p].label}
                </option>
              ))}
            </select>
            <select name="ziel" className={feld} aria-label="Kampagnenziel">
              {Object.entries(WERBE_ZIELE).map(([k, t]) => (
                <option key={k} value={k}>
                  {t}
                </option>
              ))}
            </select>
            <select name="zielgruppenArt" className={feld} aria-label="Zielgruppen-Art">
              {Object.entries(ZIELGRUPPEN_ARTEN).map(([k, t]) => (
                <option key={k} value={k}>
                  {t}
                </option>
              ))}
            </select>
            <input name="zielgruppe" maxLength={500} placeholder="Zielgruppe (Alter, Interessen …)" className={`${feld} sm:col-span-2`} />
            <input name="region" maxLength={200} placeholder="Region" className={feld} />
            <input name="sprache" maxLength={60} defaultValue="Deutsch" className={feld} aria-label="Sprache" />
            <label className="space-y-1 text-xs text-muted">
              Start
              <input name="startAm" type="date" required className={feld} />
            </label>
            <label className="space-y-1 text-xs text-muted">
              Ende
              <input name="endeAm" type="date" required className={feld} />
            </label>
            <label className="space-y-1 text-xs text-muted">
              Tagesbudget (EUR, geplant)
              <input name="tagesbudget" required inputMode="decimal" placeholder="10,00" className={feld} />
            </label>
            <label className="space-y-1 text-xs text-muted">
              Gesamtbudget (EUR, geplant)
              <input name="gesamtbudget" required inputMode="decimal" placeholder="70,00" className={feld} />
            </label>
            <input name="zielUrl" maxLength={500} placeholder="Zielseite (https://…)" className={feld} />
            <input name="erfolgsmessung" maxLength={500} placeholder="Erfolgsmessung, z. B. Klicks über Kampagnenlink" className={feld} />
            <button type="submit" className={knopfPrimaer} disabled={laedt}>
              Als Entwurf speichern
            </button>
          </form>
          <div className="mt-3 rounded-lg border border-border p-3 text-xs">
            <div className="font-medium text-foreground">
              {v.label} – {v.schnittstelle} <Chip ton="warn">nicht angebunden</Chip>
            </div>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-muted">
              {v.voraussetzungen.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <div className="mt-1 text-muted">
              Zielgruppen: neu – {v.zielgruppen.NEU}; erneute Ansprache – {v.zielgruppen.ERNEUT}; ähnlich – {v.zielgruppen.AEHNLICH}.
            </div>
            <a href={v.quelle} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-accent-2 underline">
              Offizielle Unterlagen (Stand der Prüfung: 19.10.2026)
            </a>
            <p className="mt-1 text-muted">Erneute Ansprache und ähnliche Zielgruppen setzen eigene Datenquellen mit Einwilligung voraus – Kontaktlisten werden von dieser App nicht verteilt.</p>
          </div>
        </details>
      )}

      {props.plaene.length === 0 && <p className="text-sm text-muted">Noch kein Werbeplan.</p>}
      {props.plaene.map((p) => (
        <PlanKarte key={p.id} p={p} rechte={props.rechte} aufruf={aufruf} laedt={laedt} />
      ))}
    </div>
  );
}

function PlanKarte({ p, rechte, aufruf, laedt }: { p: Plan; rechte: { bearbeiten: boolean; freigeben: boolean }; aufruf: ReturnType<typeof useAktion>["aufruf"]; laedt: boolean }) {
  const [freigabeOffen, setFreigabeOffen] = useState(false);
  const kern = { plattform: p.plattform, ziel: p.ziel, startAm: new Date(p.startAm), endeAm: new Date(p.endeAm), tagesbudgetCent: p.tagesbudgetCent, gesamtbudgetCent: p.gesamtbudgetCent };

  async function freigeben(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const ok = await aufruf(`/api/reichweitenaufbau/werbung/${p.id}/freigabe`, "POST", {
      gesamtbudgetCent: cent(f.get("betrag")),
      startAm: f.get("start"),
      endeAm: f.get("ende"),
      ziel: f.get("ziel"),
      bestaetigt: f.get("bestaetigt") === "on",
    });
    if (ok) setFreigabeOffen(false);
  }

  return (
    <section className={karte} data-testid="werbeplan">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">
          {p.titel} {p.istDemo && <DemoMarke />}
        </h3>
        <Chip ton={p.status === "FREIGEGEBEN" ? "gut" : p.status === "PRUEFUNG" ? "warn" : "neutral"}>{STATUS_TEXT[p.status] ?? p.status}</Chip>
      </div>
      <dl className="grid gap-1 text-xs sm:grid-cols-2">
        <Zeile k="Plattform" v={PLATTFORM_VORAUSSETZUNGEN[p.plattform as WerbePlattform]?.label ?? p.plattform} />
        <Zeile k="Ziel" v={WERBE_ZIELE[p.ziel as keyof typeof WERBE_ZIELE] ?? p.ziel} />
        <Zeile k="Inhalt" v={p.contentItem?.title ?? p.kampagne?.titel ?? "—"} />
        <Zeile k="Zielgruppe" v={`${ZIELGRUPPEN_ARTEN[p.zielgruppenArt as keyof typeof ZIELGRUPPEN_ARTEN] ?? p.zielgruppenArt}${p.zielgruppe ? ` – ${p.zielgruppe}` : ""}`} />
        <Zeile k="Region / Sprache" v={`${p.region || "—"} / ${p.sprache}`} />
        <Zeile k="Laufzeit" v={`${datum(p.startAm)} – ${datum(p.endeAm)} (${laufzeitTage(kern)} Tage)`} />
        <Zeile k="Zielseite" v={p.zielUrl || "—"} />
        <Zeile k="Erfolgsmessung" v={p.erfolgsmessung || "—"} />
      </dl>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-2 text-xs">
          <div className="text-muted">Geplant</div>
          <div className="text-foreground">
            {euro(p.tagesbudgetCent)} pro Tag · {euro(p.gesamtbudgetCent)} gesamt
          </div>
        </div>
        <div className="rounded-lg border border-border p-2 text-xs" data-testid="gemeldete-ausgaben">
          <div className="text-muted">Tatsächlich gemeldete Ausgaben</div>
          <div className="text-foreground">
            {p.gemeldeteAusgabenCent === null ? "keine Meldung (keine Werbeanbindung)" : `${euro(p.gemeldeteAusgabenCent)} · Quelle: ${p.gemeldetQuelle} · ${datumZeit(p.gemeldetAm)}`}
          </div>
        </div>
      </div>
      <ul className="list-disc space-y-0.5 pl-4 text-[11px] text-muted">
        {planHinweise(kern).map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
      {p.freigegebenAm && <p className="text-xs text-success">Freigegeben am {datumZeit(p.freigegebenAm)} – nicht gestartet.</p>}

      <div className="flex flex-wrap gap-2">
        {rechte.bearbeiten && p.status === "ENTWURF" && (
          <button type="button" className={knopf} disabled={laedt} onClick={() => aufruf(`/api/reichweitenaufbau/werbung/${p.id}/pruefung`, "POST")}>
            Zur Freigabe vorlegen
          </button>
        )}
        {rechte.freigeben && p.status === "PRUEFUNG" && (
          <button type="button" className={knopfPrimaer} onClick={() => setFreigabeOffen(!freigabeOffen)}>
            Freigeben …
          </button>
        )}
        <a className={knopf} href={`/api/reichweitenaufbau/werbung/${p.id}/export?format=json`}>
          Export JSON
        </a>
        <a className={knopf} href={`/api/reichweitenaufbau/werbung/${p.id}/export?format=csv`}>
          Export CSV
        </a>
        {rechte.freigeben && (
          <button type="button" className={knopf} disabled={laedt} onClick={() => aufruf(`/api/reichweitenaufbau/werbung/${p.id}/starten`, "POST")}>
            Kampagne starten
          </button>
        )}
      </div>
      {!rechte.freigeben && p.status === "PRUEFUNG" && <p className="text-[11px] text-muted">Freigeben dürfen nur Inhaber und Admins.</p>}

      {freigabeOffen && (
        <form onSubmit={freigeben} className="grid gap-2 rounded-lg border border-accent/50 p-3 sm:grid-cols-2" data-testid="freigabe-form">
          <p className="text-xs text-foreground sm:col-span-2">Bitte Betrag, Laufzeit und Ziel zur Bestätigung erneut eingeben. Die Freigabe startet nichts.</p>
          <label className="space-y-1 text-xs text-muted">
            Gesamtbetrag (EUR)
            <input name="betrag" required inputMode="decimal" className={feld} />
          </label>
          <label className="space-y-1 text-xs text-muted">
            Ziel
            <select name="ziel" className={feld} defaultValue="">
              <option value="" disabled>
                bitte wählen
              </option>
              {Object.entries(WERBE_ZIELE).map(([k, t]) => (
                <option key={k} value={k}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs text-muted">
            Start
            <input name="start" type="date" required className={feld} />
          </label>
          <label className="space-y-1 text-xs text-muted">
            Ende
            <input name="ende" type="date" required className={feld} />
          </label>
          <label className="flex items-start gap-2 text-xs text-muted sm:col-span-2">
            <input type="checkbox" name="bestaetigt" required className="mt-0.5 h-4 w-4" />
            <span>
              Ich gebe diesen Plan mit höchstens {euro(p.gesamtbudgetCent)} vom {tagInput(p.startAm)} bis {tagInput(p.endeAm)} frei. Mir ist bewusst, dass die Ausgaben im Werbekonto selbst begrenzt
              werden müssen.
            </span>
          </label>
          <button type="submit" className={knopfPrimaer} disabled={laedt}>
            Freigabe bestätigen
          </button>
        </form>
      )}

      {rechte.bearbeiten && p.status === "FREIGEGEBEN" && (
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            await aufruf(`/api/reichweitenaufbau/werbung/${p.id}/ausgaben`, "POST", { ausgabenCent: cent(f.get("ausgaben")) });
          }}
        >
          <input name="ausgaben" required inputMode="decimal" placeholder="Im Werbekonto gemeldete Ausgaben (EUR)" className={feld} />
          <button type="submit" className={knopf} disabled={laedt}>
            Gemeldete Ausgaben eintragen
          </button>
        </form>
      )}
      {rechte.bearbeiten && (
        <button type="button" className="text-left text-xs text-muted underline hover:text-danger" disabled={laedt} onClick={() => confirm("Werbeplan löschen?") && aufruf(`/api/reichweitenaufbau/werbung/${p.id}`, "DELETE")}>
          Löschen
        </button>
      )}
    </section>
  );
}

function Zeile({ k, v }: { k: string; v: string }) {
  return (
    <div className="break-words">
      <dt className="inline text-muted">{k}: </dt>
      <dd className="inline text-foreground">{v}</dd>
    </div>
  );
}
