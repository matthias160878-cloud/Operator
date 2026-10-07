import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { isElevenLabsConfigured, listElevenLabsVoices } from "@/lib/elevenlabs";
import { route, isHttpError } from "@/lib/api";

async function handlePOST() {
  if (!isElevenLabsConfigured()) {
    return NextResponse.json(
      { error: "ElevenLabs ist noch nicht konfiguriert." },
      { status: 422 }
    );
  }

  const workspaceId = await getCurrentWorkspaceId();

  try {
    const remoteVoices = await listElevenLabsVoices();
    const existing = await prisma.voice.findMany({ where: { workspaceId } });
    const existingIds = new Set(existing.map((v) => v.providerVoiceId));

    // Nur allgemeine Standardstimmen von ElevenLabs — eigene/geklonte Stimmen des
    // Betreiberkontos werden nicht an Kunden weitergegeben.
    const toCreate = remoteVoices.filter((v) => v.category === "premade" && !existingIds.has(v.voice_id));
    const created = await prisma.$transaction(
      toCreate.map((v) =>
        prisma.voice.create({
          data: {
            workspaceId,
            name: v.name,
            providerVoiceId: v.voice_id,
            language: v.labels?.language ?? "de",
            style: v.labels?.description ?? v.category ?? "",
            description: v.category ?? "",
          },
        })
      )
    );

    return NextResponse.json({ imported: created.length });
  } catch (error) {
    if (isHttpError(error)) throw error;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unbekannter Fehler." },
      { status: 502 }
    );
  }
}

export const POST = route(handlePOST);
