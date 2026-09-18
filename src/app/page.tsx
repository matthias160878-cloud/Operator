const WARUM_DARWIN = [
  {
    title: "Organisiert deinen Tag",
    description:
      "Morgen-Briefing, verschobene Termine, Wetter, was noch offen ist — bevor dein Kaffee kalt wird.",
  },
  {
    title: "Erledigt deine Mails",
    description:
      "Liest, was reingekommen ist, entwirft die Antwort in deinem Ton, sortiert Rechnungen ein — du bestätigst nur noch.",
  },
  {
    title: "Baut Dinge für dich",
    description:
      "Aus der alten Excel-Tabelle voller Makros wird eine saubere App im Browser. Du beschreibst es — er programmiert es.",
  },
];

const EIGENSCHAFTEN = [
  "Läuft lokal auf deinem Rechner — privat",
  "Eigene API-Schlüssel mitbringen",
  "Funktioniert offline",
  "Einmalzahlung — kein Abo",
];

const PREISE = [
  {
    name: "Standard",
    price: "ab 249 €",
    tagline: "Der Darwin, der handelt.",
    features: [
      "E-Mail, Dateien, Kalender und Aufgaben",
      "Zugriff vom Smartphone aus",
      "Drei Helfer mit eigenen Aufgabenbereichen",
      "Lebenslange Updates inklusive",
    ],
  },
  {
    name: "Pro",
    price: "ab 449 €",
    tagline: "Der Darwin ohne Limits.",
    features: [
      "Alles aus Standard",
      "Zwei Aktivierungsschlüssel für ein Zweitgerät",
      "Erweiterte Automatisierungen",
      "Lebenslange Updates inklusive",
    ],
  },
];

const FAQ = [
  {
    frage: "Was ist Darwin und für wen ist es gedacht?",
    antwort:
      "Ein sprachgesteuerter KI-Assistent, der lokal auf deinem eigenen Rechner läuft — für alle, die wiederkehrende Büroarbeit (Mails, Kalender, Dateien) abgeben wollen, ohne ein Abo oder Cloud-Zwang.",
  },
  {
    frage: "Sind meine Daten privat?",
    antwort:
      "Darwin läuft auf deiner eigenen Maschine und nutzt deine eigenen API-Schlüssel. Es gibt keine Pflicht, Daten an einen zentralen Dienst zu schicken.",
  },
  {
    frage: "Brauche ich Internet?",
    antwort:
      "Ein Teil der Funktionen arbeitet offline; für die KI-Antworten wird in der Regel eine Verbindung zum gewählten Sprachmodell benötigt.",
  },
  {
    frage: "Muss ich technisch versiert sein?",
    antwort:
      "Nein. Die Einrichtung ist als geführter Ablauf gedacht — sprechen statt konfigurieren.",
  },
  {
    frage: "Wie funktionieren die Updates?",
    antwort:
      "Einmal kaufen, dauerhaft besitzen: Updates sind im Kaufpreis enthalten, kein wiederkehrendes Abo.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      {/* Hero */}
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 pb-16 pt-32 text-center">
        <span className="rounded-full border border-black/[.08] px-3 py-1 text-sm font-medium text-zinc-600 dark:border-white/[.145] dark:text-zinc-400">
          Darwin AI Assistant
        </span>
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-black sm:text-5xl dark:text-zinc-50">
          Dein KI-Assistent. Auf deinem Desktop.
        </h1>
        <p className="max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Du bist der Chef — sag Darwin einfach, was du brauchst, und er
          erledigt es. Stell dir dein eigenes Team aus KI-Agenten zusammen,
          gib ihnen die Arbeit und sprich einfach mit ihnen. Keine Menüs,
          keine Lernkurve.
        </p>
        <ul className="flex flex-wrap justify-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          {EIGENSCHAFTEN.map((item) => (
            <li
              key={item}
              className="rounded-full border border-black/[.08] px-3 py-1 dark:border-white/[.145]"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Warum Darwin */}
      <section className="mx-auto w-full max-w-3xl px-6 py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Warum Darwin
        </h2>
        <p className="mt-3 max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Du kennst JARVIS aus den Iron-Man-Filmen? Dieser Assistent ist
          echt — und er gehört dir.
        </p>
        <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {WARUM_DARWIN.map((punkt) => (
            <li
              key={punkt.title}
              className="rounded-2xl border border-black/[.08] p-5 dark:border-white/[.145]"
            >
              <h3 className="text-base font-semibold text-black dark:text-zinc-50">
                {punkt.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {punkt.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Preise */}
      <section className="mx-auto w-full max-w-3xl px-6 py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Einmal kaufen. Dauerhaft nutzen.
        </h2>
        <p className="mt-3 max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Kein Abo an uns — Darwin läuft auf deinem eigenen Rechner.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {PREISE.map((tier) => (
            <div
              key={tier.name}
              className="flex flex-col rounded-2xl border border-black/[.08] p-6 dark:border-white/[.145]"
            >
              <h3 className="text-lg font-semibold text-black dark:text-zinc-50">
                {tier.name}
              </h3>
              <p className="mt-1 text-2xl font-semibold text-black dark:text-zinc-50">
                {tier.price}
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {tier.tagline}
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                {tier.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-500">
          Preise und Leistungsumfang zur Orientierung — für ein verbindliches
          Angebot bitte die offizielle Quelle prüfen.
        </p>
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-3xl px-6 pb-32 pt-16">
        <h2 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Häufige Fragen
        </h2>
        <div className="mt-8 divide-y divide-black/[.08] dark:divide-white/[.145]">
          {FAQ.map((eintrag) => (
            <details key={eintrag.frage} className="group py-4">
              <summary className="cursor-pointer list-none text-base font-medium text-black dark:text-zinc-50">
                {eintrag.frage}
              </summary>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {eintrag.antwort}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
