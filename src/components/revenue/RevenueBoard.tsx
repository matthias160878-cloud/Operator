"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { Campaign, Platform, RevenueEntry } from "@prisma/client";
import { formatCurrency, PLATFORM_LABELS } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";

const inputClass =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

type EntryWithCampaign = RevenueEntry & { campaign: { title: string } | null };

export function RevenueBoard({
  entries,
  campaigns,
}: {
  entries: EntryWithCampaign[];
  campaigns: Campaign[];
}) {
  const t = useTranslations("revenue");
  const TYPE_LABELS: Record<string, string> = {
    AD_REVENUE: t("types.AD_REVENUE"),
    SPONSORSHIP: t("types.SPONSORSHIP"),
    AFFILIATE: t("types.AFFILIATE"),
    DONATION: t("types.DONATION"),
    OTHER: t("types.OTHER"),
  };
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [platform, setPlatform] = useState<string>("");
  const [campaignId, setCampaignId] = useState<string>("");
  const [type, setType] = useState("SPONSORSHIP");
  const [status, setStatus] = useState("RECEIVED");
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [recordedAt, setRecordedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = Number(amount.replace(",", "."));
    if (!Number.isFinite(parsedAmount)) {
      setError(t("invalidAmountError"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/revenue", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          platform: platform || null,
          campaignId: campaignId || null,
          type,
          status,
          source,
          amount: parsedAmount,
          currency,
          note,
          recordedAt: new Date(recordedAt).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("saveFailedError"));
      setSource("");
      setAmount("");
      setNote("");
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("unknownError"));
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(entry: EntryWithCampaign) {
    await fetch(`/api/revenue/${entry.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: entry.status === "RECEIVED" ? "PENDING" : "RECEIVED" }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm(t("deleteConfirm"))) return;
    await fetch(`/api/revenue/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" /> {t("addEntryButton")}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card grid grid-cols-1 gap-3 p-5 sm:grid-cols-3">
          <label className="block">
            <span className="text-xs font-medium text-muted">{t("formSource")}</span>
            <input
              className={`${inputClass} mt-1`}
              placeholder={t("formSourcePlaceholder")}
              value={source}
              onChange={(e) => setSource(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted">{t("formAmount")}</span>
            <input
              className={`${inputClass} mt-1`}
              placeholder={t("formAmountPlaceholder")}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted">{t("formCurrency")}</span>
            <input className={`${inputClass} mt-1`} value={currency} onChange={(e) => setCurrency(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted">{t("formType")}</span>
            <select className={`${inputClass} mt-1`} value={type} onChange={(e) => setType(e.target.value)}>
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted">{t("formPlatform")}</span>
            <select className={`${inputClass} mt-1`} value={platform} onChange={(e) => setPlatform(e.target.value)}>
              <option value="">{t("formPlatformNone")}</option>
              {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted">{t("formCampaign")}</span>
            <select
              className={`${inputClass} mt-1`}
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
            >
              <option value="">{t("formCampaignNone")}</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted">{t("formStatus")}</span>
            <select className={`${inputClass} mt-1`} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="RECEIVED">{t("formStatusReceived")}</option>
              <option value="PENDING">{t("formStatusPending")}</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted">{t("formDate")}</span>
            <input
              type="date"
              className={`${inputClass} mt-1`}
              value={recordedAt}
              onChange={(e) => setRecordedAt(e.target.value)}
            />
          </label>
          <label className="block sm:col-span-3">
            <span className="text-xs font-medium text-muted">{t("formNote")}</span>
            <input className={`${inputClass} mt-1`} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>

          {error && <p className="text-sm text-danger sm:col-span-3">{error}</p>}

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? t("savingButton") : t("saveButton")}
            </button>
          </div>
        </form>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
              <th className="px-4 py-3 font-medium">Datum</th>
              <th className="px-4 py-3 font-medium">Quelle</th>
              <th className="px-4 py-3 font-medium">Typ</th>
              <th className="px-4 py-3 font-medium">Plattform</th>
              <th className="px-4 py-3 font-medium">Kampagne</th>
              <th className="px-4 py-3 font-medium text-right">Betrag</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-xs text-muted">
                  Noch keine Einnahmen erfasst.
                </td>
              </tr>
            )}
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3 text-muted">
                  {new Intl.DateTimeFormat("de-DE", { dateStyle: "short" }).format(entry.recordedAt)}
                </td>
                <td className="px-4 py-3 text-foreground">{entry.source || "—"}</td>
                <td className="px-4 py-3 text-muted">{TYPE_LABELS[entry.type] ?? entry.type}</td>
                <td className="px-4 py-3 text-muted">
                  {entry.platform ? PLATFORM_LABELS[entry.platform as Platform] ?? entry.platform : "—"}
                </td>
                <td className="px-4 py-3 text-muted">{entry.campaign?.title ?? "—"}</td>
                <td className="px-4 py-3 text-right text-foreground">
                  {formatCurrency(entry.amount, entry.currency)}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleStatus(entry)} title="Status umschalten">
                    <StatusBadge status={entry.status} />
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => remove(entry.id)}
                    className="rounded-lg border border-border p-1.5 text-muted hover:text-danger"
                    title="Löschen"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
