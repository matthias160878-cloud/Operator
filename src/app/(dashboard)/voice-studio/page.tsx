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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Voice Studio</h1>
        <p className="mt-1 text-sm text-muted">
          ElevenLabs Voice Engine — Voice Library verwalten, Voiceover-Previews erzeugen und
          Voices importieren.
        </p>
      </div>
      <VoiceLibrary voices={voices} elevenLabsConfigured={isElevenLabsConfigured()} />
    </div>
  );
}
