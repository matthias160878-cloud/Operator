"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Send, Sparkles } from "lucide-react";
import type { Conversation, Message } from "@prisma/client";
import { PLATFORM_LABELS } from "@/lib/format";

const inputClass =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

export function ConversationDetail({
  conversation,
}: {
  conversation: Conversation & { messages: Message[] };
}) {
  const t = useTranslations("inbox");
  const router = useRouter();
  const [simulateText, setSimulateText] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);

  async function simulateInbound(e: React.FormEvent) {
    e.preventDefault();
    if (!simulateText.trim()) return;
    await fetch(`/api/conversations/${conversation.id}/simulate-inbound`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: simulateText }),
    });
    setSimulateText("");
    router.refresh();
  }

  async function requestDraft() {
    setDrafting(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/draft`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) setNotice(data.error ?? t("detail.draftFailed"));
      router.refresh();
    } finally {
      setDrafting(false);
    }
  }

  async function saveEdit(messageId: string) {
    const body = editing[messageId];
    if (body == null) return;
    await fetch(`/api/messages/${messageId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setEditing((prev) => {
      const next = { ...prev };
      delete next[messageId];
      return next;
    });
    router.refresh();
  }

  async function send(messageId: string) {
    setSendingId(messageId);
    setNotice(null);
    try {
      const res = await fetch(`/api/messages/${messageId}/send`, { method: "POST" });
      const data = await res.json();
      if (data.message) setNotice(data.message);
      router.refresh();
    } finally {
      setSendingId(null);
    }
  }

  const hasOpenDraft = conversation.messages.some((m) => m.direction === "OUTBOUND" && m.status === "DRAFTED");

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="mb-1 text-xs text-muted">{PLATFORM_LABELS[conversation.platform] ?? conversation.platform}</div>
        <h1 className="text-lg font-semibold text-foreground">
          {conversation.participantName}
          {conversation.participantHandle && (
            <span className="ml-2 text-sm font-normal text-muted">@{conversation.participantHandle}</span>
          )}
        </h1>
      </div>

      <div className="card space-y-3 p-5">
        {conversation.messages.map((m) => (
          <div key={m.id} className={m.direction === "INBOUND" ? "flex justify-start" : "flex justify-end"}>
            <div
              className={
                "max-w-lg rounded-lg border px-3 py-2 text-sm " +
                (m.direction === "INBOUND"
                  ? "border-border bg-surface-2 text-foreground"
                  : m.status === "SENT"
                    ? "border-success/30 bg-success/10 text-foreground"
                    : m.status === "FAILED"
                      ? "border-danger/30 bg-danger/10 text-foreground"
                      : "border-accent/30 bg-accent/10 text-foreground")
              }
            >
              {editing[m.id] != null ? (
                <div className="space-y-2">
                  <textarea
                    className={inputClass}
                    rows={2}
                    value={editing[m.id]}
                    onChange={(e) => setEditing((prev) => ({ ...prev, [m.id]: e.target.value }))}
                  />
                  <button
                    onClick={() => saveEdit(m.id)}
                    className="rounded-lg bg-accent px-2.5 py-1 text-xs text-white"
                  >
                    {t("detail.save")}
                  </button>
                </div>
              ) : (
                <p>{m.body}</p>
              )}

              <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted">
                <span>{new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(m.createdAt)}</span>
                {m.direction === "OUTBOUND" && <span>· {m.status}</span>}
              </div>

              {m.direction === "OUTBOUND" && m.status === "DRAFTED" && editing[m.id] == null && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => setEditing((prev) => ({ ...prev, [m.id]: m.body }))}
                    className="rounded-lg border border-border px-2.5 py-1 text-xs text-foreground"
                  >
                    {t("detail.edit")}
                  </button>
                  <button
                    onClick={() => send(m.id)}
                    disabled={sendingId === m.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-accent px-2.5 py-1 text-xs text-white disabled:opacity-60"
                  >
                    {sendingId === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    {t("detail.approveAndSend")}
                  </button>
                </div>
              )}
              {m.error && <p className="mt-1 text-[11px] text-danger">{m.error}</p>}
            </div>
          </div>
        ))}
      </div>

      {notice && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-2 text-xs text-warning">
          {notice}
        </div>
      )}

      <div className="card space-y-3 p-5">
        <button
          onClick={requestDraft}
          disabled={drafting || hasOpenDraft}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent to-accent-3 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {drafting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {t("detail.requestDraft")}
        </button>
        {hasOpenDraft && (
          <p className="text-xs text-muted">{t("detail.openDraftExists")}</p>
        )}
      </div>

      <form onSubmit={simulateInbound} className="card space-y-2 p-5">
        <p className="text-xs text-muted">{t("detail.simulateMoreHint")}</p>
        <div className="flex gap-2">
          <input
            className={inputClass}
            placeholder={t("detail.messagePlaceholder")}
            value={simulateText}
            onChange={(e) => setSimulateText(e.target.value)}
          />
          <button type="submit" className="rounded-lg border border-border px-4 py-2 text-sm text-foreground">
            {t("detail.addButton")}
          </button>
        </div>
      </form>
    </div>
  );
}
