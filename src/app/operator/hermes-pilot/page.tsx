import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { HermesPilot } from "@/components/operator/HermesPilot";

export const dynamic = "force-dynamic";

export default async function HermesPilotPage() {
  const user = await getSessionUser();
  if (!user?.isOperator) redirect("/");
  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-8">
      <div>
        <Link href="/operator" className="text-sm text-accent-2 hover:underline">← Betreiberbereich</Link>
        <h1 className="mt-2 text-xl font-semibold text-foreground">Hermes (interner Pilot)</h1>
        <p className="mt-1 text-sm text-muted">Vorbereitet und standardmäßig aus. Zugänge tragen Sie unter „Zugänge“ ein.</p>
      </div>
      <HermesPilot />
    </main>
  );
}
