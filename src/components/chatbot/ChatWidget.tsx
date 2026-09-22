"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Brain, Loader2, Mic, MicOff, Send, Volume2, VolumeX, X } from "lucide-react";
import clsx from "clsx";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface SpeechRecognitionResultLike {
  transcript: string;
}
interface SpeechRecognitionEventLike {
  results: { [index: number]: { [index: number]: SpeechRecognitionResultLike } };
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

const SPEECH_LOCALE: Record<string, string> = {
  de: "de-DE",
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
};

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function ChatWidget() {
  const t = useTranslations("chatbot");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speakEnabled, setSpeakEnabled] = useState(false);
  const [listening, setListening] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const speechSupported = typeof window !== "undefined" && "speechSynthesis" in window;
  const micSupported = getSpeechRecognitionCtor() !== null;

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function speak(text: string) {
    if (!speechSupported || !speakEnabled) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = SPEECH_LOCALE[locale] ?? "de-DE";
    window.speechSynthesis.speak(utterance);
  }

  function toggleListening() {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new Ctor();
    recognition.lang = SPEECH_LOCALE[locale] ?? "de-DE";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  async function sendMessage() {
    const content = input.trim();
    if (!content || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);
    setNotConfigured(false);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, locale }),
      });
      const data = await res.json();

      if (data.notConfigured) {
        setNotConfigured(true);
        return;
      }
      if (!res.ok || !data.reply) {
        throw new Error(data.error ?? t("error"));
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      speak(data.reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 flex h-[32rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
          <div className="flex items-center justify-between border-b border-border bg-surface-2 px-4 py-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-accent-2" />
              <span className="text-sm font-semibold text-foreground">{t("title")}</span>
            </div>
            <div className="flex items-center gap-1">
              {speechSupported && (
                <button
                  type="button"
                  onClick={() => setSpeakEnabled((v) => !v)}
                  aria-label={t("speakToggle")}
                  title={t("speakToggle")}
                  className="rounded p-1 text-muted hover:text-foreground"
                >
                  {speakEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("close")}
                className="rounded p-1 text-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <p className="text-sm text-muted">{t("welcome")}</p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={clsx(
                  "max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm",
                  m.role === "user"
                    ? "ml-auto bg-accent/20 text-foreground"
                    : "bg-surface-2 text-foreground"
                )}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-muted">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("thinking")}
              </div>
            )}
            {notConfigured && (
              <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                {t("notConfigured")}{" "}
                <Link href="/integrations" className="underline">
                  {t("openIntegrations")}
                </Link>
              </div>
            )}
            {error && <p className="text-xs text-danger">{error}</p>}
          </div>

          <div className="flex items-end gap-2 border-t border-border p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              rows={1}
              placeholder={t("inputPlaceholder")}
              className="max-h-24 flex-1 resize-none rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            />
            {micSupported && (
              <button
                type="button"
                onClick={toggleListening}
                aria-label={t("micButton")}
                title={t("micButton")}
                className={clsx(
                  "shrink-0 rounded-lg border border-border p-2",
                  listening ? "bg-danger/20 text-danger" : "text-muted hover:text-foreground"
                )}
              >
                {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            )}
            <button
              type="button"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              aria-label={t("sendButton")}
              className="shrink-0 rounded-lg bg-gradient-to-r from-accent to-accent-3 p-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("openButton")}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-white shadow-[0_0_30px_rgba(109,91,255,0.5)] transition-transform hover:scale-105"
      >
        <Brain className="h-6 w-6" />
      </button>
    </div>
  );
}
