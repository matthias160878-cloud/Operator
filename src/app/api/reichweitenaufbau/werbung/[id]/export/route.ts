import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { NotFoundError, route } from "@/lib/api";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { exportCsv, exportJson } from "@/lib/reichweitenaufbau/werbung";
import { freigabeHash } from "@/lib/reichweitenaufbau/werbungHash";
import { nurWenn, werbungFreigeschaltet } from "@/lib/reichweitenaufbau/freischaltung";

/** Exportierbarer Kampagnenentwurf (JSON oder CSV). */
async function handleGET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const workspaceId = await getCurrentWorkspaceId();
  const { id } = await params;
  const plan = await prisma.werbeplan.findFirst({ where: { id, workspaceId }, include: { contentItem: { select: { title: true } }, kampagne: { select: { titel: true } } } });
  if (!plan) throw new NotFoundError();
  // Freigabe zählt nur, solange der Plan seit der Freigabe unverändert ist.
  const freigabeGueltig = plan.status === "FREIGEGEBEN" && plan.freigabeHash === freigabeHash(plan);
  const daten = { ...plan, status: freigabeGueltig ? "FREIGEGEBEN" : plan.status === "FREIGEGEBEN" ? "UNGUELTIG" : plan.status, inhalt: plan.contentItem?.title ?? plan.kampagne?.titel ?? "" };
  const format = new URL(request.url).searchParams.get("format");
  const datei = `kampagnenentwurf-${plan.id.slice(-6)}`;
  if (format === "csv") {
    return new Response(exportCsv(daten), {
      headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${datei}.csv"`, "cache-control": "no-store" },
    });
  }
  return new NextResponse(JSON.stringify(exportJson(daten), null, 2), {
    headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="${datei}.json"`, "cache-control": "no-store" },
  });
}

export const GET = nurWenn(werbungFreigeschaltet, route(handleGET));
