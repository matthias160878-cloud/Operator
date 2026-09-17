const FEATURES = [
  {
    title: "Passt sich an",
    description:
      "Darwin lernt, wie du arbeitest, und passt sich mit der Zeit an — statt dich in einen starren Ablauf zu zwingen.",
  },
  {
    title: "Für echte Aufgaben gemacht",
    description:
      "Planen, ausführen und Aufgaben mit mehreren Schritten zu Ende bringen — nicht nur einzelne Antworten.",
  },
  {
    title: "Standardmäßig transparent",
    description:
      "Jede Aktion ist sichtbar und nachvollziehbar, damit du immer weißt, was sich geändert hat und warum.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-16 px-6 py-32 sm:items-start sm:text-left">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <span className="rounded-full border border-black/[.08] px-3 py-1 text-sm font-medium text-zinc-600 dark:border-white/[.145] dark:text-zinc-400">
            Darwin AI Assistant
          </span>
          <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight text-black sm:text-5xl dark:text-zinc-50">
            Ein Assistent, der sich mit deiner Arbeit weiterentwickelt.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Darwin passt sich deinem Workflow an — nicht umgekehrt.
          </p>
        </div>

        <ul className="grid w-full grid-cols-1 gap-6 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <li
              key={feature.title}
              className="rounded-2xl border border-black/[.08] p-5 text-left dark:border-white/[.145]"
            >
              <h2 className="text-base font-semibold text-black dark:text-zinc-50">
                {feature.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {feature.description}
              </p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
