export function formatNumber(value: number): string {
  if (value >= 1000) {
    return new Intl.NumberFormat("de-DE", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat("de-DE").format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

export function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "gerade eben";
  if (diffMin < 60) return `vor ${diffMin} Min.`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `vor ${diffHours} Std.`;
  const diffDays = Math.round(diffHours / 24);
  return `vor ${diffDays} Tg.`;
}

export const PLATFORM_LABELS: Record<string, string> = {
  YOUTUBE: "YouTube",
  TIKTOK: "TikTok",
  INSTAGRAM: "Instagram",
  LINKEDIN: "LinkedIn",
  FACEBOOK: "Facebook",
  BLOG: "Blog",
  NEWSLETTER: "Newsletter",
};
