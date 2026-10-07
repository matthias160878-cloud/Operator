import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { route } from "@/lib/api";

const SETTING_KEY = "onboardingCompleted";

async function handlePOST() {
  const workspaceId = await getCurrentWorkspaceId();
  await prisma.setting.upsert({
    where: { workspaceId_key: { workspaceId, key: SETTING_KEY } },
    create: { workspaceId, key: SETTING_KEY, value: "true" },
    update: { value: "true" },
  });
  return NextResponse.json({ completed: true });
}

export const POST = route(handlePOST);
