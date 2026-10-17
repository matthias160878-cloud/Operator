"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

export interface ComposioCardView {
  toolkit: string;
  label: string;
  configured: boolean;
  connectionId: string | null;
  status: string;
  accountLabel: string;
  lastReadTestAt: string | null;
  lastReadTestOk: boolean | null;
  lastError: string | null;
}

type Busy = null | "connect" | "test" | "disconnect";

const BUTTON = "flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-60";

function ComposioCard({ card }: { card: ComposioCardView }) {
  const t = useTranslations("socialMedia.composio");
  const router = useRouter();
  const [busy, setBusy] = useState<Busy>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const active = card.status === "ACTIVE";

  async function post(path: string, body?: unknown) {
    const res = await fetch(path, {
      method: "POST",
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  }

  async function connect() {
    if (active && !confirm(t("renewConfirm"))) return;
    setBusy("connect");
    setMessage(null);
    const r = await post("/api/composio/connect", { toolkit: card.toolkit });
    if (r.ok && typeof r.data.redirectUrl === "string") {
      // Gleicher Tab: funktioniert auf dem Handy ohne Popup-Blocker.
      window.location.assign(r.data.redirectUrl);
      return;
    }
    setMessage({ ok: false, text: r.data.error ?? t("genericError") });
    setBusy(null);
  }

  async function test() {
    setBusy("test");
    setMessage(null);
    const r = await post(`/api/composio/${card.connectionId}/test`);
    setMessage(
      r.ok && r.data.ok
        ? { ok: true, text: t("testOk", { account: r.data.label || card.label }) }
        : { ok: false, text: r.data.error ?? t("genericError") }
    );
    setBusy(null);
    router.refresh();
  }

  async function disconnect() {
    if (!confirm(t("disconnectConfirm", { platform: card.label }))) return;
    setBusy("disconnect");
    setMessage(null);
    const r = await post(`/api/composio/${card.connectionId}/disconnect`);
    if (!r.ok) setMessage({ ok: false, text: r.data.error ?? t("genericError") });
    setBusy(null);
    router.refresh();
  }

  const statusText = !card.configured
    ? t("statusNotSetUp")
    : active
      ? card.lastReadTestOk === true
        ? t("statusReadOk")
        : card.lastReadTestOk === false
          ? t("statusReadFailed")
          : t("statusConnectedUntested")
      : card.status === "PENDING"
        ? t("statusPending")
        : card.status === "FAILED" || card.status === "EXPIRED"
          ? t("statusFailed")
          : t("statusNotConnected");
  const statusTone = !card.configured
    ? "border-border bg-surface-2 text-muted"
    : active && card.lastReadTestOk !== false
      ? "border-success/40 bg-success/10 text-success"
      : card.status === "FAILED" || card.lastReadTestOk === false
        ? "border-danger/40 bg-danger/10 text-danger"
        : "border-warning/40 bg-warning/10 text-warning";

  return (
    <div className="card space-y-3 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{card.label}</h3>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs ${statusTone}`}>{statusText}</span>
      </div>
      <dl className="space-y-1.5 text-xs">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">{t("accountLabel")}</dt>
          <dd className="truncate text-foreground">{card.accountLabel || "—"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">{t("lastTestLabel")}</dt>
          <dd className="text-foreground">{card.lastReadTestAt ?? "—"}</dd>
        </div>
        {card.lastError && (
          <div className="flex justify-between gap-3">
            <dt className="text-muted">{t("lastErrorLabel")}</dt>
            <dd className="text-right text-danger">{card.lastError}</dd>
          </div>
        )}
      </dl>

      {message && (
        <p role="status" className={`text-xs ${message.ok ? "text-success" : "text-danger"}`}>
          {message.text}
        </p>
      )}

      {!card.configured ? (
        <p className="text-xs text-muted">{t("notSetUpHint")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {active && (
            <button type="button" onClick={test} disabled={busy !== null} className={`${BUTTON} bg-accent text-white`}>
              {busy === "test" ? <Loader2 className="h-4 w-4 animate-spin" /> : t("testButton")}
            </button>
          )}
          <button
            type="button"
            onClick={connect}
            disabled={busy !== null}
            className={`${BUTTON} ${active ? "border border-border bg-surface-2 text-foreground" : "bg-accent text-white sm:col-span-2"}`}
          >
            {busy === "connect" ? <Loader2 className="h-4 w-4 animate-spin" /> : active ? t("renewButton") : t("connectButton")}
          </button>
          {card.connectionId && card.status !== "DISCONNECTED" && card.status !== "NONE" && (
            <button
              type="button"
              onClick={disconnect}
              disabled={busy !== null}
              className={`${BUTTON} border border-border bg-surface-2 text-muted hover:text-danger sm:col-span-2`}
            >
              {busy === "disconnect" ? <Loader2 className="h-4 w-4 animate-spin" /> : t("disconnectButton")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ComposioPanel({ cards }: { cards: ComposioCardView[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {cards.map((card) => (
        <ComposioCard key={card.toolkit} card={card} />
      ))}
    </div>
  );
}
