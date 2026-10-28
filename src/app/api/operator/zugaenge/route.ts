import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSessionUser } from "@/lib/auth/session";
import { route } from "@/lib/api";
import { canStoreSettings, operatorSettingsStatus, saveOperatorSetting, SettingError } from "@/lib/operatorSettings";

/**
 * Zugänge des Betreibers (nur Betreiberkonto; der Proxy sperrt /api/operator
 * zusätzlich für alle anderen). Gibt geheime Werte nie zurück.
 */
async function requireOperator() {
  const user = await requireSessionUser();
  if (!user.isOperator) return null;
  return user;
}

async function handleGET() {
  if (!(await requireOperator())) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  return NextResponse.json({ speicherbar: canStoreSettings(), zugaenge: await operatorSettingsStatus() });
}

const schema = z.object({ key: z.string().min(1).max(80), value: z.string().max(2000) });

async function handlePOST(request: Request) {
  const user = await requireOperator();
  if (!user) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  try {
    const result = await saveOperatorSetting({
      key: parsed.data.key,
      value: parsed.data.value,
      userId: user.userId,
      workspaceId: user.workspaceId,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof SettingError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export const GET = route(handleGET);
export const POST = route(handlePOST);
