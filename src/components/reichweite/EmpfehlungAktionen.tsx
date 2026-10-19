"use client";

import { useState } from "react";
import { TeilenBereich } from "@/components/reichweite/TeilenBereich";

const feld = "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted";

/** Öffentlich: eigenen Empfehlungslink ausdrücklich erzeugen. */
export function EigenerLink({ code, titel, texte, darfErzeugen }: { code: string; titel: string; texte: string[]; darfErzeugen: boolean }) {
  const [neu, setNeu] = useState<{ url: string } | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);

  async function erzeugen() {
    setLaedt(true);
    setFehler(null);
    const res = await fetch(`/api/empfehlung/${code}/link`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setLaedt(false);
    if (!res.ok) return setFehler(data.error ?? "Link konnte nicht erzeugt werden.");
    setNeu({ url: data.url });
  }

  if (neu) {
    return (
      <div className="space-y-2" data-testid="eigener-link">
        <p className="text-sm text-foreground">Dein eigener Empfehlungslink ist bereit. Er enthält keine Angaben zu dir.</p>
        <TeilenBereich url={neu.url} titel={titel} texte={texte} />
      </div>
    );
  }
  if (!darfErzeugen) {
    return <p className="text-xs text-muted">Du kannst diesen Link einfach weitergeben.</p>;
  }
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted">
        Optional: Erzeuge einen eigenen Link, damit sichtbar wird, dass deine Empfehlung angekommen ist. Es werden keine Angaben zu dir gespeichert –
        du kannst den Link oben auch einfach so weitergeben.
      </p>
      <button
        type="button"
        onClick={erzeugen}
        disabled={laedt}
        className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 py-2 text-sm text-foreground disabled:opacity-60"
      >
        {laedt ? "Wird erzeugt …" : "Eigenen Empfehlungslink erzeugen"}
      </button>
      {fehler && <p className="text-xs text-danger">{fehler}</p>}
    </div>
  );
}

/** Öffentlich: Anfrage-Formular mit Einwilligung. */
export function AnfrageFormular({ code }: { code: string }) {
  const [gesendet, setGesendet] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);

  async function senden(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setLaedt(true);
    setFehler(null);
    const res = await fetch(`/api/empfehlung/${code}/anfrage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: f.get("name") ?? "",
        kontakt: f.get("kontakt") ?? "",
        nachricht: f.get("nachricht") ?? "",
        einwilligung: f.get("einwilligung") === "on",
        website: f.get("website") ?? "",
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLaedt(false);
    if (!res.ok) return setFehler(data.error ?? "Anfrage konnte nicht gesendet werden.");
    setGesendet(true);
  }

  if (gesendet) return <p className="text-sm text-foreground" data-testid="anfrage-ok">Danke! Deine Anfrage ist angekommen und wird persönlich beantwortet.</p>;
  return (
    <form onSubmit={senden} className="space-y-2">
      <input name="name" placeholder="Name (optional)" maxLength={120} className={feld} autoComplete="name" />
      <input name="kontakt" required placeholder="E-Mail oder Telefon für die Antwort" maxLength={200} className={feld} />
      <textarea name="nachricht" required minLength={3} maxLength={3000} rows={3} placeholder="Deine Nachricht" className={feld} />
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <label className="flex items-start gap-2 text-xs text-muted">
        <input type="checkbox" name="einwilligung" required className="mt-0.5 h-4 w-4" />
        <span>Ich bin einverstanden, dass meine Angaben zur Beantwortung dieser Anfrage gespeichert werden. Keine Weitergabe, kein Newsletter.</span>
      </label>
      <button type="submit" disabled={laedt} className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
        {laedt ? "Wird gesendet …" : "Anfrage senden"}
      </button>
      {fehler && <p className="text-xs text-danger">{fehler}</p>}
    </form>
  );
}
