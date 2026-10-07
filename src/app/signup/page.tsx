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
