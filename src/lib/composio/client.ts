import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { ComposioToolkit } from "@/lib/composio/toolkits";

/**
 * Serverseitiger Composio-Client (REST API v3). Der Schlüssel kommt
 * ausschließlich aus COMPOSIO_API_KEY in der Server-Umgebung; er wird weder
 * an den Browser gegeben noch geloggt. Fehlermeldungen von Composio werden
 * gekürzt und von schlüsselähnlichen Zeichenfolgen bereinigt, bevor sie
 * gespeichert oder angezeigt werden.
 */
const DEFAULT_BASE_URL = "https://backend.composio.dev";
const TIMEOUT_MS = 10_000;

export class ComposioError extends Error {
  constructor(
    message: string,
    readonly status: number | null = null
  ) {
    super(message);
  }
}

export function isComposioConfigured(): boolean {
  return Boolean(process.env.COMPOSIO_API_KEY?.trim());
}

export function authConfigIdFor(toolkit: ComposioToolkit): string | null {
  const value = process.env[toolkit.authConfigEnv]?.trim();
  return value ? value : null;
}

export function isToolkitConfigured(toolkit: ComposioToolkit): boolean {
  return isComposioConfigured() && authConfigIdFor(toolkit) !== null;
}

function baseUrl(): string {
  return (process.env.COMPOSIO_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

/**
 * Kennung des Kunden bei Composio. Abgeleitet aus der Workspace-ID, mit
 * Umgebungspräfix, damit Test- und Live-Betrieb im selben Composio-Projekt
 * sich nicht überschneiden. Nie aus Anfrageparametern.
 */
export function composioUserIdFor(workspaceId: string): string {
  const prefix = (process.env.COMPOSIO_USER_PREFIX?.trim() || "s58").replace(/[^a-zA-Z0-9-]/g, "");
  return `${prefix}-ws-${workspaceId}`;
}

export function sanitizeComposioMessage(text: string): string {
  return text
    .replace(/(ak|sk|pk|ac|ca|key|token)[-_][A-Za-z0-9_-]{12,}/gi, "[…]")
    .replace(/[A-Za-z0-9_-]{32,}/g, "[…]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

/** Zufälliger Sicherheitscode für die Rückkehr von Composio (nur Hash wird gespeichert). */
export function newCallbackState(): { state: string; hash: string } {
  const state = randomBytes(24).toString("base64url");
  return { state, hash: hashState(state) };
}

export function hashState(state: string): string {
  const pepper = process.env.TOKEN_ENCRYPTION_KEY || process.env.MEDIA_URL_SECRET || "secret58-composio-state";
  return createHmac("sha256", pepper).update(state).digest("hex");
}

export function stateMatches(state: string | null, storedHash: string | null): boolean {
  if (!state || !storedHash) return false;
  const a = Buffer.from(hashState(state), "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function shortFingerprint(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 8);
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const key = process.env.COMPOSIO_API_KEY?.trim();
  if (!key) throw new ComposioError("Composio ist auf dem Server nicht eingerichtet.");
  let res: Response;
  try {
    res = await fetch(`${baseUrl()}${path}`, {
      method,
      headers: {
        "x-api-key": key,
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new ComposioError("Composio ist gerade nicht erreichbar.");
  }
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err = (data as { error?: { message?: string } | string; message?: string } | null) ?? null;
    const raw =
      (typeof err?.error === "object" ? err.error?.message : typeof err?.error === "string" ? err.error : undefined) ??
      err?.message ??
      `HTTP ${res.status}`;
    if (res.status === 401 || res.status === 403) {
      throw new ComposioError("Composio hat den Server-Schlüssel abgelehnt (401/403).", res.status);
    }
    throw new ComposioError(sanitizeComposioMessage(String(raw)), res.status);
  }
  return data as T;
}

export interface ComposioLink {
  connectedAccountId: string;
  redirectUrl: string;
}

export async function createConnectLink(input: {
  authConfigId: string;
  userId: string;
  callbackUrl: string;
  allowMultiple: boolean;
}): Promise<ComposioLink> {
  const data = await call<{ redirect_url?: string; connected_account_id?: string; id?: string }>(
    "POST",
    "/api/v3/connected_accounts/link",
    {
      auth_config_id: input.authConfigId,
      user_id: input.userId,
      callback_url: input.callbackUrl,
      allow_multiple: input.allowMultiple,
    }
  );
  const connectedAccountId = data?.connected_account_id ?? data?.id;
  const redirectUrl = data?.redirect_url;
  if (!connectedAccountId || !redirectUrl || !/^https:\/\//.test(redirectUrl)) {
    throw new ComposioError("Composio hat keinen gültigen Anmeldelink geliefert.");
  }
  return { connectedAccountId, redirectUrl };
}

export interface ComposioAccount {
  id: string;
  userId: string | null;
  status: string;
  toolkitSlug: string | null;
}

export async function getConnectedAccount(id: string): Promise<ComposioAccount> {
  const data = await call<{
    id?: string;
    user_id?: string;
    status?: string;
    toolkit?: { slug?: string };
  }>("GET", `/api/v3/connected_accounts/${encodeURIComponent(id)}`);
  return {
    id: data?.id ?? id,
    userId: data?.user_id ?? null,
    status: String(data?.status ?? "UNKNOWN").toUpperCase(),
    toolkitSlug: data?.toolkit?.slug?.toLowerCase() ?? null,
  };
}

export async function deleteConnectedAccount(id: string): Promise<void> {
  try {
    await call("DELETE", `/api/v3/connected_accounts/${encodeURIComponent(id)}`);
  } catch (err) {
    // Bereits gelöscht ist für uns gleichbedeutend mit getrennt.
    if (err instanceof ComposioError && err.status === 404) return;
    throw err;
  }
}

export interface ComposioExecution {
  successful: boolean;
  data: unknown;
  error: string | null;
}

export async function executeTool(input: {
  tool: string;
  connectedAccountId: string;
  userId: string;
  arguments: Record<string, unknown>;
}): Promise<ComposioExecution> {
  const data = await call<{ successful?: boolean; data?: unknown; error?: unknown }>(
    "POST",
    `/api/v3/tools/execute/${encodeURIComponent(input.tool)}`,
    {
      connected_account_id: input.connectedAccountId,
      user_id: input.userId,
      arguments: input.arguments,
      version: "latest",
    }
  );
  return {
    successful: data?.successful === true,
    data: data?.data ?? null,
    error: data?.error ? sanitizeComposioMessage(String(data.error)) : null,
  };
}
