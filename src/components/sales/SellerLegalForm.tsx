"use client";

import { useState, type FormEvent } from "react";

export interface SellerProfileValues {
  anbieter: string;
  firma: string;
  anschrift: string;
  email: string;
  telefon: string;
  ustId: string;
  register: string;
  aufsicht: string;
  verantwortlich: string;
  agbUrl: string;
  datenschutzUrl: string;
  widerrufUrl: string;
}

const FIELDS: { key: keyof SellerProfileValues; label: string; hint?: string; required?: boolean; multiline?: boolean; type?: string }[] = [
  { key: "anbieter", label: "Name (natürliche Person bzw. Vertretungsberechtigte)", required: true },
  { key: "firma", label: "Firma mit Rechtsform", hint: "nur falls zutreffend, z. B. „Muster GmbH“" },
  { key: "anschrift", label: "Ladungsfähige Anschrift", required: true, multiline: true, hint: "Straße, PLZ Ort, Land — kein Postfach" },
  { key: "email", label: "E-Mail-Adresse", required: true, type: "email" },
  { key: "telefon", label: "Telefon", hint: "empfohlen" },
  { key: "ustId", label: "USt-IdNr.", hint: "falls vorhanden" },
  { key: "register", label: "Registereintrag", hint: "z. B. Amtsgericht Freiburg, HRB 12345 — falls eingetragen" },
  { key: "aufsicht", label: "Aufsichtsbehörde / Kammer", hint: "nur bei erlaubnispflichtiger Tätigkeit" },
  { key: "verantwortlich", label: "Verantwortlich nach § 18 Abs. 2 MStV", hint: "leer = Name von oben" },
  { key: "datenschutzUrl", label: "Link zu deiner Datenschutzerklärung", required: true, type: "url" },
  { key: "agbUrl", label: "Link zu deinen AGB", type: "url", hint: "empfohlen" },
  { key: "widerrufUrl", label: "Link zur Widerrufsbelehrung", type: "url", hint: "bei Verkäufen an Verbraucher in der Regel erforderlich" },
];

export function SellerLegalForm({ initial, missing }: { initial: SellerProfileValues; missing: string[] }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState(missing.length > 0);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    const res = await fetch("/api/sales/legal", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg(data.error ?? "Speichern fehlgeschlagen.");
    setMsg(data.missing?.length ? `Gespeichert. Es fehlt noch: ${data.missing.join(", ")}.` : "Gespeichert. Deine Angebote dürfen öffentlich sein.");
    if (!data.missing?.length) setTimeout(() => window.location.reload(), 800);
  }

  const input = "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground";

  return (
    <section className="card space-y-3 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Deine Anbieterangaben (Impressum)</h2>
        <button type="button" onClick={() => setOpen((v) => !v)} className="text-xs text-accent-2 underline">
          {open ? "Einklappen" : "Bearbeiten"}
        </button>
      </div>
      {missing.length > 0 ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-foreground">
          Deine Angebotsseiten sind erst öffentlich und kaufbar, wenn diese Angaben vollständig sind. Es fehlt: {missing.join(", ")}.
        </p>
      ) : (
        <p className="text-xs text-muted">Vollständig — deine Angebotsseiten zeigen dein eigenes Impressum.</p>
      )}
      {open && (
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <label key={f.key} className={`block text-xs text-muted ${f.multiline ? "sm:col-span-2" : ""}`}>
              {f.label}
              {f.required ? " *" : ""}
              {f.multiline ? (
                <textarea name={f.key} rows={3} defaultValue={initial[f.key]} className={input} required={f.required} />
              ) : (
                <input name={f.key} type={f.type ?? "text"} defaultValue={initial[f.key]} className={input} required={f.required} />
              )}
              {f.hint && <span className="mt-0.5 block text-[11px]">{f.hint}</span>}
            </label>
          ))}
          <p className="text-[11px] text-muted sm:col-span-2">
            Du bist als Verkäufer für die Richtigkeit verantwortlich. Diese Angaben erscheinen öffentlich auf deinen
            Angebotsseiten. Rechtstexte (AGB, Datenschutz, Widerruf) stellst du selbst bereit; SECRET 58 verfasst sie nicht.
          </p>
          <button disabled={busy} className="rounded-lg bg-accent px-4 py-2 text-sm text-white disabled:opacity-40 sm:col-span-2 sm:justify-self-start">
            {busy ? "Speichern…" : "Angaben speichern"}
          </button>
        </form>
      )}
      {msg && <p className="text-sm text-foreground" role="status">{msg}</p>}
    </section>
  );
}
