import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { isElevenLabsConfigured, listElevenLabsVoices } from "@/lib/elevenlabs";

export async function POST() {
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

    const toCreate = remoteVoices.filter((v) => !existingIds.has(v.voice_id));
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unbekannter Fehler." },
      { status: 502 }
    );
  }
}
