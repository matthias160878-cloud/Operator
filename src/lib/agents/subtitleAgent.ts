/**
 * SubtitleAgent — erzeugt SRT/VTT-Untertitel direkt aus einem Skripttext.
 * Läuft komplett lokal (keine externe API nötig): Sätze werden anhand einer
 * durchschnittlichen Sprechgeschwindigkeit (Wörter/Minute) in Cues mit
 * Zeitstempeln aufgeteilt. Für automatische Transkription aus echtem Audio
 * (Spracherkennung) wäre ein STT-Provider nötig — das ist hier bewusst nicht
 * fest verdrahtet, siehe README-SOCIAL-MEDIA.md.
 */

const WORDS_PER_MINUTE = 150;
const MAX_WORDS_PER_CUE = 10;

export interface SubtitleCue {
  index: number;
  startSeconds: number;
  endSeconds: number;
  text: string;
}

function splitIntoSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
}

function chunkSentence(sentence: string): string[] {
  const words = sentence.split(" ");
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += MAX_WORDS_PER_CUE) {
    chunks.push(words.slice(i, i + MAX_WORDS_PER_CUE).join(" "));
  }
  return chunks.length > 0 ? chunks : [sentence];
}

export function buildSubtitleCues(script: string): SubtitleCue[] {
  const sentences = splitIntoSentences(script);
  const cues: SubtitleCue[] = [];
  let cursor = 0;

  for (const sentence of sentences) {
    for (const chunk of chunkSentence(sentence)) {
      const wordCount = chunk.split(" ").filter(Boolean).length;
      const duration = Math.max(1.2, (wordCount / WORDS_PER_MINUTE) * 60);
      cues.push({
        index: cues.length + 1,
        startSeconds: cursor,
        endSeconds: cursor + duration,
        text: chunk,
      });
      cursor += duration;
    }
  }

  return cues;
}

function formatSrtTime(totalSeconds: number): string {
  const ms = Math.round((totalSeconds % 1) * 1000);
  const totalMs = Math.floor(totalSeconds);
  const h = Math.floor(totalMs / 3600);
  const m = Math.floor((totalMs % 3600) / 60);
  const s = totalMs % 60;
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

function formatVttTime(totalSeconds: number): string {
  return formatSrtTime(totalSeconds).replace(",", ".");
}

export function cuesToSrt(cues: SubtitleCue[]): string {
  return cues
    .map(
      (cue) =>
        `${cue.index}\n${formatSrtTime(cue.startSeconds)} --> ${formatSrtTime(
          cue.endSeconds
        )}\n${cue.text}\n`
    )
    .join("\n");
}

export function cuesToVtt(cues: SubtitleCue[]): string {
  const body = cues
    .map(
      (cue) =>
        `${formatVttTime(cue.startSeconds)} --> ${formatVttTime(cue.endSeconds)}\n${cue.text}\n`
    )
    .join("\n");
  return `WEBVTT\n\n${body}`;
}

export function generateSubtitles(script: string): {
  cues: SubtitleCue[];
  srt: string;
  vtt: string;
} {
  const cues = buildSubtitleCues(script);
  return { cues, srt: cuesToSrt(cues), vtt: cuesToVtt(cues) };
}
