"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Volume2, VolumeX } from "lucide-react";
import { LOCALES, LOCALE_LABELS, speechLang, type Locale } from "@/i18n/config";

interface Cue { id: string; start: number; end: number; text: string }

function vttTime(s: number) {
  const ms = Math.round(s * 1000);
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)}.${p(ms % 1000, 3)}`;
}
function toVtt(cues: Cue[]) {
  return "WEBVTT\n\n" + cues.map((c, i) => `${i + 1}\n${vttTime(c.start)} --> ${vttTime(c.end)}\n${c.text}\n`).join("\n");
}

/**
 * Stummes Erklärvideo mit Untertiteln in frei wählbarer Sprache und optionaler
 * Vorlesestimme des Browsers (Web Speech API). Es wird nichts hochgeladen.
 */
export function TrainingVideo({ videoKey, title }: { videoKey: string; title: string }) {
  const t = useTranslations("schulungVideos");
  const uiLocale = useLocale() as Locale;
  const [lang, setLang] = useState<Locale>(uiLocale);
  const [cues, setCues] = useState<Cue[]>([]);
  const [subsOn, setSubsOn] = useState(true);
  const [soundOn, setSoundOn] = useState(false);
  const [voiceMissing, setVoiceMissing] = useState(false);
  const [missingVideo, setMissingVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastCue = useRef<string>("");

  useEffect(() => {
    let alive = true;
    fetch(`/api/schulung/untertitel/${videoKey}/${lang}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { cues: Cue[] }) => { if (alive) { setCues(d.cues); setMissingVideo(false); } })
      .catch(() => { if (alive) { setCues([]); setMissingVideo(true); } });
    return () => { alive = false; };
  }, [videoKey, lang]);

  const vttUrl = useMemo(
    () => (cues.length ? URL.createObjectURL(new Blob([toVtt(cues)], { type: "text/vtt" })) : ""),
    [cues],
  );
  useEffect(() => () => { if (vttUrl) URL.revokeObjectURL(vttUrl); }, [vttUrl]);

  // Untertitel-Spur ein-/ausschalten (native Anzeige, funktioniert auch im Vollbild).
  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    const apply = () => { for (const tr of Array.from(v.textTracks)) tr.mode = subsOn ? "showing" : "disabled"; };
    apply();
    const tl = v.textTracks; tl.addEventListener("addtrack", apply);
    return () => tl.removeEventListener("addtrack", apply);
  }, [subsOn, vttUrl]);

  const speakSupported = typeof window !== "undefined" && "speechSynthesis" in window;
  const speak = useCallback((text: string) => {
    if (!speakSupported) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const tag = speechLang(lang);
    const base = tag.split("-")[0].toLowerCase();
    const voices = synth.getVoices();
    const voice = voices.find((v) => v.lang.toLowerCase() === tag.toLowerCase()) ?? voices.find((v) => v.lang.toLowerCase().startsWith(base));
    setVoiceMissing(voices.length > 0 && !voice);
    if (!voice && voices.length > 0) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice?.lang ?? tag;
    if (voice) u.voice = voice;
    u.rate = 1.02;
    synth.speak(u);
  }, [lang, speakSupported]);

  const onTime = useCallback(() => {
    const v = videoRef.current; if (!v || !soundOn) return;
    const c = cues.find((x) => v.currentTime >= x.start && v.currentTime < x.end);
    if (c && c.id !== lastCue.current) { lastCue.current = c.id; speak(c.text); }
    if (!c) lastCue.current = "";
  }, [cues, soundOn, speak]);

  useEffect(() => { if (!soundOn && speakSupported) window.speechSynthesis.cancel(); lastCue.current = ""; }, [soundOn, lang, speakSupported]);
  useEffect(() => () => { if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);

  const langs = useMemo(() => LOCALES.map((c) => ({ code: c, label: `${LOCALE_LABELS[c].flag} ${LOCALE_LABELS[c].name}` })), []);

  if (missingVideo && !cues.length) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-border bg-surface-2 text-xs text-muted">
        {t("noVideo")}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-black">
        <video
          ref={videoRef}
          controls
          playsInline
          preload="none"
          poster={`/schulung/videos/${videoKey}.jpg`}
          src={`/schulung/videos/${videoKey}.mp4`}
          title={title}
          className="h-full w-full"
          onTimeUpdate={onTime}
          onPause={() => speakSupported && window.speechSynthesis.cancel()}
          onSeeked={() => { lastCue.current = ""; }}
        >
          {vttUrl && <track key={vttUrl} kind="subtitles" srcLang={lang} label={LOCALE_LABELS[lang].name} src={vttUrl} default />}
        </video>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <label className="flex items-center gap-1.5 text-muted">
          {t("subtitlesLabel")}
          <select
            value={subsOn ? lang : "off"}
            onChange={(e) => { if (e.target.value === "off") setSubsOn(false); else { setSubsOn(true); setLang(e.target.value as Locale); } }}
            className="max-w-[11rem] rounded-md border border-border bg-surface-2 px-2 py-1 text-foreground"
          >
            <option value="off">{t("subtitlesOff")}</option>
            {langs.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </label>
        {speakSupported && (
          <button
            type="button"
            onClick={() => setSoundOn((v) => !v)}
            aria-pressed={soundOn}
            className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-muted hover:text-foreground"
          >
            {soundOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            {t("soundLabel")}: {soundOn ? t("soundOn") : t("soundOff")}
          </button>
        )}
      </div>
      {soundOn && <p className="text-[11px] text-muted">{voiceMissing ? t("soundMissing") : t("soundHint")}</p>}
    </div>
  );
}
