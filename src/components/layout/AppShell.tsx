import type { ReactNode } from "react";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ChatWidget } from "@/components/chatbot/ChatWidget";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { getAllIntegrationStatuses } from "@/lib/integrations/registry";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";

const ONBOARDING_SETTING_KEY = "onboardingCompleted";

export async function AppShell({ children }: { children: ReactNode }) {
  const ti = await getTranslations("common.integrationStatus");
  const workspaceId = await getCurrentWorkspaceId();
  const [integrations, onboardingSetting] = await Promise.all([
    getAllIntegrationStatuses(ti),
    prisma.setting.findUnique({
      where: { workspaceId_key: { workspaceId, key: ONBOARDING_SETTING_KEY } },
    }),
  ]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-x-hidden px-4 py-5 lg:px-6 lg:py-6">
          {children}
        </main>
      </div>
      <ChatWidget />
      <Suspense fallback={null}>
        <OnboardingWizard
          initialCompleted={Boolean(onboardingSetting)}
          initialIntegrations={integrations}
        />
      </Suspense>
    </div>
  );
}
