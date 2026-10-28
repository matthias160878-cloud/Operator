import type { Metadata } from "next";
import Link from "next/link";
import { LegalFooter } from "@/components/legal/LegalFooter";
import { KuendigungsFormular } from "@/components/kuendigung/KuendigungsFormular";
import { heuteInDeutschland, VERTRAEGE } from "@/lib/kuendigung";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Verträge hier kündigen — SECRET 58" };

/** Kündigungsbutton nach § 312k BGB — öffentlich, ohne Anmeldung erreichbar. */
export default function KuendigenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-grid px-4 py-12">
      <div className="card w-full max-w-2xl space-y-4 p-6 text-sm text-foreground sm:p-8">
        <h1 className="text-xl font-semibold">Verträge hier kündigen</h1>
        <p className="text-muted">
          Hier können Sie Ihren Vertrag mit SECRET 58 (z. B. Social Media KI – Pro oder Maxi) kündigen — ohne Anmeldung.
          Nach dem Absenden erhalten Sie sofort eine Bestätigung auf dem Bildschirm zum Speichern oder Drucken und eine
          Eingangsbestätigung per E-Mail.
        </p>
        <KuendigungsFormular vertraege={VERTRAEGE} heute={heuteInDeutschland()} />
        <p className="print:hidden">
          <Link href="/buy" className="text-accent-2 underline">Zurück</Link>
        </p>
      </div>
      <LegalFooter installieren startseite className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted print:hidden" />
    </div>
  );
}
