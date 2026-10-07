"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Sparkles } from "lucide-react";
import { GENESIS_EXAMPLES, interpretCommand } from "@/lib/genesis/commands";

/* Minimaltypen der Web Speech API (nicht in lib.dom.d.ts aller TS-Versionen). */
interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type RecognitionCtor = new () => RecognitionLike;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const ERRORS: Record<string, string> = {
  "not-allowed": "Mikrofonzugriff wurde nicht erlaubt. Du kannst ihn in den Browser-Einstellungen freigeben — oder einfach tippen.",
  "service-not-allowed": "Die Spracherkennung ist in diesem Browser gesperrt. Bitte tippe den Befehl.",
  "no-speech": "Ich habe nichts gehört. Versuch es noch einmal oder tippe den Befehl.",
  "audio-capture": "Kein Mikrofon gefunden. Bitte tippe den Befehl.",
  network: "Die Spracherkennung des Browsers ist gerade nicht erreichbar. Bitte tippe den Befehl.",
};

/**
 * Genesis: Sprach- und Textsteuerung für Navigation. Die Stimme ist KEIN
 * Identitätsnachweis — Genesis kann nur, was der angemeldete Kunde ohnehin
 * darf, und löst keine Zahlungen aus. Volle Bedienung per Text und Klick.
 */
export function GenesisAssistant() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const recognitionRef = useRef<RecognitionLike | null>(null);

  // Das Panel wird erst nach einem Klick gerendert, also nur im Browser —
  // daher kein Unterschied zwischen Server- und Client-Darstellung.
  const voiceAvailable = open && Boolean(recognitionCtor()) && window.isSecureContext;

  function run(text: string) {
    const action = interpretCommand(text);
    if (action.type === "navigate" || action.type === "selectPlan") {
      setFeedback(action.label);
      router.push(action.href);
    } else {
      setFeedback(action.message);
    }
  }

  function startVoice() {
    const Ctor = recognitionCtor();
    if (!Ctor || !window.isSecureContext) {
      setFeedback("Spracheingabe ist in diesem Browser oder ohne HTTPS nicht verfügbar. Bitte tippe den Befehl.");
      return;
    }
    const rec = new Ctor();
    rec.lang = "de-DE";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript ?? "";
      setFeedback(`„${transcript}“`);
      run(transcript);
    };
    rec.onerror = (e) => setFeedback(ERRORS[e.error] ?? "Spracherkennung fehlgeschlagen. Bitte tippe den Befehl.");
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    setFeedback("Ich höre zu …");
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("genesis") as HTMLInputElement;
    run(input.value);
    input.value = "";
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-foreground hover:border-accent"
      >
        <Sparkles className="h-4 w-4 text-accent-2" /> Genesis
      </button>
      {open && (
        <div className="fixed inset-x-4 top-16 z-50 rounded-xl border border-border bg-surface p-3 shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[22rem]">
          <form onSubmit={onSubmit} className="flex gap-2">
            <input
              name="genesis"
              autoComplete="off"
              placeholder="z. B. Öffne Schulung"
              aria-label="Genesis-Befehl"
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
            />
            <button
              type="button"
              onClick={() => (listening ? recognitionRef.current?.stop() : startVoice())}
              disabled={!voiceAvailable}
              title={voiceAvailable ? "Sprechen" : "Spracheingabe hier nicht verfügbar"}
              aria-label={listening ? "Zuhören beenden" : "Per Sprache steuern"}
              className="rounded-lg border border-border px-2.5 text-foreground disabled:opacity-40"
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          </form>
          {feedback && <p className="mt-2 text-xs text-foreground" role="status">{feedback}</p>}
          <div className="mt-2 flex flex-wrap gap-1">
            {GENESIS_EXAMPLES.map((ex) => (
              <button key={ex} type="button" onClick={() => run(ex)} className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted hover:text-foreground">
                {ex}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[10px] leading-snug text-muted">
            {voiceAvailable
              ? "Die Spracherkennung übernimmt dein Browser; je nach Browser wird die Aufnahme dafür an dessen Anbieter übertragen. "
              : "Spracheingabe ist in diesem Browser nicht verfügbar (z. B. Firefox) — Text und Klick funktionieren überall. "}
            Genesis navigiert nur und wählt Pakete vor; Käufe bestätigst du selbst.
          </p>
        </div>
      )}
    </div>
  );
}
