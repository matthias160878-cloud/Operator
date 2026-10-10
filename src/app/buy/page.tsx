import Link from "next/link";
import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import { legalInfoComplete, legalLinks } from "@/lib/legal";
import {
  METRIC_LABELS,
  PLANS,
  PLAN_KEYS,
  VAT_NOTE,
  YEARLY_DISCOUNT_PERCENT,
  formatCents,
  netAmountFor,
  packageTermsConfirmed,
  stripePriceIdFor,
  yearlyMonthlyEquivalent,
  type Metric,
} from "@/lib/plans";
import { getPlanPrice } from "@/lib/stripe";
import "./zentrale.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Social Media KI — SECRET 58",
  description:
    "SECRET 58 Social Media KI: Content Brain, KI-Agenten für Skripte, Hashtags und Thumbnails, Freigabe-Workflow, Kalender, Analytics. Pro oder Maxi im Monatsabo.",
};

/**
 * Öffentliche Verkaufsseite „Social Media KI“, übernommen aus der Zentrale
 * (secret58-web, social-media-ki.html) — Aussehen der Zentrale, Inhalte
 * angepasst an das, was diese Anwendung tatsächlich verkauft:
 *  - Pakete, Leistungen und Kontingente aus src/lib/plans.ts,
 *  - Monatsabo; Jahresabo (15 % Rabatt) nur angezeigt, wenn der Jahrespreis in
 *    Stripe eingerichtet ist oder die Seite als Vorschau (Verkauf gesperrt) läuft,
 *  - Kauf erst nach Anmeldung unter /billing mit ausdrücklicher Bestätigung.
 * ?plan=pro|maxi (oder ?vorauswahl= aus der Zentrale/Genesis) hebt ein Paket
 * nur hervor — ein Kauf wird hier nie ausgelöst.
 */
export default async function BuyPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; vorauswahl?: string }>;
}) {
  const { plan, vorauswahl } = await searchParams;
  const preselected = (plan ?? vorauswahl ?? "").toUpperCase();
  const user = await getSessionUser();
  const prices = await Promise.all(PLAN_KEYS.map((k) => getPlanPrice(k).catch(() => null)));
  const saleOpen = packageTermsConfirmed() && legalInfoComplete();
  const { agb, datenschutz } = legalLinks();

  return (
    <div className="zentrale">
      <header className="kopf">
        <div className="wrap kopf-wrap">
          <Link className="marke" href="/buy">
            Secret <span>58</span>
          </Link>
          <nav className="hauptnav" aria-label="Hauptnavigation">
            <a href="#pakete">Preise</a>
            <a href="#leistungen">Leistungen</a>
            <a href="#grenzen">Ehrliche Grenzen</a>
            {user ? (
              <Link href="/" className="nav-login">Zum Arbeitsbereich</Link>
            ) : (
              <Link href="/login" className="nav-login">Kundenbereich</Link>
            )}
          </nav>
        </div>
      </header>

      <main className="wrap seite-inhalt">
        <p className="brotkrumen">SECRET 58 / Social Media KI</p>

        <h1>Social Media KI</h1>
        <p className="lead">
          Die eigenständige Software von SECRET 58: Aus einer Idee wird fertiger, freigegebener Content für YouTube,
          TikTok, Instagram, LinkedIn und Facebook. 14 KI-Agenten erzeugen Skripte, Hooks, Hashtags, Thumbnails,
          Untertitel und Voiceover.
        </p>

        <div className="preisanker">
          <span>Zwei Pakete im Monats- oder Jahresabo, Zugriff nach bestätigter Zahlung</span>
          <span>Jederzeit zum Ende des Abrechnungszeitraums kündbar</span>
          <span>Eigener, privater Arbeitsbereich je Kunde</span>
        </div>

        <h2 id="pakete">Pro oder Maxi</h2>
        <div className="preis-tabelle">
          {PLAN_KEYS.map((key, i) => {
            const def = PLANS[key];
            const price = prices[i];
            const highlighted = key === "MAXI";
            const showYear = Boolean(stripePriceIdFor(key, "year")) || !saleOpen;
            const interval =
              price?.recurring?.interval === "year" ? "Jahr" : price?.recurring?.interval === "month" || !price ? "Monat" : null;
            const href = user ? `/billing?plan=${key.toLowerCase()}` : `/signup?plan=${key.toLowerCase()}`;
            return (
              <div
                key={key}
                id={`paket-${key.toLowerCase()}`}
                className={`preis-karte${highlighted ? " hervorgehoben" : ""}${preselected === key ? " ausgewaehlt" : ""}`}
              >
                <small>
                  {def.name.toUpperCase()}
                  {highlighted ? " · empfohlen" : ""}
                </small>
                <h3>{def.name}</h3>
                <div className="betrag">
                  {formatCents(def.netAmountCents, def.displayCurrency)}{" "}
                  <span>{interval ? `netto / ${interval}, zzgl. Steuer` : VAT_NOTE}</span>
                </div>
                {showYear && (
                  <p className="jahr">
                    oder <b>{formatCents(netAmountFor(key, "year"), def.displayCurrency)}</b> netto / Jahr im Jahresabo,
                    als Jahresbetrag im Voraus bezahlt. Entspricht {formatCents(yearlyMonthlyEquivalent(key), def.displayCurrency)}{" "}
                    / Monat, {YEARLY_DISCOUNT_PERCENT} % günstiger als 12 Monatszahlungen.
                  </p>
                )}
                <ul>
                  {def.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <ul>
                  {(Object.keys(def.quotas) as Metric[]).map((m) => (
                    <li key={m}>
                      {def.quotas[m]} × {METRIC_LABELS[m]}
                    </li>
                  ))}
                </ul>
                {saleOpen ? (
                  <Link className="knopf-link" href={href}>
                    {def.name} wählen
                  </Link>
                ) : (
                  <span className="knopf-link gesperrt" aria-disabled="true">
                    Kauf noch nicht freigeschaltet
                  </span>
                )}
                <p className="klein">
                  Preise {VAT_NOTE}; die Steuer wird im Checkout berechnet. Ein gültiger Aktionscode kann im Checkout
                  eingegeben werden. Kontingente sind feste Obergrenzen je Monat, ohne automatische Zusatzkäufe.
                </p>
              </div>
            );
          })}
        </div>
        {!saleOpen && (
          <div className="hinweis">
            <strong>Vorschau</strong>
            <p>Der Kauf ist auf dieser Fassung noch nicht freigeschaltet. Pakete und Preise werden nur angezeigt.</p>
          </div>
        )}

        <div className="hinweis">
          <strong>Nicht zu verwechseln mit unserer Beratungsleistung „Social Media“</strong>
          <p>
            Persönliche, manuelle Social-Media-Betreuung bietet SECRET 58 separat an. <b>Social Media KI</b> ist eine
            Software, die Sie selbst bedienen: KI-Agenten statt persönlicher Betreuung, im Abo statt projektbasiert.
          </p>
        </div>

        <h2 id="leistungen">Was die Software macht</h2>
        <ul>
          <li>
            <b>Content Brain</b>: Aus einer Idee wird eine Kampagne mit mehreren Content-Entwürfen für alle Plattformen.
          </li>
          <li>
            <b>Script-, Hook-, Hashtag- und Thumbnail-Agenten</b>: automatisch erzeugt, jederzeit nachbearbeitbar.
          </li>
          <li>
            <b>Content Factory mit Freigabe-Workflow</b>: Nichts geht ohne Ihre Bestätigung raus.
          </li>
          <li>
            <b>Content-Kalender, Analytics und Wachstums-Empfehlungen</b>: aus Ihren Daten, ohne gekauftes
            Follower-Wachstum.
          </li>
          <li>
            <b>Posteingang</b> mit KI-Antwortentwürfen, die vor dem Versand freigegeben werden.
          </li>
          <li>
            <b>Einnahmen-Übersicht</b> über alle Plattformen an einem Ort.
          </li>
        </ul>

        <h2>Was im Preis enthalten ist</h2>
        <p className="note">
          Die KI-Funktionen laufen über die Zugänge des Betreibers. Sie zahlen nur Ihr Paket und brauchen kein eigenes
          ChatGPT-, Claude-, Gemini- oder ElevenLabs-Abo; bestehende eigene Abos werden weder übernommen noch gekündigt.
          Genutzt wird im Rahmen der Monatskontingente oben. Ist ein Kontingent erreicht, wird gestoppt, nicht
          nachberechnet. Ist ein Dienst beim Betreiber noch nicht eingerichtet, zeigt die Software das offen unter
          „Integrationen“ an.
        </p>

        <h2 id="grenzen">Ehrliche Grenzen</h2>
        <div className="karten">
          <div className="karte">
            <h3>Verbinden</h3>
            <p>
              Ihre Kanäle verbinden Sie über das offizielle Anmeldeverfahren der jeweiligen Plattform. Zugangsschlüssel
              werden verschlüsselt gespeichert.
            </p>
          </div>
          <div className="karte">
            <h3>Veröffentlichen</h3>
            <p>
              Veröffentlicht wird nur nach Ihrer Freigabe und über die Schnittstelle der Plattform. Schlägt es fehl,
              sehen Sie den echten Fehler, keinen vorgetäuschten Erfolg.
            </p>
          </div>
          <div className="karte">
            <h3>Plattform-Freigaben</h3>
            <p>
              TikTok und Meta (Instagram, Facebook) prüfen die App vor dem Veröffentlichen selbst. Bis zu dieser Freigabe
              ist dort nur das Verbinden und Anzeigen des Kontos möglich.
            </p>
          </div>
          <div className="karte">
            <h3>Keine Erfolgsgarantie</h3>
            <p>Die Software hilft bei Planung und Produktion. Reichweite und Umsatz kann niemand zusagen.</p>
          </div>
        </div>

        <div className="cta-box">
          <h2>Jetzt starten</h2>
          <p>
            Paket oben wählen und anmelden. Der Kauf läuft danach über einen sicheren Stripe-Checkout. Freigeschaltet
            wird erst, wenn die Zahlung bestätigt ist, nie allein durch die Rückkehr zur Seite.
          </p>
          <div className="knopf-reihe">
            {user ? (
              <Link className="knopf-link stumm" href="/">
                Zum Arbeitsbereich
              </Link>
            ) : (
              <Link className="knopf-link stumm" href="/login">
                Anmelden
              </Link>
            )}
          </div>
        </div>
      </main>

      <footer className="fuss">
        <div className="wrap">
          <Link href="/impressum">Impressum</Link>
          {datenschutz && (
            <a href={datenschutz} target="_blank" rel="noreferrer">
              Datenschutz
            </a>
          )}
          {agb && (
            <a href={agb} target="_blank" rel="noreferrer">
              AGB
            </a>
          )}
        </div>
      </footer>
    </div>
  );
}
