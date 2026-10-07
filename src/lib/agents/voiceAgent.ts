import { prisma } from "@/lib/db";
import { isElevenLabsConfigured, textToSpeech } from "@/lib/elevenlabs";
import { saveMediaFile } from "@/lib/mediaStorage";

export async function generateVoiceover(input: {
  workspaceId: string;
  contentItemId?: string;
  text: string;
  voiceId?: string;
}): Promise<{ assetId: string; url: string }> {
  if (!isElevenLabsConfigured()) {
    throw new Error(
      "Die Sprachausgabe ist vom Betreiber noch nicht eingerichtet. Es wurde nichts erzeugt und kein Kontingent verbraucht."
    );
  }

  const audio = await textToSpeech(input.text, input.voiceId);
  const filename = `voiceover-${Date.now()}.mp3`;
  const url = await saveMediaFile(input.workspaceId, "audio", filename, audio);

  const asset = await prisma.mediaAsset.create({
    data: {
      workspaceId: input.workspaceId,
      contentItemId: input.contentItemId,
      type: "AUDIO",
      url,
      provider: "elevenlabs",
      format: "mp3",
    },
  });

  return { assetId: asset.id, url };
}
