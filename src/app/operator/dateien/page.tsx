import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { BetreiberDateien } from "@/components/operator/BetreiberDateien";

export const dynamic = "force-dynamic";

export default async function BetreiberDateienPage() {
  const user = await getSessionUser();
  if (!user?.isOperator) redirect("/");
  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-accent-2">Betreiberbereich</div>
          <h1 className="text-xl font-semibold text-foreground">Dateiaustausch mit Kunden</h1>
          <p className="mt-1 max-w-2xl text-xs text-muted">
            Sie sehen je Kunde nur, was er Ihnen in „An SECRET 58“ bereitstellt, und was Sie ihm übergeben haben.
          </p>
        </div>
        <Link href="/operator" className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground">Zurück zum Betreiberbereich</Link>
      </div>
      <BetreiberDateien />
    </div>
  );
}
