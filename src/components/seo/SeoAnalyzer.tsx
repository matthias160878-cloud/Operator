"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle2, Gauge, Loader2, Search, XCircle } from "lucide-react";
import clsx from "clsx";
import type { CheckCategory, CheckStatus, SeoReport } from "@/lib/agents/seoAgent";

const inputClass =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

const CATEGORIES: CheckCategory[] = ["seo", "performance", "technik", "social"];

function scoreColor(score: number) {
  return score >= 80 ? "text-success" : score >= 50 ? "text-warning" : "text-danger";
}

function barColor(score: number) {
  return score >= 80 ? "bg-success" : score >= 50 ? "bg-warning" : "bg-danger";
}

function StatusIcon({ status }: { status: CheckStatus }) {
  if (status === "pass") return <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />;
  if (status === "warn") return <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />;
  return <XCircle className="h-4 w-4 shrink-0 text-danger" />;
}

export function SeoAnalyzer() {
  const t = useTranslations("seo");
  const [url, setUrl] = useState("");
  const [focusKeyword, setFocusKeyword] = useState("");
  const [includePageSpeed, setIncludePageSpeed] = useState(false);
  const [strategy, setStrategy] = useState<"mobile" | "desktop">("mobile");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<SeoReport | null>(null);
  const [showPassed, setShowPassed] = useState(false);

  async function analyze(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const normalized = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
      const res = await fetch("/api/seo/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: normalized, focusKeyword, includePageSpeed, strategy }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("form.failed"));
      setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("form.failed"));
    } finally {
      setLoading(false);
    }
  }

  const pageSpeed = report?.pageSpeed;

  return (
    <div className="space-y-5">
      <form onSubmit={analyze} className="card space-y-4 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_240px]">
          <label className="block">
            <span className="text-sm font-medium text-foreground">{t("form.urlLabel")}</span>
            <input
              className={`${inputClass} mt-1.5`}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://meine-website.de"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">{t("form.keywordLabel")}</span>
            <input
              className={`${inputClass} mt-1.5`}
              value={focusKeyword}
              onChange={(e) => setFocusKeyword(e.target.value)}
              placeholder={t("form.keywordPlaceholder")}
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2 text-foreground">
            <input
              type="checkbox"
              checked={includePageSpeed}
              onChange={(e) => setIncludePageSpeed(e.target.checked)}
            />
            {t("form.pageSpeedLabel")}
          </label>
          {includePageSpeed && (
            <select
              className="rounded-lg border border-border bg-surface-2 px-2 py-1 text-sm text-foreground"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as "mobile" | "desktop")}
            >
              <option value="mobile">{t("form.mobile")}</option>
              <option value="desktop">{t("form.desktop")}</option>
            </select>
          )}
        </div>
        {includePageSpeed && <p className="text-xs text-muted">{t("form.pageSpeedHint")}</p>}
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent to-accent-3 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {loading ? t("form.analyzing") : t("form.analyzeButton")}
        </button>
      </form>

      {report && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
            <div className="card flex flex-col items-center justify-center p-5 text-center">
              <div className="text-xs uppercase tracking-wide text-muted">{t("result.score")}</div>
              <div className={clsx("mt-1 text-5xl font-semibold", scoreColor(report.score))}>{report.score}</div>
              <div className="text-xs text-muted">/ 100</div>
              <a
                href={report.finalUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 max-w-full truncate text-xs text-accent-2 hover:underline"
              >
                {report.finalUrl}
              </a>
            </div>
            <div className="card space-y-3 p-5">
              {CATEGORIES.map((cat) => (
                <div key={cat}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-foreground">{t(`categories.${cat}`)}</span>
                    <span className={scoreColor(report.categoryScores[cat])}>{report.categoryScores[cat]}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className={clsx("h-full rounded-full", barColor(report.categoryScores[cat]))}
                      style={{ width: `${report.categoryScores[cat]}%` }}
                    />
                  </div>
                </div>
              ))}
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 pt-2 text-xs sm:grid-cols-4">
                <div><dt className="text-muted">{t("facts.responseTime")}</dt><dd className="text-foreground">{report.facts.responseTimeMs} ms</dd></div>
                <div><dt className="text-muted">{t("facts.htmlSize")}</dt><dd className="text-foreground">{report.facts.htmlKb} KB</dd></div>
                <div><dt className="text-muted">{t("facts.words")}</dt><dd className="text-foreground">{report.facts.wordCount}</dd></div>
                <div><dt className="text-muted">{t("facts.images")}</dt><dd className="text-foreground">{report.facts.images} ({report.facts.imagesWithoutAlt} {t("facts.withoutAlt")})</dd></div>
              </dl>
            </div>
          </div>

          {pageSpeed && (
            <div className="card space-y-2 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Gauge className="h-4 w-4" /> {t("pageSpeed.heading")}
              </h3>
              {"error" in pageSpeed ? (
                <p className="text-sm text-warning">{pageSpeed.error}</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  {Object.entries(pageSpeed.scores).map(([key, value]) => (
                    <div key={key} className="rounded-lg border border-border bg-surface-2 p-3">
                      <div className="text-[10px] uppercase tracking-wide text-muted">{key}</div>
                      <div className={clsx("text-xl font-semibold", value === null ? "text-muted" : scoreColor(value))}>
                        {value ?? "—"}
                      </div>
                    </div>
                  ))}
                  {Object.entries(pageSpeed.metrics).map(([key, value]) => (
                    <div key={key} className="text-xs">
                      <div className="text-muted">{key}</div>
                      <div className="text-foreground">{value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="card space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{t("result.recommendations")}</h3>
              <span className="text-xs text-muted">
                {report.provider === "template" ? t("result.templateMode") : t("result.aiMode", { provider: report.provider })}
              </span>
            </div>
            {report.recommendations.length === 0 && <p className="text-sm text-muted">{t("result.noRecommendations")}</p>}
            <ol className="space-y-2">
              {report.recommendations.map((rec, i) => (
                <li key={i} className="rounded-lg border border-border bg-surface-2 p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className={clsx(
                        "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                        rec.priority === "hoch"
                          ? "bg-danger/15 text-danger"
                          : rec.priority === "mittel"
                            ? "bg-warning/15 text-warning"
                            : "bg-surface text-muted"
                      )}
                    >
                      {t(`priority.${rec.priority}`)}
                    </span>
                    <span className="font-medium text-foreground">{rec.title}</span>
                  </div>
                  <p className="mt-1 text-muted">{rec.action}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="card space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{t("result.checks")}</h3>
              <label className="flex items-center gap-2 text-xs text-muted">
                <input type="checkbox" checked={showPassed} onChange={(e) => setShowPassed(e.target.checked)} />
                {t("result.showPassed")}
              </label>
            </div>
            {CATEGORIES.map((cat) => {
              const checks = report.checks.filter((c) => c.category === cat && (showPassed || c.status !== "pass"));
              if (checks.length === 0) return null;
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-accent-2">
                    {t(`categories.${cat}`)}
                  </div>
                  {checks.map((c) => (
                    <div key={c.id} className="flex gap-2 text-sm">
                      <StatusIcon status={c.status} />
                      <div>
                        <span className="text-foreground">{c.label}</span>
                        <span className="text-muted"> — {c.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
