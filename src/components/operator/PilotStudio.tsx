"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

type Ev = { id: string; actor: string; action: string; detail: string; createdAt: string };
type Inq = {
  id: string; isDemo: boolean; demoCaseNo: number | null; channel: string; receivedAt: string; subject: string; body: string;
  senderName: string; senderContact: string; category: string; assignee: string; status: string; needsHuman: boolean; riskNote: string;
  draftText: string; draftVersion: number; draftSource: string; draftHash: string; approvedVersion: number | null; approvedAt: string | null;
  sendAttempts: number; sentAt: string | null; providerMessageId: string | null; deliveredAt: string | null; lastError: string;
  testMode: string; expected: string; autoCheck: string; manualMinutes: number | null; pilotMinutes: number | null; corrections: number;
  correctionKinds: string; testResult: string; testReason: string; events: Ev[];
};
type Interview = {
  slot: number; firmCode: string; industry: string; channels: string; inquiriesPerWeek: number | null; minutesPerInquiry: number | null;
  topIssues: string; biggestEffort: string; humanDecisions: string; desiredOutcome: string; interest: string; budgetText: string;
  budgetCurrency: string; interviewDate: string; notes: string; nextStep: string; weeklyMinutes: number | null;
};
type State = {
  inquiries: Inq[];
  interviews: Interview[];
  config: { knowledge: string; rules: string; responsibilities: string; checklist: Record<string, boolean> };
  checklist: { key: string; label: string }[];
  overview: {
    doneTests: number; totalTests: number; demoLoaded: number; doneInterviews: number; totalInterviews: number;
    integrations: { name: string; state: string; detail: string }[]; nextSteps: string[];
  };
};

const input = "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none";
const btn = "rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent disabled:opacity-50";
const inputAuto = input.replace("w-full ", "");
const btnMain = "rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-sm text-accent hover:bg-accent/20 disabled:opacity-50";

const STATUS: Record<string, string> = {
  NEU: "Neu", ENTWURF: "Entwurf", PRUEFUNG: "In Prüfung", FREIGEGEBEN: "Freigegeben", UEBERGEBEN: "Übergeben",
  VERSAND_AUSSTEHEND: "Versand ausstehend", VERSENDET: "Versendet", VERSAND_FEHLGESCHLAGEN: "Versand fehlgeschlagen",
  SIMULIERT: "Versand simuliert (Demo)", ABGESCHLOSSEN: "Abgeschlossen",
};
const INTEREST: Record<string, string> = {
  UNGEFRAGT: "ungefragt", KEIN_INTERESSE: "kein Interesse", UNKLAR: "unklar", WEITERES_GESPRAECH: "weiteres Gespräch", PILOT_PRUEFEN: "bezahlten Pilot prüfen",
};
const MODE: Record<string, string> = { DEMO: "Demo-Test", KI: "Test mit echter KI", KANAL: "Test mit angeschlossenem Kanal" };
const TABS = [["ueberblick", "Überblick"], ["anfragen", "Kundenanfragen-Pilot"], ["nachfrage", "Nachfrageprüfung"], ["einrichtung", "Einrichtung"]] as const;
const LEITFADEN = [
  "Welche Anfragen wiederholen sich?",
  "Wie häufig und über welche Kanäle kommen sie?",
  "Wie viel Zeit kostet ihre Bearbeitung?",
  "Wo entstehen Fehler oder Verzögerungen?",
  "Was müsste ein Assistent zuverlässig leisten?",
  "Woran wäre sein Nutzen nach zwei Wochen erkennbar?",
  "Würde der Betrieb einen klar begrenzten bezahlten Pilot prüfen?",
];
const EINSTIEG =
  "Ich bereite bei SECRET 58 einen Assistenten für wiederkehrende Kundenanfragen vor. Bevor ich ihn anbiete, möchte ich verstehen, wo in Ihrem Alltag Aufwand entsteht. Hätten Sie 15 Minuten für ein unverbindliches Gespräch? Es geht zunächst um Ihren Bedarf, nicht um einen Vertragsabschluss.";

function Badge({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "ok" | "warn" | "bad" }) {
  const c = { muted: "border-border text-muted", ok: "border-emerald-500/40 text-emerald-400", warn: "border-amber-500/40 text-amber-400", bad: "border-red-500/40 text-red-400" }[tone];
  return <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${c}`}>{children}</span>;
}

async function call(url: string, method: string, body?: unknown) {
  const res = await fetch(url, { method, headers: body !== undefined ? { "content-type": "application/json" } : {}, body: body !== undefined ? JSON.stringify(body) : undefined });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : `Fehler ${res.status}`);
  return data;
}

export function PilotStudio({ initialTab = "ueberblick" }: { initialTab?: string }) {
  const [tab, setTab] = useState<string>(TABS.some(([k]) => k === initialTab) ? initialTab : "ueberblick");
  const [st, setSt] = useState<State | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/operator/pilotstudio", { cache: "no-store" });
      if (!r.ok) throw new Error(`Laden fehlgeschlagen (${r.status}).`);
      setSt((await r.json()) as State);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Laden fehlgeschlagen.");
    }
  }, []);
  useEffect(() => {
    let alive = true;
    fetch("/api/operator/pilotstudio", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Laden fehlgeschlagen (${r.status}).`);
        const data = (await r.json()) as State;
        if (alive) setSt(data);
      })
      .catch((e: unknown) => alive && setErr(e instanceof Error ? e.message : "Laden fehlgeschlagen."));
    return () => {
      alive = false;
    };
  }, []);

  const run = useCallback(async (fn: () => Promise<unknown>, ok?: string) => {
    setBusy(true); setErr(null); setMsg(null);
    try {
      await fn();
      if (ok) setMsg(ok);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Fehler.");
      await load();
    } finally {
      setBusy(false);
    }
  }, [load]);

  const choose = (k: string) => {
    setTab(k);
    const u = new URL(window.location.href); u.searchParams.set("tab", k); window.history.replaceState(null, "", u);
  };

  if (!st) return <div className="card p-6 text-sm text-muted">{err ?? <><Loader2 className="inline h-4 w-4 animate-spin" /> Lädt …</>}</div>;

  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap gap-2" aria-label="Pilotstudio">
        {TABS.map(([k, label]) => (
          <button key={k} onClick={() => choose(k)} className={k === tab ? btnMain : btn} aria-current={k === tab ? "page" : undefined}>{label}</button>
        ))}
      </nav>
      {(err || msg) && <div role="status" className={`card p-3 text-sm ${err ? "text-red-400" : "text-emerald-400"}`}>{err ?? msg}</div>}
      {tab === "ueberblick" && <Overview st={st} go={choose} />}
      {tab === "anfragen" && <Inquiries st={st} run={run} busy={busy} />}
      {tab === "nachfrage" && <Demand st={st} run={run} busy={busy} />}
      {tab === "einrichtung" && <Setup st={st} run={run} busy={busy} />}
    </div>
  );
}

function Overview({ st, go }: { st: State; go: (k: string) => void }) {
  const o = st.overview;
  const tone = (s: string) => (s.startsWith("live") ? "ok" : s === "vorbereitet" ? "warn" : "bad") as "ok" | "warn" | "bad";
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <button onClick={() => go("anfragen")} className="card p-4 text-left">
          <div className="text-xs text-muted">Bearbeitete Testfälle</div>
          <div className="text-2xl font-semibold text-foreground">{o.doneTests} von {o.totalTests}</div>
          <div className="text-xs text-muted">{o.demoLoaded ? "mit Ergebnis bewertet" : "Beispieldaten noch nicht geladen"}</div>
        </button>
        <button onClick={() => go("nachfrage")} className="card p-4 text-left">
          <div className="text-xs text-muted">Erfasste Bedarfsgespräche</div>
          <div className="text-2xl font-semibold text-foreground">{o.doneInterviews} von {o.totalInterviews}</div>
          <div className="text-xs text-muted">Keine repräsentative Marktstudie</div>
        </button>
        <div className="card p-4">
          <div className="text-xs text-muted">Kennzeichnung</div>
          <div className="mt-1 flex flex-wrap gap-1"><Badge>Demo</Badge><Badge tone="warn">vorbereitet</Badge><Badge tone="ok">live</Badge></div>
          <div className="mt-1 text-xs text-muted">Demo = feste Musterantworten, kein Versand.</div>
        </div>
      </div>
      <section className="card p-4">
        <h2 className="text-sm font-semibold text-foreground">Verbindungsstatus (tatsächlich geprüfte Konfiguration)</h2>
        <ul className="mt-2 space-y-2">
          {o.integrations.map((i) => (
            <li key={i.name} className="flex flex-wrap items-start justify-between gap-2 text-sm">
              <span className="text-foreground">{i.name}<br /><span className="text-xs text-muted">{i.detail}</span></span>
              <Badge tone={tone(i.state)}>{i.state}</Badge>
            </li>
          ))}
        </ul>
      </section>
      <section className="card p-4">
        <h2 className="text-sm font-semibold text-foreground">Nächste offene Einrichtungsschritte</h2>
        {o.nextSteps.length ? <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted">{o.nextSteps.slice(0, 5).map((s) => <li key={s}>{s}</li>)}</ol> : <p className="mt-2 text-sm text-muted">Alle Punkte der Checkliste sind abgehakt.</p>}
      </section>
    </div>
  );
}

function Inquiries({ st, run, busy }: { st: State; run: (fn: () => Promise<unknown>, ok?: string) => Promise<void>; busy: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  const [form, setForm] = useState({ subject: "", body: "", channel: "E-Mail", senderName: "", senderContact: "" });
  const [filter, setFilter] = useState<"alle" | "demo" | "echt">("alle");
  const list = st.inquiries.filter((i) => filter === "alle" || (filter === "demo" ? i.isDemo : !i.isDemo));
  const sel = st.inquiries.find((i) => i.id === open) ?? null;
  const openedAt = useRef<Record<string, number>>({});
  const openCase = (id: string | null) => setOpen(id);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {!st.overview.demoLoaded ? (
          <button className={btnMain} disabled={busy} onClick={() => run(() => call("/api/operator/pilotstudio", "POST", { action: "demo" }), "Zehn Testanfragen geladen.")}>10 Testanfragen laden (Demo)</button>
        ) : (
          <button className={btn} disabled={busy} onClick={() => { if (confirm("Alle Demo-Testfälle samt Ergebnissen zurücksetzen? Echte Anfragen bleiben erhalten.")) void run(() => call("/api/operator/pilotstudio", "POST", { action: "demo-zuruecksetzen", confirmed: true }), "Testfälle zurückgesetzt."); }}>Testfälle zurücksetzen</button>
        )}
        <button className={btn} disabled={busy} onClick={() => run(async () => { const r = await call("/api/operator/pilotstudio", "POST", { action: "webseite-uebernehmen" }); return r; }, "Kontaktformular-Anfragen geprüft und neue übernommen.")}>Anfragen aus Kontaktformular übernehmen</button>
        <select className={inputAuto} value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} aria-label="Filter">
          <option value="alle">Alle</option><option value="demo">Nur Demo-Fälle</option><option value="echt">Nur Echtfälle</option>
        </select>
      </div>

      <details className="card p-4">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">Anfrage manuell erfassen (Echtfall)</summary>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input className={input} placeholder="Betreff" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} maxLength={200} />
          <select className={input} value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} aria-label="Kanal">
            {["E-Mail", "Webformular", "Chat", "Telefon", "manuell"].map((c) => <option key={c}>{c}</option>)}
          </select>
          <input className={input} placeholder="Absender (Name)" value={form.senderName} onChange={(e) => setForm({ ...form, senderName: e.target.value })} maxLength={120} />
          <input className={input} placeholder="Kontakt (E-Mail, nur für späteren Versand)" value={form.senderContact} onChange={(e) => setForm({ ...form, senderContact: e.target.value })} maxLength={200} />
          <textarea className={`${input} sm:col-span-2`} rows={4} placeholder="Nachricht" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} maxLength={8000} />
        </div>
        <button className={`${btnMain} mt-2`} disabled={busy || !form.subject.trim() || !form.body.trim()} onClick={() => run(async () => { await call("/api/operator/pilotstudio", "POST", { action: "anfrage", data: form }); setForm({ subject: "", body: "", channel: "E-Mail", senderName: "", senderContact: "" }); }, "Anfrage erfasst und eingeordnet.")}>Erfassen</button>
      </details>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs text-muted"><tr><th className="p-2">Fall</th><th className="p-2">Betreff</th><th className="p-2">Kategorie</th><th className="p-2">Status</th><th className="p-2">Test</th></tr></thead>
          <tbody>
            {list.map((i) => (
              <tr key={i.id} className={`cursor-pointer border-t border-border ${open === i.id ? "bg-accent/5" : ""}`} onClick={() => openCase(open === i.id ? null : i.id)}>
                <td className="p-2">{i.isDemo ? <Badge>Demo {i.demoCaseNo}</Badge> : <Badge tone="warn">Echtfall</Badge>}</td>
                <td className="p-2 text-foreground">{i.subject}{i.needsHuman && <span className="ml-1 text-xs text-amber-400">· Mensch prüft</span>}</td>
                <td className="p-2 text-muted">{i.category}</td>
                <td className="p-2"><Badge tone={i.status === "VERSAND_FEHLGESCHLAGEN" ? "bad" : ["FREIGEGEBEN", "VERSENDET"].includes(i.status) ? "ok" : "muted"}>{STATUS[i.status] ?? i.status}</Badge></td>
                <td className="p-2"><Badge tone={i.testResult === "BESTANDEN" ? "ok" : i.testResult === "NICHT_BESTANDEN" ? "bad" : "muted"}>{i.testResult === "OFFEN" ? "offen" : i.testResult === "BESTANDEN" ? "bestanden" : "nicht bestanden"}</Badge></td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={5} className="p-3 text-muted">Noch keine Anfragen. Laden Sie die Testanfragen oder erfassen Sie eine Anfrage.</td></tr>}
          </tbody>
        </table>
      </div>
      {sel && <Detail key={sel.id + sel.draftVersion + sel.status} inq={sel} run={run} busy={busy} openedAt={openedAt} />}
    </div>
  );
}

function Detail({ inq, run, busy, openedAt }: { inq: Inq; run: (fn: () => Promise<unknown>, ok?: string) => Promise<void>; busy: boolean; openedAt: React.RefObject<Record<string, number>> }) {
  const url = `/api/operator/pilotstudio/anfragen/${inq.id}`;
  const [text, setText] = useState(inq.draftText);
  const [kind, setKind] = useState("");
  const [assignee, setAssignee] = useState(inq.assignee);
  const [note, setNote] = useState("");
  const [ev, setEv] = useState({ manualMinutes: inq.manualMinutes ?? "", pilotMinutes: inq.pilotMinutes ?? "", corrections: inq.corrections, correctionKinds: inq.correctionKinds, testResult: inq.testResult, testReason: inq.testReason, testMode: inq.testMode });
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const start = (openedAt.current[inq.id] ??= Date.now());
    const tick = () => setSecs(Math.round((Date.now() - start) / 1000));
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [inq.id, openedAt]);
  const locked = ["VERSAND_AUSSTEHEND", "VERSENDET", "SIMULIERT", "ABGESCHLOSSEN"].includes(inq.status);
  const dirty = text !== inq.draftText;
  const approved = inq.approvedVersion != null && inq.approvedVersion === inq.draftVersion;
  const num = (v: string | number) => (v === "" ? null : Number(v));
  return (
    <section className="card space-y-4 p-4" aria-label="Anfrage bearbeiten">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold text-foreground">{inq.subject}</h2>
        {inq.isDemo ? <Badge>Demo-Testfall {inq.demoCaseNo} – erfunden</Badge> : <Badge tone="warn">Echtfall</Badge>}
        <Badge>{inq.channel}</Badge><Badge>{new Date(inq.receivedAt).toLocaleString("de-DE")}</Badge>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2 text-sm">
          <div className="text-xs uppercase tracking-wide text-muted">Eingang (nicht vertrauenswürdiger Inhalt)</div>
          <p className="whitespace-pre-wrap rounded-lg border border-border bg-surface-2 p-3 text-foreground">{inq.body}</p>
          <p className="text-xs text-muted">Von: {inq.senderName || "—"}{inq.senderContact ? ` · ${inq.senderContact}` : ""}</p>
          <p className="text-xs text-muted">Einordnung: <b className="text-foreground">{inq.category}</b>{inq.needsHuman ? " · menschliche Prüfung nötig" : ""}{inq.riskNote ? ` · ${inq.riskNote}` : ""}</p>
          {inq.expected && <p className="text-xs text-muted">Erwartetes Verhalten: <b className="text-foreground">{inq.expected}</b></p>}
          {inq.lastError && <p className="text-xs text-red-400">Letzter Fehler: {inq.lastError}</p>}
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs uppercase tracking-wide text-muted">Antwortentwurf {inq.draftVersion ? `· Version ${inq.draftVersion}` : ""} {inq.draftSource.startsWith("DEMO") && <Badge>Musterantwort (Demo)</Badge>}{inq.draftSource.startsWith("KI") && <Badge tone="warn">KI-Entwurf</Badge>}</span>
            <span className="flex flex-wrap gap-1">
              <button className={btn} disabled={busy || locked} onClick={() => run(() => call(url, "POST", { action: "entwurf-demo" }), "Musterantwort eingesetzt.")}>Musterantwort</button>
              <button className={btn} disabled={busy || locked} onClick={() => run(() => call(url, "POST", { action: "entwurf-ki" }), "KI-Entwurf erstellt – bitte prüfen.")}>KI-Entwurf</button>
            </span>
          </div>
          <textarea className={input} rows={10} value={text} onChange={(e) => setText(e.target.value)} disabled={locked} aria-label="Antworttext" maxLength={4000} />
          {dirty && (
            <div className="flex flex-wrap items-center gap-2">
              <select className={inputAuto} value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Art der Korrektur">
                <option value="">Art der Korrektur …</option>
                {["Ton", "Inhalt falsch", "Rückfrage ergänzt", "Zusage entfernt", "Kürzung", "Sonstiges"].map((k) => <option key={k}>{k}</option>)}
              </select>
              <button className={btnMain} disabled={busy} onClick={() => run(() => call(url, "POST", { action: "bearbeiten", text, kind }), approved ? "Gespeichert – vorherige Freigabe aufgehoben." : "Gespeichert.")}>Änderung speichern</button>
              {approved && <span className="text-xs text-amber-400">Speichern hebt die Freigabe auf.</span>}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={approved ? "ok" : "muted"}>{approved ? `Freigegeben (Version ${inq.approvedVersion})` : "Nicht freigegeben"}</Badge>
            <Badge tone={inq.status === "VERSAND_FEHLGESCHLAGEN" ? "bad" : "muted"}>{STATUS[inq.status] ?? inq.status}</Badge>
            {inq.sentAt && <span className="text-xs text-muted">Vom Versanddienst angenommen {new Date(inq.sentAt).toLocaleString("de-DE")} · Zustellung {inq.deliveredAt ? "nachgewiesen" : "nicht nachgewiesen"}</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={btnMain} disabled={busy || locked || dirty || !inq.draftText || approved} onClick={() => run(() => call(url, "POST", { action: "freigeben", version: inq.draftVersion, textHash: inq.draftHash }), "Freigegeben.")}>Diese Fassung freigeben</button>
            <button className={btnMain} disabled={busy || !approved || !["FREIGEGEBEN", "VERSAND_FEHLGESCHLAGEN"].includes(inq.status)} onClick={() => { if (inq.isDemo || confirm(`Antwort jetzt wirklich an ${inq.senderContact} senden?`)) void run(() => call(url, "POST", { action: "versenden" }), inq.isDemo ? "Versand simuliert – nichts wurde versendet." : "Versand ausgeführt."); }}>{inq.isDemo ? "Versand simulieren" : inq.status === "VERSAND_FEHLGESCHLAGEN" ? "Versand wiederholen" : "Versenden"}</button>
            <button className={btn} disabled={busy || inq.status === "VERSAND_AUSSTEHEND"} onClick={() => run(() => call(url, "POST", { action: "abschliessen" }), "Abgeschlossen.")}>Abschließen</button>
          </div>
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input className={input} placeholder="Zuständige Person" value={assignee} onChange={(e) => setAssignee(e.target.value)} maxLength={120} />
            <input className={input} placeholder="Notiz zur Übergabe" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
            <button className={btn} disabled={busy || locked || !assignee.trim()} onClick={() => run(() => call(url, "POST", { action: "uebergeben", assignee, note }), inq.isDemo ? "Übergabe simuliert." : "Übergeben.")}>Übergeben</button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">Testprotokoll</h3>
          <span className="text-xs text-muted">Stoppuhr seit Öffnen: {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")} <button className="underline" onClick={() => setEv({ ...ev, pilotMinutes: Math.max(0.1, Math.round(secs / 6) / 10) })}>als Pilotzeit übernehmen</button></span>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <label className="text-xs text-muted">Testart<select className={input} value={ev.testMode} onChange={(e) => setEv({ ...ev, testMode: e.target.value })}>{Object.entries(MODE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label className="text-xs text-muted">Manuelle Vergleichszeit (Min.)<input className={input} type="number" min={0} step="0.1" value={ev.manualMinutes} onChange={(e) => setEv({ ...ev, manualMinutes: e.target.value })} /></label>
          <label className="text-xs text-muted">Pilot-Bearbeitungszeit (Min.)<input className={input} type="number" min={0} step="0.1" value={ev.pilotMinutes} onChange={(e) => setEv({ ...ev, pilotMinutes: e.target.value })} /></label>
          <label className="text-xs text-muted">Anzahl Korrekturen<input className={input} type="number" min={0} value={ev.corrections} onChange={(e) => setEv({ ...ev, corrections: Number(e.target.value) })} /></label>
          <label className="text-xs text-muted sm:col-span-2">Art der Korrekturen<input className={input} value={ev.correctionKinds} onChange={(e) => setEv({ ...ev, correctionKinds: e.target.value })} maxLength={300} /></label>
          <label className="text-xs text-muted">Ergebnis<select className={input} value={ev.testResult} onChange={(e) => setEv({ ...ev, testResult: e.target.value })}><option value="OFFEN">offen</option><option value="BESTANDEN">bestanden</option><option value="NICHT_BESTANDEN">nicht bestanden</option></select></label>
          <label className="text-xs text-muted sm:col-span-2">Begründung<input className={input} value={ev.testReason} onChange={(e) => setEv({ ...ev, testReason: e.target.value })} maxLength={2000} /></label>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button className={btnMain} disabled={busy} onClick={() => run(() => call(url, "POST", { action: "auswertung", data: { ...ev, manualMinutes: num(ev.manualMinutes), pilotMinutes: num(ev.pilotMinutes) } }), "Testprotokoll gespeichert.")}>Testprotokoll speichern</button>
          {inq.demoCaseNo && <button className={btn} disabled={busy} onClick={() => run(() => call(url, "POST", { action: "autopruefung" }), "Automatische Prüfung ausgeführt.")}>Prüfkriterium automatisch prüfen</button>}
          {inq.autoCheck && <span className="text-xs text-muted">{inq.autoCheck}</span>}
        </div>
      </div>

      <details>
        <summary className="cursor-pointer text-sm text-foreground">Protokoll ({inq.events.length})</summary>
        <ul className="mt-2 space-y-1 text-xs text-muted">
          {inq.events.map((e) => <li key={e.id}>{new Date(e.createdAt).toLocaleString("de-DE")} · {e.actor} · <b className="text-foreground">{e.action}</b>{e.detail ? ` – ${e.detail}` : ""}</li>)}
        </ul>
      </details>
    </section>
  );
}

function Demand({ st, run, busy }: { st: State; run: (fn: () => Promise<unknown>, ok?: string) => Promise<void>; busy: boolean }) {
  const [slot, setSlot] = useState(1);
  const r = st.interviews.find((x) => x.slot === slot)!;
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-4">
      <section className="card p-4">
        <h2 className="text-sm font-semibold text-foreground">Gesprächsleitfaden</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted">{LEITFADEN.map((q) => <li key={q}>{q}</li>)}</ol>
        <div className="mt-3 rounded-lg border border-border bg-surface-2 p-3 text-sm text-foreground">{EINSTIEG}</div>
        <button className={`${btn} mt-2`} onClick={async () => { try { await navigator.clipboard.writeText(EINSTIEG); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* Zwischenablage nicht verfügbar */ } }}>{copied ? "Kopiert" : "Gesprächseinstieg kopieren"}</button>
        <p className="mt-2 text-xs text-muted">Kontakte werden nicht automatisch angeschrieben. Das Gespräch führen Sie selbst.</p>
      </section>
      <div className="flex flex-wrap gap-2">{st.interviews.map((x) => <button key={x.slot} className={x.slot === slot ? btnMain : btn} onClick={() => setSlot(x.slot)}>Gespräch {x.slot}{x.firmCode ? ` · ${x.firmCode}` : ""}</button>)}</div>
      <InterviewForm key={slot + r.firmCode + r.notes.length} r={r} run={run} busy={busy} />
      <section className="card overflow-x-auto p-4">
        <h2 className="text-sm font-semibold text-foreground">Vergleich der fünf Gespräche</h2>
        <table className="mt-2 w-full min-w-[720px] text-left text-xs">
          <thead className="text-muted"><tr><th className="p-1">Nr.</th><th className="p-1">Kürzel / Branche</th><th className="p-1">Kanäle</th><th className="p-1">Anfragen/Woche</th><th className="p-1">Min./Anfrage</th><th className="p-1">Heutiger Aufwand/Woche</th><th className="p-1">Interesse</th><th className="p-1">Budgetrahmen (Angabe Betrieb)</th><th className="p-1">Nächster Schritt</th></tr></thead>
          <tbody>
            {st.interviews.map((x) => (
              <tr key={x.slot} className="border-t border-border text-foreground">
                <td className="p-1">{x.slot}</td><td className="p-1">{x.firmCode || "—"} {x.industry && `/ ${x.industry}`}</td><td className="p-1">{x.channels || "nicht erhoben"}</td>
                <td className="p-1">{x.inquiriesPerWeek ?? "nicht erhoben"}</td><td className="p-1">{x.minutesPerInquiry ?? "nicht erhoben"}</td>
                <td className="p-1">{x.weeklyMinutes != null ? `${x.weeklyMinutes} Min. (≈ ${(x.weeklyMinutes / 60).toFixed(1).replace(".", ",")} Std.)` : "nicht erhoben"}</td>
                <td className="p-1">{INTEREST[x.interest]}</td><td className="p-1">{x.budgetText ? `${x.budgetText} ${x.budgetCurrency}` : "nicht erhoben"}</td><td className="p-1">{x.nextStep || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-muted">Der Aufwand ist der heutige Zeitaufwand laut Angabe des Betriebs (Anfragen × Minuten), keine garantierte Einsparung. Interesse ist kein Auftrag und kein zugesagter Umsatz. Fünf Gespräche sind keine repräsentative Marktstudie.</p>
      </section>
    </div>
  );
}

function InterviewForm({ r, run, busy }: { r: Interview; run: (fn: () => Promise<unknown>, ok?: string) => Promise<void>; busy: boolean }) {
  const [f, setF] = useState({ ...r, inquiriesPerWeek: r.inquiriesPerWeek ?? "", minutesPerInquiry: r.minutesPerInquiry ?? "" });
  const set = (k: string, v: string) => setF({ ...f, [k]: v });
  const T = (k: keyof Interview, label: string, rows = 2) => <label className="text-xs text-muted sm:col-span-2">{label}<textarea className={input} rows={rows} value={String(f[k] ?? "")} onChange={(e) => set(k, e.target.value)} /></label>;
  const I = (k: keyof Interview, label: string, extra: Record<string, unknown> = {}) => <label className="text-xs text-muted">{label}<input className={input} value={String(f[k] ?? "")} onChange={(e) => set(k, e.target.value)} {...extra} /></label>;
  return (
    <section className="card p-4">
      <h2 className="text-sm font-semibold text-foreground">Gespräch {r.slot}</h2>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {I("firmCode", "Anonymes Firmenkürzel", { maxLength: 40, placeholder: "z. B. KMU-A" })}
        {I("industry", "Branche", { maxLength: 120 })}
        {I("channels", "Eingangskanäle", { maxLength: 300, placeholder: "E-Mail, Telefon, …" })}
        {I("interviewDate", "Gesprächsdatum", { type: "date" })}
        {I("inquiriesPerWeek", "Anfragen pro Woche", { type: "number", min: 0, step: "1" })}
        {I("minutesPerInquiry", "Durchschnittliche Minuten je Anfrage", { type: "number", min: 0, step: "0.5" })}
        {T("topIssues", "Häufigste wiederkehrende Anliegen")}
        {T("biggestEffort", "Größter Aufwand")}
        {T("humanDecisions", "Entscheidungen, die immer ein Mensch treffen soll")}
        {T("desiredOutcome", "Gewünschtes messbares Ergebnis eines zweiwöchigen Piloten")}
        <label className="text-xs text-muted">Interesse<select className={input} value={f.interest} onChange={(e) => set("interest", e.target.value)}>{Object.entries(INTEREST).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <div className="grid grid-cols-3 gap-2">
          <label className="col-span-2 text-xs text-muted">Vom Betrieb genannter Budgetrahmen<input className={input} value={f.budgetText} onChange={(e) => set("budgetText", e.target.value)} maxLength={200} /></label>
          <label className="text-xs text-muted">Währung<input className={input} value={f.budgetCurrency} onChange={(e) => set("budgetCurrency", e.target.value.toUpperCase())} maxLength={3} placeholder="EUR" /></label>
        </div>
        {T("notes", "Notizen", 4)}
        {I("nextStep", "Vereinbarter nächster Schritt", { maxLength: 1000 })}
      </div>
      <button className={`${btnMain} mt-2`} disabled={busy} onClick={() => run(() => call(`/api/operator/pilotstudio/gespraeche/${r.slot}`, "PUT", {
        ...f, weeklyMinutes: undefined, slot: undefined,
        inquiriesPerWeek: f.inquiriesPerWeek === "" ? null : Number(f.inquiriesPerWeek),
        minutesPerInquiry: f.minutesPerInquiry === "" ? null : Number(f.minutesPerInquiry),
      }), `Gespräch ${r.slot} gespeichert.`)}>Gespräch speichern</button>
    </section>
  );
}

function Setup({ st, run, busy }: { st: State; run: (fn: () => Promise<unknown>, ok?: string) => Promise<void>; busy: boolean }) {
  const [c, setC] = useState(st.config);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"ergaenzen" | "ueberschreiben">("ergaenzen");
  const done = useMemo(() => st.checklist.filter((x) => c.checklist[x.key]).length, [c, st.checklist]);
  async function doImport(file: File) {
    if (file.size > 3_000_000) throw new Error("Datei zu groß (max. 3 MB).");
    let data: unknown;
    try { data = JSON.parse(await file.text()); } catch { throw new Error("Die Datei ist kein gültiges JSON."); }
    let confirmed = false;
    if (mode === "ueberschreiben") {
      confirmed = confirm("Überschreiben löscht alle vorhandenen Anfragen im Pilotstudio (Demo und Echtfälle) und ersetzt sie durch die Datei. Fortfahren?");
      if (!confirmed) throw new Error("Import abgebrochen – nichts geändert.");
    }
    await call("/api/operator/pilotstudio/import", "POST", { mode, confirmed, data });
  }
  return (
    <div className="space-y-4">
      <section className="card p-4">
        <h2 className="text-sm font-semibold text-foreground">Anbindungen</h2>
        <ul className="mt-2 space-y-1 text-sm">{st.overview.integrations.map((i) => <li key={i.name} className="text-muted"><b className="text-foreground">{i.name}:</b> {i.state} – {i.detail}</li>)}</ul>
        <p className="mt-2 text-xs text-muted">Schlüssel werden nur in den Server-Einstellungen (Render → Environment) eingetragen, nie hier. Siehe docs/PILOTSTUDIO.md.</p>
      </section>
      <section className="card space-y-2 p-4">
        <h2 className="text-sm font-semibold text-foreground">Wissensquellen und Antwortregeln</h2>
        <label className="block text-xs text-muted">Freigegebene Unternehmensinformationen (nur diese nutzt die KI)<textarea className={input} rows={6} value={c.knowledge} onChange={(e) => setC({ ...c, knowledge: e.target.value })} maxLength={20000} /></label>
        <label className="block text-xs text-muted">Antwortregeln (z. B. was nie zugesagt wird)<textarea className={input} rows={4} value={c.rules} onChange={(e) => setC({ ...c, rules: e.target.value })} maxLength={8000} /></label>
        <label className="block text-xs text-muted">Zuständigkeiten und Freigaben (wer prüft Zahlung, Datenschutz, Verträge)<textarea className={input} rows={3} value={c.responsibilities} onChange={(e) => setC({ ...c, responsibilities: e.target.value })} maxLength={4000} /></label>
      </section>
      <section className="card p-4">
        <h2 className="text-sm font-semibold text-foreground">Checkliste Live-Aktivierung ({done}/{st.checklist.length})</h2>
        <ul className="mt-2 space-y-1">
          {st.checklist.map((x) => (
            <li key={x.key}><label className="flex items-start gap-2 text-sm text-foreground"><input type="checkbox" className="mt-1" checked={!!c.checklist[x.key]} onChange={(e) => setC({ ...c, checklist: { ...c.checklist, [x.key]: e.target.checked } })} />{x.label}</label></li>
          ))}
        </ul>
        <button className={`${btnMain} mt-3`} disabled={busy} onClick={() => run(() => call("/api/operator/pilotstudio", "POST", { action: "einrichtung", data: c }), "Einrichtung gespeichert.")}>Einrichtung speichern</button>
      </section>
      <section className="card p-4">
        <h2 className="text-sm font-semibold text-foreground">Export und Import</h2>
        <p className="mt-1 text-xs text-muted">Export enthält Anfragen, Testprotokolle, Gespräche und Einrichtung – keine Schlüssel. Beim Import werden Freigaben und Versandstatus nie übernommen.</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <a className={btn} href="/api/operator/pilotstudio/export">Export herunterladen (JSON)</a>
          <select className={inputAuto} value={mode} onChange={(e) => setMode(e.target.value as typeof mode)} aria-label="Importmodus"><option value="ergaenzen">Import: ergänzen</option><option value="ueberschreiben">Import: überschreiben</option></select>
          <button className={btn} disabled={busy} onClick={() => fileRef.current?.click()}>JSON importieren …</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void run(() => doImport(file), "Import abgeschlossen."); }} />
        </div>
      </section>
    </div>
  );
}
