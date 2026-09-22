import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { isElevenLabsConfigured } from "@/lib/elevenlabs";
import { VoiceLibrary } from "@/components/voice-studio/VoiceLibrary";

export const dynamic = "force-dynamic";

export default async function VoiceStudioPage() {
  const workspaceId = await getCurrentWorkspaceId();
  const voices = await prisma.voice.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
  const t = await getTranslations("voiceStudio");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </div>
      <VoiceLibrary voices={voices} elevenLabsConfigured={isElevenLabsConfigured()} />
    </div>
  );
}
