import { formatForPlatform } from "@/lib/video/formats";
import { VIDEO_PROVIDERS, type VideoRenderResult } from "@/lib/video/provider";

export async function requestVideoRender(input: {
  script: string;
  platform: string;
  voiceoverUrl?: string;
  subtitlesUrl?: string;
}): Promise<VideoRenderResult> {
  const format = formatForPlatform(input.platform);
  const provider = VIDEO_PROVIDERS[0];

  return provider.render({
    script: input.script,
    format,
    voiceoverUrl: input.voiceoverUrl,
    subtitlesUrl: input.subtitlesUrl,
  });
}
