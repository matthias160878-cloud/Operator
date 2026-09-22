"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { PLATFORM_LABELS } from "@/lib/format";

const MESSAGING_PLATFORMS = ["YOUTUBE", "TIKTOK", "INSTAGRAM", "LINKEDIN", "FACEBOOK"];
const inputClass =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

export function NewConversationForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState("INSTAGRAM");
  const [participantName, setParticipantName] = useState("");
  const [participantHandle, setParticipantHandle] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ platform, participantName, participantHandle, initialMessage }),
      });
      const data = await res.json();
      if (res.ok) router.push(`/inbox/${data.conversation.id}`);
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
        <Plus className="h-4 w-4" /> Konversation simulieren
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">
          Da keine echte Plattform-Verbindung besteht, kannst du hier eine eingehende Nachricht
          simulieren, um den KI-Antwortentwurf auszuprobieren.
        </p>
        <button type="button" onClick={() => setOpen(false)} className="text-muted" aria-label="Schließen">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select className={inputClass} value={platform} onChange={(e) => setPlatform(e.target.value)}>
          {MESSAGING_PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {PLATFORM_LABELS[p]}
            </option>
          ))}
        </select>
        <input
          className={inputClass}
          placeholder="Name"
          value={participantName}
          onChange={(e) => setParticipantName(e.target.value)}
          required
        />
        <input
          className={inputClass}
          placeholder="@handle (optional)"
          value={participantHandle}
          onChange={(e) => setParticipantHandle(e.target.value)}
        />
      </div>
      <textarea
        className={inputClass}
        rows={2}
        placeholder="Nachrichtentext …"
        value={initialMessage}
        onChange={(e) => setInitialMessage(e.target.value)}
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Erstellen
      </button>
    </form>
  );
}
