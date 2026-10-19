import { prisma } from "@/lib/db";
import { aiState, hashText, liveSendState } from "@/lib/pilotstudio/service";
import { CHECKLIST, getConfig, listInterviews, weeklyMinutes } from "@/lib/pilotstudio/demand";

/** Gesamtstand für den Betreiber (nur Betreiberbereich – enthält Gesprächsnotizen und Budgetangaben). */
export async function pilotState(workspaceId: string) {
  const [inquiries, interviews, config, websiteInbound] = await Promise.all([
    prisma.pilotInquiry.findMany({
      where: { workspaceId },
      orderBy: [{ isDemo: "desc" }, { demoCaseNo: "asc" }, { receivedAt: "desc" }],
      include: { events: { orderBy: { createdAt: "asc" }, take: 200 } },
    }),
    listInterviews(workspaceId),
    getConfig(workspaceId),
    prisma.conversation.count({ where: { workspaceId, platform: "WEBSITE" } }),
  ]);
  const ai = aiState();
  const live = liveSendState();
  const demo = inquiries.filter((i) => i.isDemo && i.demoCaseNo);
  const doneTests = demo.filter((i) => i.testResult !== "OFFEN").length;
  const doneInterviews = interviews.filter((r) => r.interviewDate || r.interest !== "UNGEFRAGT").length;
  const integrations = [
    { name: "KI für Antwortentwürfe", state: ai.ok ? "vorbereitet" : "nicht verbunden", detail: ai.ok ? `Anbieter konfiguriert (${ai.provider}); Antworten werden geprüft, nicht live versendet.` : "Kein KI-Schlüssel im Server. Entwürfe nur als Musterantwort (Demo)." },
    { name: "Eingangskanal: Kontaktformular der Webseite", state: websiteInbound > 0 ? "live (Eingang)" : "vorbereitet", detail: `${websiteInbound} Anfrage(n) im vorhandenen Posteingang; Übernahme ins Pilotstudio per Knopf.` },
    { name: "Versand per E-Mail (Resend)", state: live.ok ? "live" : "nicht verbunden", detail: live.ok ? "Versand nur nach Freigabe, je Textversion einmal." : `Fehlt: ${live.missing.join(", ")}.` },
  ];
  const nextSteps = CHECKLIST.filter(([k]) => !config.checklist[k]).map(([, label]) => label);
  return {
    // draftHash: Prüfsumme der angezeigten Fassung; die Freigabe schickt sie zurück und wird nur bei exakt gleicher Fassung angenommen.
    inquiries: inquiries.map((i) => ({ ...i, draftHash: hashText(i.draftText) })),
    interviews: interviews.map((r) => ({ ...r, weeklyMinutes: weeklyMinutes(r) })),
    config,
    checklist: CHECKLIST.map(([key, label]) => ({ key, label })),
    overview: { doneTests, totalTests: 10, demoLoaded: demo.length, doneInterviews, totalInterviews: 5, integrations, nextSteps },
  };
}
