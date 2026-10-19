import { headers } from "next/headers";
import Link from "next/link";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { widgetConfig } from "@/lib/widget/websiteWidget";
import { CopyBlock } from "@/components/website-widget/CopyBlock";

export const dynamic = "force-dynamic";

function StatusRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className="flex gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
      ) : (
        <CircleDashed className="h-4 w-4 shrink-0 text-muted" />
      )}
      <div>
        <span className="text-foreground">{label}</span>
        <span className="text-muted"> — {detail}</span>
      </div>
    </div>
  );
}

export default async function WebsiteWidgetPage() {
  const t = await getTranslations("websiteWidget");
  const config = widgetConfig();
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const appUrl = `${proto}://${host}`;

  const workspaceId = await getCurrentWorkspaceId();
  const conversationCount = await prisma.conversation.count({ where: { workspaceId, platform: "WEBSITE" } });

  const snippet = `<script src="${appUrl}/widget.js" data-key="${config.key || "DEINE-WIDGET-ID"}" async></script>`;
  const envExample = [
    "WEBSITE_WIDGET_KEY=<openssl rand -hex 16>",
    "WEBSITE_WIDGET_ORIGINS=https://meine-website.de,https://www.meine-website.de",
    "# optional:",
    "WEBSITE_WIDGET_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/…",
    "WEBSITE_WIDGET_WEBHOOK_SECRET=<openssl rand -hex 32>",
  ].join("\n");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">{t("subtitle")}</p>
      </div>

      <div className="card space-y-2 p-5">
        <h2 className="text-sm font-semibold text-foreground">{t("status.heading")}</h2>
        <StatusRow
          ok={Boolean(config.key)}
          label={t("status.key")}
          detail={config.key ? t("status.set") : t("status.missing", { env: "WEBSITE_WIDGET_KEY" })}
        />
        <StatusRow
          ok={config.origins.length > 0}
          label={t("status.origins")}
          detail={config.origins.length > 0 ? config.origins.join(", ") : t("status.missing", { env: "WEBSITE_WIDGET_ORIGINS" })}
        />
        <StatusRow
          ok={Boolean(config.webhookUrl)}
          label={t("status.webhook")}
          detail={
            config.webhookUrl
              ? config.webhookSigned
                ? t("status.webhookSigned")
                : t("status.webhookUnsigned")
              : t("status.optional", { env: "WEBSITE_WIDGET_WEBHOOK_URL" })
          }
        />
        <p className="pt-1 text-xs text-muted">
          {config.enabled ? t("status.enabled") : t("status.disabled")}{" "}
          <Link href="/inbox" className="underline">
            {t("status.conversations", { count: conversationCount })}
          </Link>
        </p>
      </div>

      {!config.enabled && (
        <div className="card space-y-2 p-5">
          <h2 className="text-sm font-semibold text-foreground">{t("setup.heading")}</h2>
          <p className="text-sm text-muted">{t("setup.text")}</p>
          <CopyBlock code={envExample} />
        </div>
      )}

      <div className="card space-y-2 p-5">
        <h2 className="text-sm font-semibold text-foreground">{t("embed.heading")}</h2>
        <p className="text-sm text-muted">{t("embed.text")}</p>
        <CopyBlock code={snippet} />
        <p className="text-xs text-muted">{t("embed.options")}</p>
        <ul className="list-disc space-y-0.5 pl-5 text-xs text-muted">
          <li><code>data-title</code> — {t("embed.optTitle")}</li>
          <li><code>data-greeting</code> — {t("embed.optGreeting")}</li>
          <li><code>data-color</code> — {t("embed.optColor")}</li>
          <li><code>data-position</code> — {t("embed.optPosition")}</li>
          <li><code>data-lang</code> — {t("embed.optLang")}</li>
          <li><code>data-privacy-url</code> — {t("embed.optPrivacy")}</li>
        </ul>
      </div>

      <div className="card space-y-2 p-5">
        <h2 className="text-sm font-semibold text-foreground">{t("webhook.heading")}</h2>
        <p className="text-sm text-muted">{t("webhook.text")}</p>
        <CopyBlock
          code={`POST <WEBSITE_WIDGET_WEBHOOK_URL>
X-Secret58-Event: widget.message.received | widget.reply.sent
X-Secret58-Timestamp: 1760000000
X-Secret58-Signature: sha256=HMAC_SHA256(secret, "<timestamp>.<body>")

{
  "event": "widget.message.received",
  "createdAt": "2026-10-19T12:00:00.000Z",
  "conversation": { "id": "…", "name": "Anna", "email": "anna@example.com", "page": "https://…", "inboxPath": "/inbox/…" },
  "message": { "id": "…", "body": "Hallo, habt ihr …" }
}`}
        />
        <p className="text-xs text-muted">{t("webhook.hint")}</p>
      </div>
    </div>
  );
}
