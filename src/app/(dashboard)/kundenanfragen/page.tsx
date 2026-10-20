import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { EMPFEHLUNG_KANAL, kundenanfragenFilter, pilotKundenbereichFreigeschaltet } from "@/lib/kundenanfragen";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  NEU: "Neu", PRUEFUNG: "In Prüfung", FREIGEGEBEN: "Freigegeben", UEBERGEBEN: "Übergeben", VERSAND_AUSSTEHEND: "Versand ausstehend",
  VERSENDET: "Versendet", VERSAND_FEHLGESCHLAGEN: "Versand fehlgeschlagen", SIMULIERT: "Versand simuliert (Demo)", ABGESCHLOSSEN: "Abgeschlossen",
};

/**
 * Kundenbereich „Anfragen“.
 * - Anfragen über Empfehlungslinks (Kanal „empfehlung“) sind immer sichtbar, mit
 *   Kontakt und Nachricht, damit der Kunde selbst antworten kann. Kein automatischer Versand.
 * - Weitere Kundenanfragen aus dem Pilot (Status, Kategorie) nur mit
 *   PILOTSTUDIO_KUNDENBEREICH=true. Musterantworten/Entwürfe bleiben im Betreiberbereich.
 * Zeigt ausschließlich Anfragen des eigenen Arbeitsbereichs (Workspace aus der Sitzung).
 */
export default async function KundenanfragenPage() {
  const pilot = pilotKundenbereichFreigeschaltet();
  const workspaceId = await getCurrentWorkspaceId();
  const rows = await prisma.pilotInquiry.findMany({
    where: kundenanfragenFilter(workspaceId, pilot),
    orderBy: { receivedAt: "desc" },
    take: 100,
    select: {
      id: true, subject: true, channel: true, receivedAt: true, status: true, category: true, isDemo: true,
      body: true, senderName: true, senderContact: true,
    },
  });
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Anfragen</h1>
        <p className="text-sm text-muted">
          Hier landen Anfragen, die Interessenten über Ihre Empfehlungsseiten (<Link className="underline" href="/weiterempfehlungen">Weiterempfehlungen</Link>) senden.
          Es wird nichts automatisch beantwortet — bitte melden Sie sich selbst über den angegebenen Kontakt.
        </p>
        {pilot && <p className="mt-1 text-xs text-muted">Pilot-Kundenbereich aktiv: Antwortentwürfe werden vor dem Versand immer von einem Menschen geprüft.</p>}
      </div>
      <div className="card divide-y divide-border">
        {rows.length ? rows.map((r) => {
          const empfehlung = r.channel === EMPFEHLUNG_KANAL;
          return (
            <div key={r.id} className="space-y-1 p-3 text-sm" data-anfrage-id={r.id}>
              <div className="flex flex-wrap justify-between gap-2">
                <span className="text-foreground">
                  {r.isDemo && <span className="mr-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">DEMO</span>}
                  {r.subject}
                  <span className="block text-xs text-muted">
                    {empfehlung ? "Empfehlungslink" : r.channel} · {r.receivedAt.toLocaleString("de-DE")}{!empfehlung && ` · ${r.category}`}
                  </span>
                </span>
                <span className="text-xs text-muted">{STATUS[r.status] ?? r.status}</span>
              </div>
              {empfehlung && (
                <div className="rounded-lg border border-border bg-surface-2/50 p-2 text-xs">
                  <p className="text-foreground">
                    {r.senderName ? `${r.senderName} · ` : ""}
                    <span className="font-medium">{r.senderContact}</span>
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-muted">{r.body}</p>
                </div>
              )}
            </div>
          );
        }) : <p className="p-4 text-sm text-muted">Noch keine Anfragen. Sobald jemand über einen Ihrer Empfehlungslinks anfragt, erscheint die Anfrage hier.</p>}
      </div>
    </div>
  );
}
