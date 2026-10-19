import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  NEU: "Neu", PRUEFUNG: "In Prüfung", FREIGEGEBEN: "Freigegeben", UEBERGEBEN: "Übergeben", VERSAND_AUSSTEHEND: "Versand ausstehend",
  VERSENDET: "Versendet", VERSAND_FEHLGESCHLAGEN: "Versand fehlgeschlagen", SIMULIERT: "Versand simuliert (Demo)", ABGESCHLOSSEN: "Abgeschlossen",
};

/**
 * Vorbereiteter Kundenbereich „Kundenanfragen“ (noch nicht freigeschaltet).
 * Nur sichtbar mit PILOTSTUDIO_KUNDENBEREICH=true. Zeigt ausschließlich Anfragen des
 * eigenen Arbeitsbereichs; Nachfrageprüfung und Budgetnotizen bleiben im Betreiberbereich.
 */
export default async function KundenanfragenPage() {
  if (process.env.PILOTSTUDIO_KUNDENBEREICH !== "true") notFound();
  const workspaceId = await getCurrentWorkspaceId();
  const rows = await prisma.pilotInquiry.findMany({
    where: { workspaceId, isDemo: false },
    orderBy: { receivedAt: "desc" },
    take: 100,
    select: { id: true, subject: true, channel: true, receivedAt: true, status: true, category: true },
  });
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Kundenanfragen</h1>
        <p className="text-sm text-muted">Vorschau (vorbereitet). Antwortentwürfe werden vor dem Versand immer von einem Menschen geprüft.</p>
      </div>
      <div className="card divide-y divide-border">
        {rows.length ? rows.map((r) => (
          <div key={r.id} className="flex flex-wrap justify-between gap-2 p-3 text-sm">
            <span className="text-foreground">{r.subject}<span className="block text-xs text-muted">{r.channel} · {r.receivedAt.toLocaleString("de-DE")} · {r.category}</span></span>
            <span className="text-xs text-muted">{STATUS[r.status] ?? r.status}</span>
          </div>
        )) : <p className="p-4 text-sm text-muted">Noch keine Anfragen.</p>}
      </div>
    </div>
  );
}
