import { Suspense } from "react";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata = { title: "Registrieren — SECRET 58" };

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-grid px-4 py-12">
      <div className="card w-full max-w-sm p-8">
        <h1 className="text-xl font-semibold text-foreground">Konto erstellen</h1>
        <p className="mt-1 text-sm text-muted">
          Dein eigener, privater SECRET-58-Arbeitsbereich — getrennt von allen
          anderen Kundinnen und Kunden.
        </p>
        <p className="mt-3 rounded-md border border-border bg-background/50 p-3 text-xs text-muted">
          Ein Konto hier reicht allein nicht aus: Nutzung erfordert ein
          aktives Pro- oder Maxi-Abo bei der{" "}
          <a href="/buy" className="text-accent-2 hover:underline">
            Zentrale (secret58.com)
          </a>
          . Hast du dort schon ein Abo, landest du beim Öffnen von
          &bdquo;Social Media AI&rdquo; automatisch hier — eine separate
          Registrierung ist dann nicht nötig.
        </p>
        <Suspense>
          <SignupForm />
        </Suspense>
        <p className="mt-6 text-center text-sm text-muted">
          Schon ein Konto?{" "}
          <a href="/login" className="text-accent-2 hover:underline">
            Anmelden
          </a>
        </p>
      </div>
    </div>
  );
}
