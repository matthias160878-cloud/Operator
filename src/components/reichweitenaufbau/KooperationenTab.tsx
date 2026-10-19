"use client";

import { useState } from "react";
import { KOOP_ARTEN, KOOP_FORMATE, KOOP_STATUS, PASSUNG, gemeinsamerBeitragDirekt } from "@/lib/reichweitenaufbau/kooperation";
import { empfehlungsUrl } from "@/lib/reichweite/teilen";
import { Chip, DemoMarke, datumZeit, useAktion } from "@/components/reichweitenaufbau/gemeinsam";
import { feld, karte, knopf, knopfPrimaer } from "@/components/reichweitenaufbau/stil";

interface Koop {
  id: string;
  name: string;
  profilUrl: string;
  art: string;
  zielgruppenpassung: string;
  passungNotiz: string;
  idee: string;
  format: string;
  status: string;
  naechsterSchritt: string;
  termin: string | null;
  kampagneId: string | null;
  kampagne: { titel: string } | null;
  link: { code: string } | null;
  anfrageEntwurf: string;
  istDemo: boolean;
}

/** ISO → Wert für datetime-local in der Zeitzone des Browsers. */
const lokal = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

const optionen = (o: Record<string, string>) =>
  Object.entries(o).map(([k, v]) => (
    <option key={k} value={k}>
      {v}
    </option>
  ));

export function KooperationenTab(props: { kooperationen: Koop[]; kampagnen: { id: string; titel: string }[]; darfBearbeiten: boolean; origin: string }) {
  const { laedt, aufruf, rueckmeldung } = useAktion();

  async function anlegen(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const ok = await aufruf("/api/reichweitenaufbau/kooperationen", "POST", {
      name: f.get("name"),
      profilUrl: f.get("profilUrl"),
      art: f.get("art"),
      zielgruppenpassung: f.get("zielgruppenpassung"),
      passungNotiz: f.get("passungNotiz"),
      idee: f.get("idee"),
      format: f.get("format"),
      kampagneId: String(f.get("kampagneId") ?? "") || null,
    });
    if (ok) form.reset();
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted">
        Übersicht für mögliche Zusammenarbeit. Es werden keine Kontaktlisten ausgelesen und keine Nachrichten versendet – Anfragen sind Entwürfe, die Sie selbst persönlich verschicken.
      </p>
      {rueckmeldung}
      {props.darfBearbeiten && (
        <details className={karte}>
          <summary className="cursor-pointer text-sm font-semibold text-foreground">Kooperation hinzufügen</summary>
          <form onSubmit={anlegen} className="mt-3 grid gap-2 sm:grid-cols-2">
            <input name="name" required maxLength={120} placeholder="Name bzw. Organisation" className={feld} />
            <input name="profilUrl" maxLength={500} placeholder="Öffentliches Profil oder Webseite (https://…)" className={feld} />
            <select name="art" className={feld} aria-label="Art">
              {optionen(KOOP_ARTEN)}
            </select>
            <select name="format" className={feld} aria-label="Format">
              {optionen(KOOP_FORMATE)}
            </select>
            <select name="zielgruppenpassung" className={feld} aria-label="Zielgruppenpassung" defaultValue="UNKLAR">
              {Object.entries(PASSUNG).map(([k, v]) => (
                <option key={k} value={k}>
                  Zielgruppenpassung: {v}
                </option>
              ))}
            </select>
            <select name="kampagneId" className={feld} defaultValue="" aria-label="Kampagne">
              <option value="">Keine Kampagne</option>
              {props.kampagnen.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.titel}
                </option>
              ))}
            </select>
            <input name="passungNotiz" maxLength={500} placeholder="Warum passt die Zielgruppe? (konkret)" className={`${feld} sm:col-span-2`} />
            <textarea name="idee" maxLength={1000} rows={2} placeholder="Kooperationsidee" className={`${feld} sm:col-span-2`} />
            <button type="submit" className={knopfPrimaer} disabled={laedt}>
              Hinzufügen
            </button>
          </form>
        </details>
      )}
      {props.kooperationen.length === 0 && <p className="text-sm text-muted">Noch keine Kooperation.</p>}
      <div className="grid gap-3 lg:grid-cols-2">
        {props.kooperationen.map((k) => (
          <KoopKarte key={k.id} k={k} {...props} aufruf={aufruf} laedt={laedt} />
        ))}
      </div>
    </div>
  );
}

function KoopKarte({
  k,
  kampagnen,
  darfBearbeiten,
  origin,
  aufruf,
  laedt,
}: {
  k: Koop;
  kampagnen: { id: string; titel: string }[];
  darfBearbeiten: boolean;
  origin: string;
  aufruf: ReturnType<typeof useAktion>["aufruf"];
  laedt: boolean;
}) {
  const [absender, setAbsender] = useState("");
  const [sie, setSie] = useState(true);
  const [entwurf, setEntwurf] = useState(k.anfrageEntwurf);
  const [kopiert, setKopiert] = useState(false);
  const direkt = gemeinsamerBeitragDirekt("Instagram/TikTok");

  async function speichern(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const termin = String(f.get("termin") ?? "");
    await aufruf(`/api/reichweitenaufbau/kooperationen/${k.id}`, "PATCH", {
      status: f.get("status"),
      naechsterSchritt: f.get("naechsterSchritt"),
      termin: termin ? new Date(termin).toISOString() : null,
      kampagneId: String(f.get("kampagneId") ?? "") || null,
    });
  }

  async function entwurfErstellen() {
    const r = await aufruf<{ kooperation: Koop }>(`/api/reichweitenaufbau/kooperationen/${k.id}/entwurf`, "POST", { absender, sie });
    if (r) setEntwurf(r.kooperation.anfrageEntwurf);
  }

  return (
    <article className="card space-y-2 p-4 text-sm" data-testid="kooperation">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-foreground">
          {k.name} {k.istDemo && <DemoMarke />}
        </h3>
        <Chip ton={k.status === "ABGESAGT" ? "schlecht" : k.status === "VEREINBART" || k.status === "UMGESETZT" ? "gut" : "neutral"}>
          {KOOP_STATUS[k.status as keyof typeof KOOP_STATUS] ?? k.status}
        </Chip>
      </div>
      <div className="text-xs text-muted">
        {KOOP_ARTEN[k.art as keyof typeof KOOP_ARTEN] ?? k.art} · {KOOP_FORMATE[k.format as keyof typeof KOOP_FORMATE] ?? k.format} · Zielgruppenpassung{" "}
        {PASSUNG[k.zielgruppenpassung as keyof typeof PASSUNG] ?? k.zielgruppenpassung}
        {k.passungNotiz && ` (${k.passungNotiz})`}
      </div>
      {k.profilUrl && (
        <a href={k.profilUrl} target="_blank" rel="noopener noreferrer" className="block break-all text-xs text-accent-2 underline">
          {k.profilUrl}
        </a>
      )}
      {k.idee && <p className="text-xs text-foreground">Idee: {k.idee}</p>}
      <p className="text-xs text-muted">
        Nächster Schritt: <span className="text-foreground">{k.naechsterSchritt || "—"}</span> · Termin: <span className="text-foreground">{datumZeit(k.termin)}</span> · Kampagne:{" "}
        <span className="text-foreground">{k.kampagne?.titel ?? "—"}</span>
      </p>
      {k.link ? (
        <p className="break-all text-xs text-muted">
          Kampagnenlink zur Auswertung: <span className="font-mono text-accent-2">{empfehlungsUrl(origin, k.link.code)}</span>
        </p>
      ) : (
        darfBearbeiten &&
        k.kampagneId && (
          <button type="button" className={knopf} disabled={laedt} onClick={() => aufruf(`/api/reichweitenaufbau/kooperationen/${k.id}/link`, "POST")}>
            Individuellen Kampagnenlink erzeugen
          </button>
        )
      )}
      {k.format === "GEMEINSAMER_BEITRAG" && <p className="text-[11px] text-warning">{direkt.grund}</p>}

      {darfBearbeiten && (
        <details className="rounded-lg border border-border p-2">
          <summary className="cursor-pointer text-xs text-foreground">Status, nächster Schritt, Termin</summary>
          <form onSubmit={speichern} className="mt-2 grid gap-2 sm:grid-cols-2">
            <select name="status" className={feld} defaultValue={k.status} aria-label="Status">
              {optionen(KOOP_STATUS)}
            </select>
            <input name="termin" type="datetime-local" defaultValue={lokal(k.termin)} suppressHydrationWarning className={feld} aria-label="Vereinbarter Termin" />
            <input name="naechsterSchritt" defaultValue={k.naechsterSchritt} maxLength={300} placeholder="Nächster Schritt" className={feld} />
            <select name="kampagneId" className={feld} defaultValue={k.kampagneId ?? ""} aria-label="Kampagne">
              <option value="">Keine Kampagne</option>
              {kampagnen.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.titel}
                </option>
              ))}
            </select>
            <button type="submit" className={knopf} disabled={laedt}>
              Speichern
            </button>
            <p className="text-[11px] text-muted sm:col-span-2">„Angefragt“ bitte erst setzen, wenn Sie die Anfrage selbst verschickt haben.</p>
          </form>
        </details>
      )}

      {darfBearbeiten && (
        <details className="rounded-lg border border-border p-2" open={!!entwurf}>
          <summary className="cursor-pointer text-xs text-foreground">Persönliche Anfrage (Entwurf)</summary>
          <div className="mt-2 space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input value={absender} onChange={(e) => setAbsender(e.target.value)} maxLength={120} placeholder="Ihr Name / Unternehmen" className={feld} />
              <select value={sie ? "sie" : "du"} onChange={(e) => setSie(e.target.value === "sie")} className={feld} aria-label="Anrede">
                <option value="sie">Sie</option>
                <option value="du">du</option>
              </select>
              <button type="button" className={knopf} disabled={laedt} onClick={entwurfErstellen}>
                Entwurf erstellen
              </button>
            </div>
            {entwurf && (
              <>
                <textarea value={entwurf} onChange={(e) => setEntwurf(e.target.value)} rows={8} className={feld} aria-label="Entwurf" />
                <button
                  type="button"
                  className={knopf}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(entwurf);
                      setKopiert(true);
                    } catch {
                      setKopiert(false);
                    }
                  }}
                >
                  {kopiert ? "Kopiert" : "Text kopieren"}
                </button>
                <p className="text-[11px] text-muted">Nicht versendet. Bitte persönlich anpassen und über Ihren eigenen Kanal verschicken.</p>
              </>
            )}
          </div>
        </details>
      )}
      {darfBearbeiten && (
        <button type="button" className="text-xs text-muted underline hover:text-danger" disabled={laedt} onClick={() => confirm("Kooperation löschen?") && aufruf(`/api/reichweitenaufbau/kooperationen/${k.id}`, "DELETE")}>
          Löschen
        </button>
      )}
    </article>
  );
}
