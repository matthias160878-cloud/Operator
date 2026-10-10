import { prisma } from "@/lib/db";
import {
  ComposioError,
  authConfigIdFor,
  composioUserIdFor,
  createConnectLink,
  deleteConnectedAccount,
  executeTool,
  getConnectedAccount,
  isToolkitConfigured,
  newCallbackState,
  sanitizeComposioMessage,
  stateMatches,
} from "@/lib/composio/client";
import { readToolFor, type ComposioToolkit } from "@/lib/composio/toolkits";

/**
 * Workspace-bezogene Composio-Abläufe. Jede Funktion bekommt die
 * Workspace-ID aus der Sitzung (getCurrentWorkspaceId) — Konten anderer
 * Kunden sind so weder sichtbar noch steuerbar.
 */
const PENDING_TTL_MS = 15 * 60 * 1000;

export type CallbackOutcome =
  | { ok: true; toolkit: ComposioToolkit }
  | { ok: false; reason: "invalid_state" | "expired" | "mismatch" | "not_active" | "composio_error"; message?: string };

export async function startConnection(input: {
  workspaceId: string;
  toolkit: ComposioToolkit;
  appOrigin: string;
}): Promise<{ redirectUrl: string }> {
  const { workspaceId, toolkit } = input;
  if (!isToolkitConfigured(toolkit)) {
    throw new ComposioError(`${toolkit.label} ist über Composio noch nicht eingerichtet.`);
  }
  const existing = await prisma.composioConnection.findUnique({
    where: { workspaceId_toolkit: { workspaceId, toolkit: toolkit.key } },
  });
  const { state, hash } = newCallbackState();
  const callbackUrl = `${input.appOrigin}/api/composio/callback?toolkit=${toolkit.key}&state=${encodeURIComponent(state)}`;
  const link = await createConnectLink({
    authConfigId: authConfigIdFor(toolkit)!,
    userId: composioUserIdFor(workspaceId),
    callbackUrl,
    // Beim Erneuern bleibt die alte Verbindung bestehen, bis die neue aktiv ist.
    allowMultiple: Boolean(existing?.connectedAccountId),
  });
  const pending = {
    pendingAccountId: link.connectedAccountId,
    stateHash: hash,
    pendingExpiresAt: new Date(Date.now() + PENDING_TTL_MS),
  };
  await prisma.composioConnection.upsert({
    where: { workspaceId_toolkit: { workspaceId, toolkit: toolkit.key } },
    create: { workspaceId, toolkit: toolkit.key, status: "PENDING", ...pending },
    update: { ...pending, ...(existing?.connectedAccountId ? {} : { status: "PENDING" }), lastError: null },
  });
  return { redirectUrl: link.redirectUrl };
}

export async function completeConnection(input: {
  workspaceId: string;
  toolkit: ComposioToolkit;
  state: string | null;
  connectedAccountIdParam: string | null;
}): Promise<CallbackOutcome> {
  const { workspaceId, toolkit } = input;
  const row = await prisma.composioConnection.findUnique({
    where: { workspaceId_toolkit: { workspaceId, toolkit: toolkit.key } },
  });
  if (!row || !row.pendingAccountId || !stateMatches(input.state, row.stateHash)) {
    return { ok: false, reason: "invalid_state" };
  }
  if (!row.pendingExpiresAt || row.pendingExpiresAt.getTime() < Date.now()) {
    await clearPending(row.id, row.connectedAccountId ? row.status : "FAILED", "Anmeldung abgelaufen.");
    return { ok: false, reason: "expired" };
  }
  if (input.connectedAccountIdParam && input.connectedAccountIdParam !== row.pendingAccountId) {
    await clearPending(row.id, row.connectedAccountId ? row.status : "FAILED", "Rückmeldung passt nicht zur Anfrage.");
    return { ok: false, reason: "mismatch" };
  }

  let account;
  try {
    account = await getConnectedAccount(row.pendingAccountId);
  } catch (err) {
    const message = err instanceof ComposioError ? err.message : "Composio-Abfrage fehlgeschlagen.";
    await clearPending(row.id, row.connectedAccountId ? row.status : "FAILED", message);
    return { ok: false, reason: "composio_error", message };
  }
  // Das Konto muss genau diesem Kunden und diesem Toolkit gehören.
  if (account.userId !== composioUserIdFor(workspaceId) || (account.toolkitSlug && account.toolkitSlug !== toolkit.slug)) {
    await clearPending(row.id, row.connectedAccountId ? row.status : "FAILED", "Konto gehört nicht zu diesem Arbeitsbereich.");
    return { ok: false, reason: "mismatch" };
  }
  if (account.status !== "ACTIVE") {
    await clearPending(
      row.id,
      row.connectedAccountId ? row.status : "FAILED",
      `Composio meldet Status ${sanitizeComposioMessage(account.status)}.`
    );
    return { ok: false, reason: "not_active" };
  }

  const previous = row.connectedAccountId;
  await prisma.composioConnection.update({
    where: { id: row.id },
    data: {
      status: "ACTIVE",
      connectedAccountId: account.id,
      pendingAccountId: null,
      stateHash: null,
      pendingExpiresAt: null,
      lastError: null,
      lastReadTestAt: null,
      lastReadTestOk: null,
      accountLabel: "",
    },
  });
  if (previous && previous !== account.id) {
    // Erneuerung: alte Verbindung erst jetzt entfernen.
    await deleteConnectedAccount(previous).catch(() => undefined);
  }
  return { ok: true, toolkit };
}

async function clearPending(id: string, status: string, message: string) {
  await prisma.composioConnection.update({
    where: { id },
    data: { pendingAccountId: null, stateHash: null, pendingExpiresAt: null, status, lastError: message },
  });
}

/** Lesender Zugriffstest. Speichert nur Erfolg, Zeitpunkt und einen kurzen Kontonamen. */
export async function runReadTest(input: { workspaceId: string; connectionId: string; toolkit: ComposioToolkit }) {
  const row = await prisma.composioConnection.findFirst({
    where: { id: input.connectionId, workspaceId: input.workspaceId },
  });
  if (!row?.connectedAccountId) throw new ComposioError("Keine aktive Verbindung.");
  const now = new Date();
  try {
    const result = await executeTool({
      tool: readToolFor(input.toolkit),
      connectedAccountId: row.connectedAccountId,
      userId: composioUserIdFor(input.workspaceId),
      arguments: input.toolkit.readArguments,
    });
    const label = result.successful ? extractLabel(result.data) : "";
    await prisma.composioConnection.update({
      where: { id: row.id },
      data: {
        lastReadTestAt: now,
        lastReadTestOk: result.successful,
        lastError: result.successful ? null : result.error || "Lesetest ohne Erfolg.",
        ...(label ? { accountLabel: label } : {}),
      },
    });
    return { ok: result.successful, label, error: result.successful ? null : result.error || "Lesetest ohne Erfolg." };
  } catch (err) {
    const message = err instanceof ComposioError ? err.message : "Lesetest fehlgeschlagen.";
    await prisma.composioConnection.update({
      where: { id: row.id },
      data: { lastReadTestAt: now, lastReadTestOk: false, lastError: message },
    });
    return { ok: false, label: "", error: message };
  }
}

export async function disconnect(input: { workspaceId: string; connectionId: string }) {
  const row = await prisma.composioConnection.findFirst({
    where: { id: input.connectionId, workspaceId: input.workspaceId },
  });
  if (!row) return false;
  for (const id of [row.connectedAccountId, row.pendingAccountId]) {
    if (id) await deleteConnectedAccount(id);
  }
  await prisma.composioConnection.update({
    where: { id: row.id },
    data: {
      status: "DISCONNECTED",
      connectedAccountId: null,
      pendingAccountId: null,
      stateHash: null,
      pendingExpiresAt: null,
      accountLabel: "",
      lastReadTestAt: null,
      lastReadTestOk: null,
      lastError: null,
    },
  });
  return true;
}

const LABEL_KEYS = ["username", "name", "title", "localizedFirstName"];

/** Sucht in der Antwort einen kurzen Anzeigenamen (höchstens drei Ebenen tief). */
export function extractLabel(data: unknown, depth = 0): string {
  if (!data || depth > 3) return "";
  if (typeof data === "string") {
    try {
      return extractLabel(JSON.parse(data), depth + 1);
    } catch {
      return "";
    }
  }
  if (Array.isArray(data)) return data.length ? extractLabel(data[0], depth + 1) : "";
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    for (const k of LABEL_KEYS) {
      const v = obj[k];
      if (typeof v === "string" && v.trim()) return v.trim().slice(0, 80);
    }
    for (const v of Object.values(obj)) {
      const found = extractLabel(v, depth + 1);
      if (found) return found;
    }
  }
  return "";
}
