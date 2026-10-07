import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { reserveQuota } from "@/lib/entitlements";
import { ALLOWED_ASSISTANTS, newPublicKey, newVerifyToken, normalizeOrigin } from "@/lib/website";
import { route } from "@/lib/api";

const schema = z.object({ url: z.string().min(3).max(300), assistant: z.enum(ALLOWED_ASSISTANTS).default("CHAT") });

async function handleGET() {
  const workspaceId = await getCurrentWorkspaceId();
  const sites = await prisma.websiteConnection.findMany({ where: { workspaceId, revokedAt: null }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ sites });
}

async function handlePOST(request: Request) {
  const workspaceId = await getCurrentWorkspaceId();
  const parsed = schema.safeParse(await request.json().catch(() => null));
  const origin = parsed.success ? normalizeOrigin(parsed.data.url) : null;
  if (!parsed.success || !origin) {
    return NextResponse.json({ error: "Bitte eine gültige https-Adresse angeben, z. B. https://meine-firma.de" }, { status: 400 });
  }
  const duplicate = await prisma.websiteConnection.findFirst({ where: { workspaceId, origin, revokedAt: null } });
  if (duplicate) return NextResponse.json({ error: "Diese Webseite ist bereits verbunden." }, { status: 409 });
  // Anzahl verbundener Webseiten ist eine Paketgrenze (atomar reserviert).
  const release = await reserveQuota(workspaceId, "WEBSITES");
  try {
    const site = await prisma.websiteConnection.create({
      data: { workspaceId, origin, assistant: parsed.data.assistant, publicKey: newPublicKey(), verifyToken: newVerifyToken() },
    });
    await prisma.auditLog.create({ data: { workspaceId, action: "website.added", detail: origin } });
    return NextResponse.json({ site });
  } catch (err) {
    await release();
    throw err;
  }
}

export const GET = route(handleGET);
export const POST = route(handlePOST);
