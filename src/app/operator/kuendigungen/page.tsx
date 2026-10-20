import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { eingangText, KUENDIGUNGS_ARTEN, zeitpunktText, type KuendigungsArt } from "@/lib/kuendigung";
import { KuendigungBearbeitet } from "@/components/operator/KuendigungBearbeitet";

export const dynamic = "force-dynamic";

const datum = (d: Date) => new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", dateStyle: "medium" }).format(d);

/** Eingegangene Kündigungen (Kündigungsbutton, § 312k BGB) — nur Betreiber. */
export default async function BetreiberKuendigungenPage() {
  const user = await getSessionUser();
  if (!user?.isOperator) redirect("/");
  const liste = await prisma.kuendigung.findMany({ orderBy: { eingangAm: "desc" }, take: 200 });
  const plaene = await prisma.workspacePlan.findMany({
    where: { workspaceId: { in: liste.map((k) => k.workspaceId).filter((w): w is string => Boolean(w)) } },
  });
  const planVon = new Map(plaene.map((p) => [p.workspaceId, p]));
  const offen = liste.filter((k) => !k.bearbeitetAm).length;
  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-accent-2">Betreiberbereich</div>
          <h1 className="text-xl font-semibold text-foreground">Kündigungen</h1>
          <p className="mt-1 max-w-2xl text-xs text-muted">
            Eingänge über „Verträge hier kündigen“ (/kuendigen). Es wird nichts automatisch gekündigt: Bitte jede Kündigung in
            Stripe (Kundenportal oder Dashboard) umsetzen und danach als bearbeitet markieren. Offen: {offen}.
          </p>
        </div>
        <Link href="/operator" className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground">Zurück zum Betreiberbereich</Link>
      </div>
      {liste.length === 0 ? (
        <p className="card p-5 text-sm text-muted">Noch keine Kündigungen eingegangen.</p>
      ) : (
        <div className="space-y-3">
          {liste.map((k) => {
            const plan = k.workspaceId ? planVon.get(k.workspaceId) : undefined;
            return (
              <div key={k.id} className="card space-y-2 p-4 text-sm" data-testid="kuendigung-eintrag">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-semibold text-foreground">
                    {k.referenz} · {k.name}{" "}
                    <span className={`ml-1 rounded-full border px-2 py-0.5 text-xs ${k.bearbeitetAm ? "border-border text-muted" : "border-amber-500/50 text-amber-400"}`}>
                      {k.bearbeitetAm ? `bearbeitet am ${datum(k.bearbeitetAm)}` : "offen"}
                    </span>
                  </div>
                  <KuendigungBearbeitet id={k.id} bearbeitet={Boolean(k.bearbeitetAm)} />
                </div>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
                  <div><dt className="inline text-muted">Eingang: </dt><dd className="inline">{eingangText(k.eingangAm)}</dd></div>
                  <div><dt className="inline text-muted">Art: </dt><dd className="inline">{KUENDIGUNGS_ARTEN[k.art as KuendigungsArt] ?? k.art}</dd></div>
                  <div><dt className="inline text-muted">Vertrag: </dt><dd className="inline">{k.vertrag}</dd></div>
                  <div><dt className="inline text-muted">Zeitpunkt: </dt><dd className="inline">{zeitpunktText(k.zeitpunkt)}</dd></div>
                  <div><dt className="inline text-muted">Konto-E-Mail: </dt><dd className="inline">{k.email}</dd></div>
                  <div><dt className="inline text-muted">Bestätigung an: </dt><dd className="inline">{k.bestaetigungEmail} ({k.emailGesendet ? "E-Mail versendet" : "E-Mail NICHT versendet"})</dd></div>
                  {k.kundennummer && <div><dt className="inline text-muted">Arbeitsbereich/Kundennr.: </dt><dd className="inline">{k.kundennummer}</dd></div>}
                  {k.grund && <div className="sm:col-span-2"><dt className="inline text-muted">Grund: </dt><dd className="inline whitespace-pre-wrap">{k.grund}</dd></div>}
                  <div className="sm:col-span-2">
                    <dt className="inline text-muted">Konto: </dt>
                    <dd className="inline">
                      {!k.workspaceId
                        ? "kein Konto zur E-Mail gefunden"
                        : plan
                          ? `Paket ${plan.plan}, Status ${plan.status}${plan.currentPeriodEnd ? `, Zeitraum bis ${datum(plan.currentPeriodEnd)}` : ""}${plan.cancelAtPeriodEnd ? ", Kündigung in Stripe vorgemerkt" : ""}${plan.stripeSubscriptionId ? `, Abo ${plan.stripeSubscriptionId}` : ""}`
                          : "Konto ohne Paket"}
                    </dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
