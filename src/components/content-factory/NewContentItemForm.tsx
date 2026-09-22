"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { PLATFORM_LABELS } from "@/lib/format";

const inputClass =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

export function NewContentItemForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("YOUTUBE");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/content-items", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, platform }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/content-factory/${data.item.id}`);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
      >
        <Plus className="h-4 w-4" /> Neues Content-Item
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
      <label className="flex-1">
        <span className="text-sm font-medium text-foreground">Titel</span>
        <input
          className={`${inputClass} mt-1.5`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />
      </label>
      <label>
        <span className="text-sm font-medium text-foreground">Plattform</span>
        <select
          className={`${inputClass} mt-1.5`}
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
        >
          {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        Erstellen
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="rounded-lg border border-border p-2 text-muted"
        aria-label="Schließen"
      >
        <X className="h-4 w-4" />
      </button>
    </form>
  );
}
