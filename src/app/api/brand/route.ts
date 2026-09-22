import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";

const brandSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  targetAudience: z.string().default(""),
  industry: z.string().default(""),
  language: z.string().default("Deutsch"),
  tonality: z.string().default(""),
  humor: z.string().default(""),
  formality: z.string().default(""),
  preferredWords: z.array(z.string()).default([]),
  forbiddenWords: z.array(z.string()).default([]),
  preferredCtas: z.array(z.string()).default([]),
  brandValues: z.array(z.string()).default([]),
  topics: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  fonts: z.array(z.string()).default([]),
  logoUrl: z.string().nullable().optional(),
  visualRules: z.string().default(""),
});

export async function GET() {
  const workspaceId = await getCurrentWorkspaceId();
  const brand = await prisma.brand.findUnique({ where: { workspaceId } });
  return NextResponse.json({ brand });
}

export async function PUT(request: Request) {
  const workspaceId = await getCurrentWorkspaceId();
  const body = await request.json().catch(() => null);
  const parsed = brandSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Eingabe.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const brand = await prisma.brand.upsert({
    where: { workspaceId },
    update: {
      name: data.name,
      description: data.description,
      targetAudience: data.targetAudience,
      industry: data.industry,
      language: data.language,
      tonality: data.tonality,
      humor: data.humor,
      formality: data.formality,
      preferredWords: JSON.stringify(data.preferredWords),
      forbiddenWords: JSON.stringify(data.forbiddenWords),
      preferredCtas: JSON.stringify(data.preferredCtas),
      brandValues: JSON.stringify(data.brandValues),
      topics: JSON.stringify(data.topics),
      colors: JSON.stringify(data.colors),
      fonts: JSON.stringify(data.fonts),
      logoUrl: data.logoUrl ?? null,
      visualRules: data.visualRules,
    },
    create: {
      workspaceId,
      name: data.name,
      description: data.description,
      targetAudience: data.targetAudience,
      industry: data.industry,
      language: data.language,
      tonality: data.tonality,
      humor: data.humor,
      formality: data.formality,
      preferredWords: JSON.stringify(data.preferredWords),
      forbiddenWords: JSON.stringify(data.forbiddenWords),
      preferredCtas: JSON.stringify(data.preferredCtas),
      brandValues: JSON.stringify(data.brandValues),
      topics: JSON.stringify(data.topics),
      colors: JSON.stringify(data.colors),
      fonts: JSON.stringify(data.fonts),
      logoUrl: data.logoUrl ?? null,
      visualRules: data.visualRules,
    },
  });

  return NextResponse.json({ brand });
}
