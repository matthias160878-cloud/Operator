import { prisma } from "@/lib/db";
import { AuthCard, AuthForm } from "@/components/auth/AuthForm";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const operatorExists = (await prisma.user.count({ where: { isOperator: true } })) > 0;
  const tokenConfigured = (process.env.OPERATOR_SETUP_TOKEN ?? "").length >= 32;
  return (
    <AuthCard title="Betreiberkonto einrichten" subtitle="Einmaliger, geschützter Einrichtungsablauf">
      {operatorExists ? (
        <p className="text-sm text-muted">Das Betreiberkonto ist bereits eingerichtet. Bitte normal anmelden.</p>
      ) : !tokenConfigured ? (
        <p className="text-sm text-muted">
          Auf dem Server ist kein Einrichtungsschlüssel gesetzt. Lege die Umgebungsvariable OPERATOR_SETUP_TOKEN
          (mindestens 32 zufällige Zeichen) an und starte den Dienst neu.
        </p>
      ) : (
        <AuthForm mode="setup" />
      )}
    </AuthCard>
  );
}
