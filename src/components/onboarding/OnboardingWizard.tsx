"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, ExternalLink, Loader2, Sparkles, X } from "lucide-react";
import clsx from "clsx";
import { API_KEY_SIGNUP_LINKS, RENDER_ENV_DASHBOARD_URL } from "@/lib/integrations/links";
import type { IntegrationStatusResult } from "@/lib/integrations/types";

type StepKey = "welcome" | "aiProvider" | "platform" | "voice" | "done";

const STEP_ORDER: StepKey[] = ["welcome", "aiProvider", "platform", "voice", "done"];

const STEP_INTEGRATION_KEYS: Partial<Record<StepKey, string[]>> = {
  aiProvider: ["anthropic", "openai"],
  platform: ["youtube", "instagram", "tiktok", "linkedin", "facebook"],
  voice: ["elevenlabs"],
};

function IntegrationRow({ integ }: { integ: IntegrationStatusResult }) {
  const t = useTranslations("integrations");
  const tw = useTranslations("onboarding.wizard");
  const signupUrl = API_KEY_SIGNUP_LINKS[integ.key];
  const connected = integ.status === "CONNECTED";

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2 text-sm text-foreground">
          {integ.name}
          {connected && <Check className="h-3.5 w-3.5 text-success" />}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
          {!connected && signupUrl && (
            <a
              href={signupUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-accent-2 hover:underline"
            >
              {t("links.getKey")} <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {!connected && (
            <a
              href={RENDER_ENV_DASHBOARD_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-accent-2 hover:underline"
            >
              {t("links.setInRender")} <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
      <span
        className={clsx(
          "inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
          connected
            ? "border-success/30 bg-success/15 text-success"
            : "border-warning/30 bg-warning/15 text-warning"
        )}
      >
        {connected ? tw("connected") : tw("notConnected")}
      </span>
    </div>
  );
}

export function OnboardingWizard({
  initialCompleted,
  initialIntegrations,
}: {
  initialCompleted: boolean;
  initialIntegrations: IntegrationStatusResult[];
}) {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const forceOpen = searchParams.get("einrichtung") === "1";

  const [open, setOpen] = useState(() => forceOpen || !initialCompleted);
  const [stepIndex, setStepIndex] = useState(0);
  const [integrations, setIntegrations] = useState(initialIntegrations);
  const [checking, setChecking] = useState(false);

  // AppShell/OnboardingWizard stay mounted across client-side navigation
  // (same layout segment), so the ?einrichtung=1 reopen link needs to be
  // caught as it changes. Adjusting state during render (React's documented
  // pattern for this) instead of in an effect avoids an extra render pass.
  const [prevForceOpen, setPrevForceOpen] = useState(forceOpen);
  if (forceOpen !== prevForceOpen) {
    setPrevForceOpen(forceOpen);
    if (forceOpen) {
      setStepIndex(0);
      setOpen(true);
    }
  }

  if (!open) return null;

  const step = STEP_ORDER[stepIndex];
  const total = STEP_ORDER.length;
  const byKey = new Map(integrations.map((i) => [i.key, i]));
  const relevantKeys = STEP_INTEGRATION_KEYS[step] ?? [];
  const relevantIntegrations = relevantKeys
    .map((key) => byKey.get(key))
    .filter((i): i is IntegrationStatusResult => Boolean(i));

  async function finish() {
    setOpen(false);
    if (forceOpen) router.replace(pathname);
    await fetch("/api/onboarding/complete", { method: "POST" }).catch(() => {});
  }

  async function checkStatus() {
    setChecking(true);
    try {
      const res = await fetch("/api/onboarding/status");
      const data = await res.json();
      if (Array.isArray(data.integrations)) setIntegrations(data.integrations);
    } catch {
      // still show current state; user can retry
    } finally {
      setChecking(false);
    }
  }

  function goNext() {
    if (stepIndex === total - 1) {
      finish();
      return;
    }
    setStepIndex((i) => i + 1);
  }

  function goBack() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border bg-surface-2 px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent-2" />
            {step !== "welcome" && step !== "done" && (
              <span className="text-xs text-muted">
                {t("wizard.stepIndicator", { current: stepIndex, total: total - 2 })}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={finish}
            aria-label={t("wizard.close")}
            className="rounded p-1 text-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">{t(`steps.${step}.title`)}</h2>
          <p className="mt-2 text-sm text-muted">{t(`steps.${step}.body`)}</p>

          {t.has(`steps.${step}.steps`) && (
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-foreground">
              {t.raw(`steps.${step}.steps`).map((line: string, i: number) => (
                <li key={i}>{line}</li>
              ))}
            </ol>
          )}

          {t.has(`steps.${step}.costHint`) && (
            <p className="mt-2 text-xs text-muted">{t(`steps.${step}.costHint`)}</p>
          )}

          {relevantIntegrations.length > 0 && (
            <div className="mt-4 space-y-2">
              {relevantIntegrations.map((integ) => (
                <IntegrationRow key={integ.key} integ={integ} />
              ))}
              <p className="text-xs text-muted">{t("wizard.envHint")}</p>
              <button
                type="button"
                onClick={checkStatus}
                disabled={checking}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-surface-2 disabled:opacity-50"
              >
                {checking ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                {checking ? t("wizard.checking") : t("wizard.checkAgain")}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={goBack}
            disabled={stepIndex === 0}
            className="text-xs text-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("wizard.back")}
          </button>
          <div className="flex items-center gap-3">
            {step !== "welcome" && step !== "done" && (
              <button
                type="button"
                onClick={goNext}
                className="text-xs text-muted hover:text-foreground"
              >
                {t("wizard.skip")}
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              className="rounded-lg bg-gradient-to-r from-accent to-accent-3 px-4 py-1.5 text-xs font-medium text-white"
            >
              {step === "done" ? t("wizard.finish") : t("wizard.next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
