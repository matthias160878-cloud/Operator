import { AuthForm } from "@/components/auth/AuthForm";
import { AuthCard } from "@/components/auth/AuthCard";
import { parsePlanKey } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  const planKey = parsePlanKey(plan);
  return (
    <AuthCard
      title="Konto anlegen"
      subtitle={
        planKey
          ? `Danach wählst du ${planKey === "PRO" ? "Pro" : "Maxi"} und bestätigst den Kauf selbst.`
          : "Dein eigener, privater Arbeitsbereich."
      }
    >
      <AuthForm mode="signup" plan={planKey ?? undefined} />
    </AuthCard>
  );
}
