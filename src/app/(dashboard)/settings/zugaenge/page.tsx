import Link from "next/link";
import { requireSessionUser } from "@/lib/auth/session";
import { darfFreigeben } from "@/lib/reichweite/zugriff";
import { isTokenEncryptionConfigured } from "@/lib/crypto";
import { WERBE_WEGWEISER, ZUGANG_ANBIETER, type ZugangAnbieter } from "@/lib/zugaenge/anbieter";
import { zugaengeUebersicht } from "@/lib/zugaenge/service";
import { werbungFreigeschaltet } from "@/lib/reichweitenaufbau/freischaltung";
import { ZugangFormular } from "@/components/settings/ZugangFormular";
import { ZugangFenster } from "@/components/settings/ZugangFenster";
import { KiLimitFormular } from "@/components/settings/KiLimitFormular";
import { kiLimitsLesen, kiVerbrauch } from "@/lib/ai/kiLimits";
import { kostenSchaetzen, usdBetrag } from "@/lib/ai/kosten";
import type { KiAnbieter } from "@/lib/ai/modelle";

export const dynamic = "force-dynamic";

const SICHERHEITS_HINWEIS = "Wird verschlüsselt gespeichert, gilt nur für diesen Workspace und wird danach nie wieder angezeigt (nur die letzten vier Zeichen).";

function statusAnzeige(status: string | null): { text: string; klasse: string } {
  if (status === null) return { text: "nicht eingerichtet", klasse: "border-border text-muted" };
  if (status === "OK") return { text: "eingerichtet und geprüft", klasse: "border-success/50 text-success" };
  if (status === "FEHLER") return { text: "Fehler", klasse: "border-danger/50 text-danger" };
  return { text: "ungeprüft", klasse: "border-warning/50 text-warning" };
}

type ZugangZeile = Awaited<ReturnType<typeof zugaengeUebersicht>>[number];

/** Inhalt des Eintragen-Fensters: Anleitung, gespeicherter Stand, Formular, Hinweise. */
function ZugangDetails({ a, z, eintragenErlaubt }: { a: ZugangAnbieter; z: ZugangZeile | null; eintragenErlaubt: boolean }) {
  return (
    <div className="space-y-4" data-testid={`zugang-${a.key}`}>
      <p className="text-xs text-muted">{a.wofuer}</p>
      <div>
        <h3 className="text-xs font-semibold text-foreground">So bekommen Sie den Schlüssel</h3>
        <ol className="mt-1 list-decimal space-y-1 pl-5 text-xs text-foreground">
          {a.schritte.map((s) => (
            <li key={s.text}>
              {s.text}{" "}
              {s.link && (
                <a href={s.link.href} target="_blank" rel="noopener noreferrer" className="text-accent-2 underline">
                  {s.link.label} ↗
                </a>
              )}
            </li>
          ))}
        </ol>
        <a href={a.preise.href} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-[11px] text-accent-2 underline">
          {a.preise.text} ↗
        </a>
      </div>
      <div className="space-y-2 rounded-lg border border-border bg-surface-2/40 p-3">
        <h3 className="text-xs font-semibold text-foreground">Bei SECRET 58 eintragen</h3>
        <p className="text-[11px] text-muted">{SICHERHEITS_HINWEIS}</p>
        {z && (
          <p className="text-xs text-muted">
            Gespeichert: Schlüssel …{z.endung}
            {z.anzeige && ` · ${z.anzeige}`}
            {z.meldung && (
              <>
                <br />
                <span className={z.status === "OK" ? "text-success" : "text-danger"}>{z.meldung}</span>
              </>
            )}
          </p>
        )}
        {eintragenErlaubt ? (
          <ZugangFormular anbieter={a.key} felder={a.felder.map((f) => ({ key: f.key, label: f.label, geheim: f.geheim, platzhalter: f.platzhalter }))} vorhanden={!!z} />
        ) : (
          <p className="text-xs text-warning">Eintragen, prüfen und löschen ist für Sie gesperrt (nur Inhaber und Admins, und nur wenn der Server verschlüsselt speichern kann).</p>
        )}
      </div>
      <ul className="list-disc space-y-0.5 pl-5 text-[11px] text-muted">
        {a.hinweise
          .filter((h) => !h.startsWith("Der Schlüssel wird verschlüsselt gespeichert"))
          .map((h) => (
            <li key={h}>{h}</li>
          ))}
      </ul>
    </div>
  );
}

/** Einstellungen → Eigene Zugänge: Kunde trägt seine Schlüssel selbst ein, mit Wegweiser je Anbieter. */
export default async function ZugaengePage() {
  const user = await requireSessionUser();
  const zugaenge = await zugaengeUebersicht(user.workspaceId);
  const darf = darfFreigeben(user.role);
  const [limits, verbrauch] = await Promise.all([kiLimitsLesen(user.workspaceId), kiVerbrauch(user.workspaceId)]);
  const beispiele = (["anthropic", "openai", "gemini"] as KiAnbieter[]).map((p) => kostenSchaetzen(p, 3000, 900));
  const verschluesselung = isTokenEncryptionConfigured();
  const eintragenErlaubt = darf && verschluesselung;
  const sperrGrund = !verschluesselung ? "Gesperrt, bis der Server Schlüssel verschlüsselt speichern kann." : !darf ? "Eintragen dürfen nur Inhaber und Admins." : undefined;
  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs text-muted">
          <Link href="/settings" className="underline">
            Einstellungen
          </Link>{" "}
          → Eigene Zugänge
        </div>
        <h1 className="mt-1 text-xl font-semibold text-foreground">Eigene Zugänge</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Dienste, die über Ihre eigenen Konten laufen. Sie tragen Ihren Schlüssel hier selbst ein – er wird verschlüsselt gespeichert, gilt nur für diesen Workspace und wird nie wieder
          angezeigt. Kosten entstehen nur bei Ihrem Anbieter; SECRET 58 berechnet dafür nichts.
        </p>
      </div>
      {!verschluesselung && (
        <div className="rounded-lg border border-danger/50 bg-danger/10 px-4 py-3 text-xs text-danger">
          Der Server kann Schlüssel derzeit nicht verschlüsselt speichern. Bitte den Betreiber informieren – bis dahin ist das Eintragen gesperrt.
        </div>
      )}
      {!darf && <p className="text-xs text-warning">Ansehen ist möglich; eintragen, prüfen und löschen dürfen nur Inhaber und Admins.</p>}

      <section className="card space-y-3 p-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Übersicht</h2>
          <p className="mt-1 text-xs text-muted">
            Den Schlüssel erstellen Sie beim jeweiligen Anbieter (Link öffnet dessen Seite in einem neuen Tab). Eingetragen wird er hier in einem eigenen Fenster – mit Anleitung.
            Für KI-Texte reicht ein Anbieter.
          </p>
        </div>
        <table className="w-full text-left text-sm" data-testid="zugang-tabelle">
          <thead className="hidden border-b border-border text-xs text-muted md:table-header-group">
            <tr>
              <th scope="col" className="py-2 pr-3 font-medium">Anbieter</th>
              <th scope="col" className="py-2 pr-3 font-medium">Wofür</th>
              <th scope="col" className="py-2 pr-3 font-medium">Status</th>
              <th scope="col" className="py-2 pr-3 font-medium">Schlüssel bekommen</th>
              <th scope="col" className="py-2 font-medium">Bei SECRET 58 eintragen</th>
            </tr>
          </thead>
          <tbody className="block space-y-3 md:table-row-group md:space-y-0">
            {Object.values(ZUGANG_ANBIETER).map((a) => {
              const z = zugaenge.find((x) => x.anbieter === a.key) ?? null;
              const st = statusAnzeige(z?.status ?? null);
              return (
                <tr key={a.key} className="block rounded-lg border border-border p-3 md:table-row md:rounded-none md:border-0 md:border-b md:p-0">
                  <td className="block py-1 font-medium text-foreground md:table-cell md:py-3 md:pr-3">{a.name}</td>
                  <td className="block py-1 text-xs text-muted md:table-cell md:py-3 md:pr-3">
                    <span className="md:hidden">Wofür: </span>
                    {a.kurz}
                  </td>
                  <td className="block py-1 md:table-cell md:py-3 md:pr-3">
                    <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] ${st.klasse}`}>{st.text}</span>
                  </td>
                  <td className="block py-1 text-xs md:table-cell md:py-3 md:pr-3">
                    <span className="text-muted md:hidden">Schlüssel bekommen: </span>
                    <a href={a.schluesselSeite.href} target="_blank" rel="noopener noreferrer" className="break-all text-accent-2 underline">
                      {a.schluesselSeite.label} ↗<span className="sr-only"> (öffnet die Seite von {a.name} in einem neuen Tab)</span>
                    </a>
                  </td>
                  <td className="block py-1 md:table-cell md:py-3">
                    <ZugangFenster titel={`${a.name} – Zugang eintragen`} darfEintragen={eintragenErlaubt} sperrGrund={sperrGrund}>
                      <ZugangDetails a={a} z={z} eintragenErlaubt={eintragenErlaubt} />
                    </ZugangFenster>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="card space-y-3 p-5" data-testid="ki-verbrauch">
        <h2 className="text-sm font-semibold text-foreground">KI-Verbrauch und Limits</h2>
        <p className="text-xs text-muted">
          Diesen Monat ({verbrauch.monat}): {verbrauch.aufrufe} KI-Aufrufe mit eigenem Schlüssel, geschätzt {usdBetrag(verbrauch.kostenUsd)}
          {verbrauch.ohnePreis > 0 && ` – davon ${verbrauch.ohnePreis} Aufruf(e) mit unbekanntem Modellpreis (Kosten offen)`}. Die verbindliche Abrechnung steht bei Ihrem Anbieter.
        </p>
        <p className="text-xs text-muted">
          Kostenpflichtige KI-Funktionen zeigen vorher eine Schätzung und laufen erst nach Bestätigung. Beispiel für einen Text (ca. 3.000 Zeichen Eingabe, bis 900 Token Ausgabe):{" "}
          {beispiele.map((b) => `${b.modell}: ${b.berechenbar && b.usdMax !== null ? `höchstens ca. ${usdBetrag(b.usdMax)}` : "nicht berechenbar"}`).join(" · ")}.
        </p>
        {darf ? (
          <KiLimitFormular aufrufe={limits.aufrufeMonat} kostenUsd={limits.kostenMonatUsd} />
        ) : (
          <p className="text-xs text-muted">
            Limits: {limits.aufrufeMonat ?? "keins"} Aufrufe / {limits.kostenMonatUsd !== null ? usdBetrag(limits.kostenMonatUsd) : "keins"} pro Monat (ändern nur Inhaber und Admins).
          </p>
        )}
        <p className="text-[11px] text-muted">Ist ein Kostenlimit gesetzt, werden Aufrufe mit nicht berechenbaren Kosten zur Sicherheit abgelehnt.</p>
      </section>

      <section className="card space-y-2 p-5">
        <h2 className="text-sm font-semibold text-foreground">Werbekonten (Meta, Google Ads, LinkedIn, TikTok)</h2>
        <p className="text-xs text-muted">
          Hier sind keine Schlüssel nötig. {werbungFreigeschaltet() ? "Werbepläne aus dem Reichweitenaufbau" : "Werbepläne"} werden freigegeben und als Datei exportiert; die Kampagne legen Sie
          selbst in Ihrem Werbekonto an. Eine direkte Anbindung setzt eine Freigabe durch die jeweilige Plattform voraus und ist noch nicht eingerichtet.
        </p>
        <ul className="grid gap-1 text-xs sm:grid-cols-2">
          {WERBE_WEGWEISER.map((w) => (
            <li key={w.name}>
              {w.name}:{" "}
              <a href={w.href} target="_blank" rel="noopener noreferrer" className="text-accent-2 underline">
                {w.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
