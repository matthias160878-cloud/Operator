import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { PilotStudio } from "@/components/operator/PilotStudio";

export const dynamic = "force-dynamic";

export default async function PilotstudioPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await getSessionUser();
  if (!user?.isOperator) redirect("/");
  return (
    <main className="mx-auto w-full max-w-6xl space-y-5 px-4 py-8">
      <div>
        <Link href="/operator" className="text-sm text-accent-2 hover:underline">← Betreiberbereich</Link>
        <h1 className="mt-2 text-xl font-semibold text-foreground">Pilotstudio</h1>
        <p className="mt-1 text-sm text-muted">
          Intern, nur für Betreiber. Kundenanfragen mit Entwurf, Prüfung und Freigabe testen und den Bedarf bei fünf KMU erfassen.
          Musterantworten sind feste Texte (Demo), keine KI. Es wird nichts automatisch versendet.
        </p>
      </div>
      <PilotStudio initialTab={(await searchParams).tab} />
    </main>
  );
}
