import Link from "next/link";
import Script from "next/script";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { getSessionUser } from "@/lib/auth/session";
import { legalInfoComplete, legalLinks } from "@/lib/legal";
import {
  METRIC_LABELS,
  PLANS,
  PLAN_KEYS,
  kleinunternehmer,
  preisArt,
  steuerHinweis,
  YEARLY_DISCOUNT_PERCENT,
  formatCents,
  netAmountFor,
  packageTermsConfirmed,
  stripePriceIdFor,
  yearlyMonthlyEquivalent,
  type Metric,
} from "@/lib/plans";
import { getPlanPrice, isStripeConfigured, isStripeWebhookConfigured } from "@/lib/stripe";
import "./zentrale.css";

export const dynamic = "force-dynamic";

/** Fünf Plattformen als Perlen im Kopfbild (wie in der Zentrale): Kürzel, Name, Farbe, Lage. */
const PERLEN = [
  ["YT", "YouTube", "#ff5fa2", 8, 52],
  ["FB", "Facebook", "#4aa8ff", 29, 24],
  ["IG", "Instagram", "#b06bff", 50, 58],
  ["IN", "LinkedIn", "#2fd3c4", 71, 24],
  ["TT", "TikTok", "#ffc24d", 92, 52],
] as const;

/** Funken im Kopfbild (Lage in %, Farbe) – feste Werte, damit Server und Browser gleich rendern. */
const FUNKEN = Array.from({ length: 18 }, (_, i) => [
  52 + ((i * 37) % 46),
  8 + ((i * 53) % 82),
  ["#ff5fa2", "#b06bff", "#2fd3c4", "#4aa8ff", "#ffc24d"][i % 5],
] as const);

/** Geplante Autopilot-Größen (noch nicht buchbar, Preise vorläufig) — wie in der Hauptseite. */
const AUTOPILOT = [
  { name: "Autopilot S", preis: "149 €", agency: false, punkte: ["1 Marke", "30 Content-Ideen pro Monat", "10 KI-Videos (à 30 s) pro Monat", "10 Minuten Sprachausgabe pro Monat"] },
  { name: "Autopilot M", preis: "399 €", agency: false, punkte: ["3 Marken", "90 Content-Ideen pro Monat", "30 KI-Videos (à 30 s) pro Monat", "30 Minuten Sprachausgabe pro Monat"] },
  { name: "Autopilot L", preis: "999 €", agency: true, punkte: ["10 Marken", "250 Content-Ideen pro Monat", "80 KI-Videos (à 30 s) pro Monat", "90 Minuten Sprachausgabe pro Monat"] },
];

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
  const saleOpen = packageTermsConfirmed() && legalInfoComplete() && isStripeConfigured() && isStripeWebhookConfigured();
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
            <span data-sprachwahl-platz="" suppressHydrationWarning />
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

        <section className="smk-hero">
          <span className="smk-funken" aria-hidden="true">
            {FUNKEN.map((f, i) => (
              <i key={i} style={{ left: `${f[0]}%`, top: `${f[1]}%`, "--f": f[2], animationDelay: `${-i * 0.7}s` } as CSSProperties} />
            ))}
          </span>
          <span className="smk-kicker">Monatsabo</span>
          <h1>Social Media KI</h1>
          <p className="lead">
            Die eigenständige Software von SECRET 58: Aus einer Idee wird fertiger, freigegebener Content für YouTube,
            TikTok, Instagram, LinkedIn und Facebook. 14 KI-Agenten erzeugen Skripte, Hooks, Hashtags, Thumbnails,
            Untertitel und Voiceover.
          </p>
          <div
            className="smk-orbit"
            role="img"
            aria-label="Fünf Plattformen – YouTube, Facebook, Instagram, LinkedIn, TikTok – laufen in einem Kommandostand zusammen"
          >
            <svg className="faden" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="smkFaden" x1="0" x2="1">
                  <stop offset="0" stopColor="#ff5fa2" />
                  <stop offset=".3" stopColor="#b06bff" />
                  <stop offset=".55" stopColor="#4aa8ff" />
                  <stop offset=".78" stopColor="#2fd3c4" />
                  <stop offset="1" stopColor="#ffc24d" />
                </linearGradient>
              </defs>
              <path
                vectorEffect="non-scaling-stroke"
                stroke="url(#smkFaden)"
                d="M8 70 C 16 50, 22 42, 29 42 S 42 74, 50 76 S 64 42, 71 42 S 86 54, 92 70"
              />
            </svg>
            {PERLEN.map(([kurz, name, farbe, x, y], i) => (
              <span
                key={kurz}
                className="smk-perle"
                aria-hidden="true"
                style={{ "--i": i, "--f": farbe, "--x": `${x}%`, "--y": `${y}px` } as CSSProperties}
              >
                <b>{kurz}</b>
                <small>{name}</small>
              </span>
            ))}
            <span className="smk-ziel" aria-hidden="true">
              Ein Kommandostand
            </span>
          </div>
        </section>

        <div className="preisanker">
          <span>Zwei Pakete im Monats- oder Jahresabo, Zugriff nach bestätigter Zahlung</span>
          <span>Jederzeit zum Ende des Abrechnungszeitraums kündbar</span>
          <span>Eigener, privater Arbeitsbereich je Kunde</span>
        </div>

        {/* Monat/Jahr-Schalter ohne JavaScript: wirkt nur auf Karten mit eingerichtetem Jahrespreis. */}
        <input className="smk-wahl" type="radio" name="smk-intervall" id="smk-monat" defaultChecked />
        <input className="smk-wahl" type="radio" name="smk-intervall" id="smk-jahr" />
        <div className="smk-leiste">
          <h2 id="pakete">Pro oder Maxi</h2>
          {PLAN_KEYS.some((k) => Boolean(stripePriceIdFor(k, "year")) || !saleOpen) && (
            <div className="smk-schalter" role="group" aria-label="Abrechnung anzeigen">
              <label htmlFor="smk-monat">Monatlich</label>
              <label htmlFor="smk-jahr">
                Jährlich <small>−{YEARLY_DISCOUNT_PERCENT} %</small>
              </label>
            </div>
          )}
        </div>
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
                className={`preis-karte${highlighted ? " hervorgehoben" : ""}${preselected === key ? " ausgewaehlt" : ""}${showYear ? " hat-jahr" : ""}`}
              >
                {highlighted && <span className="smk-band">Empfohlen</span>}
                <small>
                  {def.name.toUpperCase()}
                  {highlighted ? " · empfohlen" : ""}
                </small>
                <h3>{def.name}</h3>
                <div className="betrag betrag-monat">
                  {formatCents(def.netAmountCents, def.displayCurrency)}{" "}
                  <span>{interval ? (kleinunternehmer() ? `/ ${interval}, Endpreis – keine USt (§ 19 UStG)` : `netto / ${interval}, zzgl. Steuer`) : steuerHinweis()}</span>
                </div>
                {showYear && (
                  <div className="betrag betrag-jahr">
                    {formatCents(netAmountFor(key, "year"), def.displayCurrency)} <span>/ Jahr im Voraus, {preisArt()}</span>
                  </div>
                )}
                {showYear && (
                  <p className="jahr">
                    oder <b>{formatCents(netAmountFor(key, "year"), def.displayCurrency)}</b> {preisArt()} / Jahr im Jahresabo,
                    als Jahresbetrag im Voraus bezahlt. Entspricht {formatCents(yearlyMonthlyEquivalent(key), def.displayCurrency)}{" "}
                    / Monat, {YEARLY_DISCOUNT_PERCENT} % günstiger als 12 Monatszahlungen.
                  </p>
                )}
                <ul>
                  {def.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <ul className="smk-mengen" aria-label="Kontingente je Monat">
                  {(Object.keys(def.quotas) as Metric[]).map((m) => {
                    const hoechst = Math.max(...PLAN_KEYS.map((k) => PLANS[k].quotas[m]));
                    return (
                      <li key={m}>
                        <span>
                          {def.quotas[m]} × {METRIC_LABELS[m]}
                        </span>
                        <i style={{ "--w": `${Math.round((def.quotas[m] / hoechst) * 100)}%` } as CSSProperties} />
                      </li>
                    );
                  })}
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
                  Preise: {steuerHinweis()}{kleinunternehmer() ? "." : "; die Steuer wird im Checkout berechnet."} Ein gültiger Aktionscode kann im Checkout
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

        <h2 id="autopilot">Demnächst: Autopilot</h2>
        <p className="note">
          Alles inklusive, ohne eigene Zugänge: Anbieterkosten für Text, Stimme und Video sind enthalten. Gleicher
          Funktionsumfang wie Pro und Maxi, die Größen unterscheiden sich nur in der Menge. Geplante Preise, noch nicht
          buchbar. Der Autopilot startet, sobald die KI-Videogeneratoren angebunden sind.
        </p>
        <div
          className="preis-tabelle"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(13rem, 1fr))",
            width: "min(62rem, calc(100vw - 2rem))",
            marginLeft: "50%",
            transform: "translateX(-50%)",
          }}
        >
          {AUTOPILOT.map((a) => (
            <div key={a.name} className="preis-karte">
              <small>Demnächst{a.agency ? " · Agentur" : ""}</small>
              <h3>{a.name}</h3>
              <div className="betrag">
                {a.preis} <span>/ Monat, vorläufig</span>
              </div>
              <ul>
                {a.punkte.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <span className="knopf-link gesperrt" aria-disabled="true">
                Noch nicht buchbar
              </span>
            </div>
          ))}
        </div>
        <p className="note">
          Zusatzpakete (vorläufig, nur auf ausdrücklichen Kauf, nie automatisch): Video-Paket +300 Sekunden 99 €
          einmalig, Premium-Video 4K +60 Sekunden 149 € einmalig, Einrichtungsservice 299 € einmalig ({preisArt() === "Endpreis" ? "Endpreise, keine Umsatzsteuer nach § 19 UStG" : "netto"}).
        </p>

        <div className="hinweis" id="app" style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/apple-touch-icon.png" alt="SECRET 58 App-Symbol" width={72} height={72} style={{ borderRadius: 16 }} />
          <div style={{ flex: "1 1 14rem" }}>
            <strong>Als App installieren</strong>
            <p>Öffnen Sie Social Media KI wie eine App auf Handy oder Computer, ohne App-Store.</p>
          </div>
          <span data-s58-install suppressHydrationWarning />
        </div>

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

      {/* Sprachwahl wie auf der Hauptseite: gleiches Wörterbuch, Übersetzung im Browser, Rechtstexte bleiben deutsch. */}
      <Script src="/zentrale-neu/uebersetzen.js" strategy="afterInteractive" />
      <footer className="fuss">
        <div className="wrap">
          {/* Ohne Prefetch: „/“ ist für Besucher die statische Startseite der Zentrale. */}
          <Link href="/" prefetch={false}>Startseite</Link>
          <Link href="/impressum">Impressum</Link>
          <Link href="/kuendigen">Verträge hier kündigen</Link>
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
