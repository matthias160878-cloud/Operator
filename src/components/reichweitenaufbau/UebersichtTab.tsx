import Link from "next/link";
import type { KampagnenBeleg } from "@/lib/reichweitenaufbau/werbung";
import type { Stufe } from "@/lib/reichweitenaufbau/status";
import { Chip, DemoMarke, StatusLeiste } from "@/components/reichweitenaufbau/gemeinsam";
import { karte } from "@/components/reichweitenaufbau/stil";

export function UebersichtTab(props: {
  kampagnen: { id: string; titel: string; istDemo: boolean; aktiv: boolean }[];
  belege: KampagnenBeleg[];
  stufen: { inhalte: Record<Stufe, number>; newsletter: Record<Stufe, number>; werbung: Record<Stufe, number> };
  schritte: { text: string; tab: string; art: "AKTION" | "FEHLT" }[];
  anbindungen: { newsletterModus: "ECHT" | "DEMO"; emailEingerichtet: boolean; newsletterAktiv: boolean; werbungAktiv: boolean };
  kooperationen: number;
  tests: number;
}) {
  return (
    <div className="space-y-5">
      <section className={karte}>
        <h2 className="text-sm font-semibold text-foreground">Stand der Abläufe</h2>
        <StatusLeiste titel="Inhalte (Content Factory)" zahlen={props.stufen.inhalte} />
        {props.anbindungen.newsletterAktiv && <StatusLeiste titel="Newsletter-Ausgaben" zahlen={props.stufen.newsletter} />}
        {props.anbindungen.werbungAktiv && <StatusLeiste titel="Werbepläne" zahlen={props.stufen.werbung} />}
        <p className="text-[11px] text-muted">
          „Veröffentlicht / versendet“ zählt nur bestätigte Aktionen – keine Demo-Daten.
        </p>
      </section>

      <section className={karte}>
        <h2 className="text-sm font-semibold text-foreground">Nächste vorgeschlagene Schritte</h2>
        {props.schritte.length === 0 ? (
          <p className="text-xs text-muted">Nichts offen.</p>
        ) : (
          <ul className="space-y-1.5">
            {props.schritte.map((s) => (
              <li key={s.text} className="flex flex-wrap items-center gap-2 text-sm">
                <Chip ton={s.art === "FEHLT" ? "warn" : "neutral"}>{s.art === "FEHLT" ? "fehlt" : "zu tun"}</Chip>
                <Link href={`/reichweitenaufbau?tab=${s.tab}`} className="text-foreground underline-offset-2 hover:underline">
                  {s.text}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[11px] text-muted">Regelbasierte Hinweise aus dem aktuellen Stand – keine Erfolgsprognose.</p>
      </section>

      <section className={karte}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Kampagnenübersicht</h2>
          <Link href="/weiterempfehlungen" className="text-xs text-accent-2 underline">
            Kampagnen und Links verwalten
          </Link>
        </div>
        {props.belege.length === 0 ? (
          <p className="text-xs text-muted">Noch keine Kampagne. Lege sie unter „Weiterempfehlungen“ an oder lade die Demo-Daten.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead className="text-muted">
                <tr>
                  <th className="py-1 pr-3 font-normal">Kampagne</th>
                  <th className="py-1 pr-3 font-normal">Linkaufrufe</th>
                  <th className="py-1 pr-3 font-normal">Klicks zur Zielseite</th>
                  <th className="py-1 pr-3 font-normal">Anfragen</th>
                  {props.anbindungen.newsletterAktiv && <th className="py-1 font-normal">Newsletter bestätigt</th>}
                </tr>
              </thead>
              <tbody className="text-foreground">
                {props.belege.map((b) => (
                  <tr key={b.kampagneId} className="border-t border-border">
                    <td className="py-1.5 pr-3">
                      {b.titel} {b.istDemo && <DemoMarke />}
                    </td>
                    <td className="py-1.5 pr-3">{b.aufrufe}</td>
                    <td className="py-1.5 pr-3">{b.zielKlicks}</td>
                    <td className="py-1.5 pr-3">{b.anfragen}</td>
                    {props.anbindungen.newsletterAktiv && <td className="py-1.5">{b.newsletterBestaetigt}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[11px] text-muted">
          Eigene Messung über Empfehlungslinks: Aufrufe und Klicks sind keine Personen. Plattformzahlen (Impressionen, Reichweite) siehe Weiterempfehlungen – nur Demo oder manuell.
        </p>
      </section>

      <section className={karte}>
        <h2 className="text-sm font-semibold text-foreground">Anbindungen</h2>
        <ul className="space-y-1 text-xs text-foreground">
          <li>
            Content-Freigabe: <Chip ton="gut">angebunden</Chip> (bestehende Content Factory)
          </li>
          <li>
            Kampagnenlinks und eigene Messung: <Chip ton="gut">angebunden</Chip> (Weiterempfehlungen)
          </li>
          <li>
            Plattform-Statistiken (Wiedergabedauer, Speicherungen …): <Chip ton="warn">nicht angebunden</Chip> – manuell oder Demo
          </li>
          {props.anbindungen.werbungAktiv ? (
            <li>
              Werbe-Schnittstellen (Meta, Google Ads, LinkedIn, TikTok): <Chip ton="warn">nicht angebunden</Chip> – Entwurf und Export
            </li>
          ) : (
            <li>
              Werbeplanung: <Chip ton="neutral">nicht freigeschaltet</Chip> – vorbereitet, wird erst nach ausdrücklicher Freigabe eingeschaltet
            </li>
          )}
          {props.anbindungen.newsletterAktiv ? (
            <li>
              Newsletter-Versand: <Chip ton={props.anbindungen.newsletterModus === "ECHT" ? "gut" : "warn"}>{props.anbindungen.newsletterModus === "ECHT" ? "Bestätigungsmails aktiv" : "Demo"}</Chip>{" "}
              {props.anbindungen.emailEingerichtet ? "Versanddienst eingerichtet" : "Versanddienst (Resend) nicht eingerichtet"}; Versand von Ausgaben noch nicht umgesetzt
            </li>
          ) : (
            <li>
              Newsletter: <Chip ton="neutral">nicht freigeschaltet</Chip> – vorbereitet, wird erst nach ausdrücklicher Freigabe eingeschaltet
            </li>
          )}
          <li>
            Kooperationen: {props.kooperationen} · Variantenvergleiche: {props.tests}
          </li>
        </ul>
      </section>
    </div>
  );
}
