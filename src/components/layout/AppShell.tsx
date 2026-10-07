import type { ReactNode } from "react";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ChatWidget } from "@/components/chatbot/ChatWidget";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { getAllIntegrationStatuses } from "@/lib/integrations/registry";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth/session";
import { getActivePlan } from "@/lib/entitlements";
import Link from "next/link";
import { LegalFooter } from "@/components/legal/LegalFooter";

const ONBOARDING_SETTING_KEY = "onboardingCompleted";

export async function AppShell({ children }: { children: ReactNode }) {
  const ti = await getTranslations("common.integrationStatus");
  const user = await requireSessionUser();
  const workspaceId = user.workspaceId;
  const initials = user.name.split(/\s+/).map((p) => p[0] ?? "").join("").slice(0, 2).toUpperCase() || "?";
  const [integrations, onboardingSetting, activePlan] = await Promise.all([
    getAllIntegrationStatuses(ti),
    prisma.setting.findUnique({
      where: { workspaceId_key: { workspaceId, key: ONBOARDING_SETTING_KEY } },
    }),
    getActivePlan(workspaceId),
  ]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar initials={initials} isOperator={user.isOperator} />
        <main className="flex-1 overflow-x-hidden px-4 py-5 lg:px-6 lg:py-6">
          {!activePlan && (
            <div className="mb-4 rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-sm text-foreground">
              Kein aktives Paket — KI-Funktionen sind gesperrt.{" "}
              <Link href="/billing" className="underline">Pro oder Maxi wählen</Link>
            </div>
          )}
          {children}
          <LegalFooter />
        </main>
      </div>
      <ChatWidget />
      {user.isOperator && (
      <Suspense fallback={null}>
        <OnboardingWizard
          initialCompleted={Boolean(onboardingSetting)}
          initialIntegrations={integrations}
        />
      </Suspense>
      )}
    </div>
  );
}
