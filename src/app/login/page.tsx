import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Anmelden — SECRET 58" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-grid px-4 py-12">
      <div className="card w-full max-w-sm p-8">
        <h1 className="text-xl font-semibold text-foreground">Anmelden</h1>
        <p className="mt-1 text-sm text-muted">
          Zugang zu deinem privaten SECRET-58-Arbeitsbereich.
        </p>
        <Suspense>
          <LoginForm />
        </Suspense>
        <p className="mt-6 text-center text-sm text-muted">
          Noch kein Konto?{" "}
          <a href="/signup" className="text-accent-2 hover:underline">
            Jetzt registrieren
          </a>
        </p>
        <p className="mt-2 text-center text-xs text-muted">
          Nutzung erfordert ein aktives Pro- oder Maxi-Abo bei der{" "}
          <a href="/buy" className="text-accent-2 hover:underline">
            Zentrale (secret58.com)
          </a>
          .
        </p>
      </div>
    </div>
  );
}
