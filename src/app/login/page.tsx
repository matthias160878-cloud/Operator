import { AuthCard, AuthForm } from "@/components/auth/AuthForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <AuthCard title="Anmelden" subtitle="Zu deinem privaten Arbeitsbereich">
      <AuthForm mode="login" next={next} />
    </AuthCard>
  );
}
