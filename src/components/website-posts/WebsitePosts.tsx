"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Copy, Globe, Loader2, Save, Sparkles } from "lucide-react";
import clsx from "clsx";
import { PLATFORM_LABELS } from "@/lib/format";
import type { WebsitePost, WebsiteSocialResult } from "@/lib/agents/websiteSocialAgent";

const inputClass =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

const PLATFORMS = ["LINKEDIN", "INSTAGRAM", "FACEBOOK", "TIKTOK", "YOUTUBE", "BLOG", "NEWSLETTER"];

interface EditablePost extends WebsitePost {
  selected: boolean;
  hashtagText: string;
}

export function WebsitePosts() {
  const t = useTranslations("websitePosts");
  const [url, setUrl] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["LINKEDIN", "INSTAGRAM", "FACEBOOK"]);
  const [postsPerPlatform, setPostsPerPlatform] = useState(1);
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<WebsiteSocialResult["source"] | null>(null);
  const [provider, setProvider] = useState("");
  const [posts, setPosts] = useState<EditablePost[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [copied, setCopied] = useState<number | null>(null);

  function togglePlatform(p: string) {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  function updatePost(index: number, patch: Partial<EditablePost>) {
    setPosts((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSavedIds([]);
    try {
      const normalized = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
      const res = await fetch("/api/website-posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: normalized, platforms, postsPerPlatform, instructions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("form.failed"));
      const result = data as WebsiteSocialResult;
      setSource(result.source);
      setProvider(result.provider);
      setPosts(result.posts.map((p) => ({ ...p, selected: true, hashtagText: p.hashtags.join(" ") })));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("form.failed"));
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    const chosen = posts.filter((p) => p.selected);
    if (chosen.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/website-posts/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sourceTitle: source?.title ?? "",
          posts: chosen.map((p) => ({
            platform: p.platform,
            hook: p.hook,
            caption: p.caption,
            cta: p.cta,
            hashtags: p.hashtagText.split(/[\s,]+/).filter(Boolean),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("result.saveFailed"));
      setSavedIds(data.ids);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("result.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function copy(index: number) {
    const p = posts[index];
    try {
      await navigator.clipboard.writeText(`${p.caption}${p.hashtagText ? `\n\n${p.hashtagText}` : ""}`);
      setCopied(index);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Zwischenablage nicht verfügbar (z. B. ohne HTTPS) — kein Absturz.
    }
  }

  const selectedCount = posts.filter((p) => p.selected).length;

  return (
    <div className="space-y-5">
      <form onSubmit={generate} className="card space-y-4 p-5">
        <label className="block">
          <span className="text-sm font-medium text-foreground">{t("form.urlLabel")}</span>
          <input
            className={`${inputClass} mt-1.5`}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://meine-website.de/produkt"
            required
          />
        </label>
        <div>
          <span className="text-sm font-medium text-foreground">{t("form.platformsLabel")}</span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => togglePlatform(p)}
                className={clsx(
                  "rounded-lg border px-3 py-1.5 text-xs",
                  platforms.includes(p)
                    ? "border-accent bg-accent/15 text-foreground"
                    : "border-border bg-surface-2 text-muted hover:text-foreground"
                )}
              >
                {PLATFORM_LABELS[p] ?? p}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[200px_1fr]">
          <label className="block">
            <span className="text-sm font-medium text-foreground">{t("form.perPlatformLabel")}</span>
            <select
              className={`${inputClass} mt-1.5`}
              value={postsPerPlatform}
              onChange={(e) => setPostsPerPlatform(Number(e.target.value))}
            >
              {[1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">{t("form.instructionsLabel")}</span>
            <input
              className={`${inputClass} mt-1.5`}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={t("form.instructionsPlaceholder")}
              maxLength={1000}
            />
          </label>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={loading || !url.trim() || platforms.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent to-accent-3 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? t("form.generating") : t("form.generateButton")}
        </button>
      </form>

      {source && (
        <div className="card space-y-1 p-5 text-sm">
          <div className="flex items-center gap-2 text-foreground">
            <Globe className="h-4 w-4 text-accent-2" />
            <span className="font-medium">{source.title || source.url}</span>
          </div>
          {source.description && <p className="text-muted">{source.description}</p>}
          <p className="text-xs text-muted">
            {provider === "template" ? t("result.templateMode") : t("result.aiMode", { provider })}
          </p>
        </div>
      )}

      {posts.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {posts.map((p, i) => (
              <div key={i} className={clsx("card space-y-2 p-4", !p.selected && "opacity-60")}>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <input type="checkbox" checked={p.selected} onChange={(e) => updatePost(i, { selected: e.target.checked })} />
                    {PLATFORM_LABELS[p.platform] ?? p.platform}
                  </label>
                  <button
                    type="button"
                    onClick={() => copy(i)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-muted hover:text-foreground"
                  >
                    <Copy className="h-3 w-3" /> {copied === i ? t("result.copied") : t("result.copy")}
                  </button>
                </div>
                <input
                  className={inputClass}
                  value={p.hook}
                  onChange={(e) => updatePost(i, { hook: e.target.value })}
                  placeholder={t("result.hookPlaceholder")}
                />
                <textarea
                  className={inputClass}
                  rows={7}
                  value={p.caption}
                  onChange={(e) => updatePost(i, { caption: e.target.value })}
                />
                <input
                  className={inputClass}
                  value={p.hashtagText}
                  onChange={(e) => updatePost(i, { hashtagText: e.target.value })}
                  placeholder="#hashtag"
                />
                <p className="text-right text-[10px] text-muted">{t("result.chars", { count: p.caption.length })}</p>
              </div>
            ))}
          </div>

          <div className="card flex flex-wrap items-center gap-3 p-4">
            <button
              type="button"
              onClick={save}
              disabled={saving || selectedCount === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {t("result.saveButton", { count: selectedCount })}
            </button>
            {savedIds.length > 0 && (
              <p className="text-sm text-success">
                {t("result.saved", { count: savedIds.length })}{" "}
                <Link href="/content-factory" className="underline">
                  {t("result.openContentFactory")}
                </Link>
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
