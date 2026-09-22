import type { VideoFormat } from "@/lib/video/formats";

/**
 * Austauschbare Video-Provider-Abstraktion (Abschnitt 11). Es ist bewusst
 * noch kein Anbieter fest verdrahtet — sobald ein Provider (z.B. CapCut,
 * eine AI-Video-API) per Env-Key konfiguriert ist, kann er hier als weitere
 * Klasse registriert werden, ohne den Rest der Pipeline (VideoAgent,
 * Content Factory, Content Calendar) anzufassen.
 */
export interface VideoRenderJob {
  script: string;
  format: VideoFormat;
  voiceoverUrl?: string;
  subtitlesUrl?: string;
  brandColors?: string[];
}

export interface VideoRenderResult {
  status: "queued" | "not_configured";
  provider: string;
  message: string;
}

export interface VideoProvider {
  key: string;
  name: string;
  isConfigured(): boolean;
  render(job: VideoRenderJob): Promise<VideoRenderResult>;
}

class CapCutProvider implements VideoProvider {
  key = "capcut";
  name = "CapCut";

  isConfigured(): boolean {
    return Boolean(process.env.CAPCUT_API_KEY);
  }

  async render(): Promise<VideoRenderResult> {
    if (!this.isConfigured()) {
      return {
        status: "not_configured",
        provider: this.name,
        message: "CapCut ist noch nicht konfiguriert (CAPCUT_API_KEY fehlt).",
      };
    }
    // Absichtlich kein echter API-Aufruf implementiert, solange kein Account
    // zum Testen vorhanden ist — siehe Abschnitt 42 ("keine Fake-Integrationen").
    return {
      status: "not_configured",
      provider: this.name,
      message:
        "CapCut-Adapter ist vorbereitet, der eigentliche Render-Aufruf ist noch nicht implementiert.",
    };
  }
}

export const VIDEO_PROVIDERS: VideoProvider[] = [new CapCutProvider()];

export function getConfiguredVideoProvider(): VideoProvider | null {
  return VIDEO_PROVIDERS.find((p) => p.isConfigured()) ?? null;
}
