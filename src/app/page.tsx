const FEATURES = [
  {
    title: "Adaptive by design",
    description:
      "Darwin learns the shape of your work and adjusts its behavior over time, instead of forcing you into a fixed workflow.",
  },
  {
    title: "Built for real tasks",
    description:
      "Plan, execute, and follow through on multi-step work — not just single-shot answers.",
  },
  {
    title: "Transparent by default",
    description:
      "Every action is visible and reviewable, so you always know what changed and why.",
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
            An assistant that evolves with how you work.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Darwin adapts to your workflow instead of the other way around.
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
