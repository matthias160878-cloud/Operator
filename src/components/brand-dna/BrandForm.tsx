"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import type { Brand } from "@prisma/client";

function parseArray(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function toCsv(json: string): string {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.join(", ") : "";
  } catch {
    return "";
  }
}

interface FormState {
  name: string;
  description: string;
  targetAudience: string;
  industry: string;
  language: string;
  tonality: string;
  humor: string;
  formality: string;
  preferredWords: string;
  forbiddenWords: string;
  preferredCtas: string;
  brandValues: string;
  topics: string;
  colors: string;
  fonts: string;
  visualRules: string;
}

function initialState(brand: Brand | null): FormState {
  if (!brand) {
    return {
      name: "",
      description: "",
      targetAudience: "",
      industry: "",
      language: "Deutsch",
      tonality: "",
      humor: "",
      formality: "",
      preferredWords: "",
      forbiddenWords: "",
      preferredCtas: "",
      brandValues: "",
      topics: "",
      colors: "",
      fonts: "",
      visualRules: "",
    };
  }
  return {
    name: brand.name,
    description: brand.description,
    targetAudience: brand.targetAudience,
    industry: brand.industry,
    language: brand.language,
    tonality: brand.tonality,
    humor: brand.humor,
    formality: brand.formality,
    preferredWords: toCsv(brand.preferredWords),
    forbiddenWords: toCsv(brand.forbiddenWords),
    preferredCtas: toCsv(brand.preferredCtas),
    brandValues: toCsv(brand.brandValues),
    topics: toCsv(brand.topics),
    colors: toCsv(brand.colors),
    fonts: toCsv(brand.fonts),
    visualRules: brand.visualRules,
  };
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {hint && <span className="ml-2 text-xs text-muted">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

export function BrandForm({ brand }: { brand: Brand | null }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState(brand));
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/brand", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          preferredWords: parseArray(form.preferredWords),
          forbiddenWords: parseArray(form.forbiddenWords),
          preferredCtas: parseArray(form.preferredCtas),
          brandValues: parseArray(form.brandValues),
          topics: parseArray(form.topics),
          colors: parseArray(form.colors),
          fonts: parseArray(form.fonts),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Speichern fehlgeschlagen.");
      }
      setSavedAt(new Date());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="card grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
        <Field label="Markenname">
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
          />
        </Field>
        <Field label="Branche">
          <input
            className={inputClass}
            value={form.industry}
            onChange={(e) => set("industry", e.target.value)}
          />
        </Field>
        <Field label="Beschreibung" hint="Was macht die Marke aus?">
          <textarea
            className={inputClass}
            rows={2}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </Field>
        <Field label="Zielgruppe">
          <input
            className={inputClass}
            value={form.targetAudience}
            onChange={(e) => set("targetAudience", e.target.value)}
          />
        </Field>
        <Field label="Sprache">
          <input
            className={inputClass}
            value={form.language}
            onChange={(e) => set("language", e.target.value)}
          />
        </Field>
        <Field label="Tonalität">
          <input
            className={inputClass}
            value={form.tonality}
            onChange={(e) => set("tonality", e.target.value)}
          />
        </Field>
        <Field label="Humor">
          <input
            className={inputClass}
            value={form.humor}
            onChange={(e) => set("humor", e.target.value)}
          />
        </Field>
        <Field label="Formalität">
          <input
            className={inputClass}
            value={form.formality}
            onChange={(e) => set("formality", e.target.value)}
          />
        </Field>
      </div>

      <div className="card grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
        <Field label="Bevorzugte Wörter" hint="kommagetrennt">
          <input
            className={inputClass}
            value={form.preferredWords}
            onChange={(e) => set("preferredWords", e.target.value)}
          />
        </Field>
        <Field label="Verbotene Wörter" hint="kommagetrennt">
          <input
            className={inputClass}
            value={form.forbiddenWords}
            onChange={(e) => set("forbiddenWords", e.target.value)}
          />
        </Field>
        <Field label="Bevorzugte CTAs" hint="kommagetrennt">
          <input
            className={inputClass}
            value={form.preferredCtas}
            onChange={(e) => set("preferredCtas", e.target.value)}
          />
        </Field>
        <Field label="Markenwerte" hint="kommagetrennt">
          <input
            className={inputClass}
            value={form.brandValues}
            onChange={(e) => set("brandValues", e.target.value)}
          />
        </Field>
        <Field label="Themen" hint="kommagetrennt">
          <input
            className={inputClass}
            value={form.topics}
            onChange={(e) => set("topics", e.target.value)}
          />
        </Field>
      </div>

      <div className="card grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
        <Field label="Farben" hint="kommagetrennt, z.B. #6D5BFF">
          <input
            className={inputClass}
            value={form.colors}
            onChange={(e) => set("colors", e.target.value)}
          />
          <div className="mt-2 flex gap-1.5">
            {parseArray(form.colors).map((c) => (
              <span
                key={c}
                className="h-5 w-5 rounded-full border border-border"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </Field>
        <Field label="Schriften" hint="kommagetrennt">
          <input
            className={inputClass}
            value={form.fonts}
            onChange={(e) => set("fonts", e.target.value)}
          />
        </Field>
        <Field label="Visuelle Regeln">
          <textarea
            className={inputClass}
            rows={2}
            value={form.visualRules}
            onChange={(e) => set("visualRules", e.target.value)}
          />
        </Field>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {saving ? "Speichert…" : "Brand DNA speichern"}
        </button>
        {savedAt && (
          <span className="text-xs text-success">
            Gespeichert um {savedAt.toLocaleTimeString("de-DE")}
          </span>
        )}
      </div>
    </form>
  );
}
