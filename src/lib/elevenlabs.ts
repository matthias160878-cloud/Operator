/**
 * ElevenLabs Voice Engine Adapter (Abschnitt 10 im Master-Prompt).
 * Nutzt ausschließlich Environment Variables, niemals Keys im Code oder Log.
 */

const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

export function isElevenLabsConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY);
}

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category?: string;
  labels?: Record<string, string>;
}

export async function listElevenLabsVoices(): Promise<ElevenLabsVoice[]> {
  if (!isElevenLabsConfigured()) {
    throw new Error("ElevenLabs ist noch nicht konfiguriert.");
  }

  const res = await fetch(`${ELEVENLABS_BASE_URL}/voices`, {
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "" },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      "ElevenLabs konnte nicht erreicht werden. Prüfe API-Key und Verbindung."
    );
  }

  const data = (await res.json()) as { voices: ElevenLabsVoice[] };
  return data.voices;
}

export async function textToSpeech(
  text: string,
  voiceId?: string
): Promise<ArrayBuffer> {
  if (!isElevenLabsConfigured()) {
    throw new Error("ElevenLabs ist noch nicht konfiguriert.");
  }

  const voice = voiceId || process.env.ELEVENLABS_VOICE_ID;
  if (!voice) {
    throw new Error(
      "Keine Voice ID angegeben und ELEVENLABS_VOICE_ID ist nicht gesetzt."
    );
  }

  const res = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${voice}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "",
    },
    body: JSON.stringify({
      text,
      model_id: process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2",
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      "ElevenLabs konnte nicht erreicht werden. Prüfe API-Key und Verbindung."
    );
  }

  return res.arrayBuffer();
}
