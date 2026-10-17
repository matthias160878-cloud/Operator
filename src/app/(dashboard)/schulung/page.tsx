import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, GraduationCap, PartyPopper } from "lucide-react";
import { TrainingVideo } from "@/components/schulung/TrainingVideo";
import { TRAINING_VIDEO_KEYS } from "@/lib/training/videos";
import { TRAINING_TOPICS } from "@/lib/training/topics";

export const dynamic = "force-dynamic";

export default async function SchulungPage({
  searchParams,
}: {
  searchParams: Promise<{ willkommen?: string }>;
}) {
  const t = await getTranslations("schulung");
  const tv = await getTranslations("schulungVideos");
  const { willkommen } = await searchParams;

  return (
    <div className="space-y-5">
      {willkommen && (
        <div className="card flex items-start gap-3 border-accent/40 bg-accent/10 p-4">
          <PartyPopper className="mt-0.5 h-5 w-5 shrink-0 text-accent-2" />
          <div>
            <div className="text-sm font-semibold text-foreground">
              {t("welcomeBanner.title")}
            </div>
            <p className="mt-1 text-sm text-muted">{t("welcomeBanner.body")}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-accent-2" />
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        </div>
      </div>

      <section className="space-y-3" aria-labelledby="erklaervideos">
        <div>
          <h2 id="erklaervideos" className="text-base font-semibold text-foreground">{tv("videosTitle")}</h2>
          <p className="mt-1 text-sm text-muted">{tv("whatLabel")} {tv("draftNote")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {TRAINING_VIDEO_KEYS.map((key) => (
            <div key={key} id={`video-${key}`} className="card scroll-mt-20 space-y-3 p-4">
              <h3 className="text-sm font-semibold text-foreground">{tv(`videos.${key}.title`)}</h3>
              <TrainingVideo videoKey={key} title={tv(`videos.${key}.title`)} />
            </div>
          ))}
        </div>
      </section>

      <div className="space-y-4">
        {TRAINING_TOPICS.map((topic) => (
          <div key={topic.key} className="card p-5">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                {t(`topics.${topic.key}.title`)}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {t(`topics.${topic.key}.description`)}
              </p>
              <div className="mt-3 text-xs font-medium uppercase tracking-wide text-muted">
                {t("stepsLabel")}
              </div>
              <ol className="mt-2 space-y-2 text-sm text-foreground">
                {(t.raw(`topics.${topic.key}.steps`) as string[]).map((step, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="shrink-0 font-mono text-xs text-accent-2">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                {topic.href && (
                  <Link
                    href={topic.href}
                    className="inline-flex items-center gap-1 text-sm text-accent-2 hover:underline"
                  >
                    {t("openPage")} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
                <a
                  href={`#video-${topic.videoKey}`}
                  className="inline-flex items-center gap-1 text-sm text-accent-2 hover:underline"
                >
                  {tv(`videos.${topic.videoKey}.title`)} <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
