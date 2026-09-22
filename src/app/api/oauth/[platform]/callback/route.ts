import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { exchangeCodeForToken, getProvider } from "@/lib/oauth/providers";
import { encryptToken } from "@/lib/crypto";

const STATE_COOKIE = "s58_oauth_state";
const PKCE_COOKIE = "s58_oauth_pkce";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform: platformParam } = await params;
  const platform = platformParam.toUpperCase();
  const origin = new URL(request.url).origin;
  const { searchParams } = new URL(request.url);

  const provider = getProvider(platform);
  if (!provider) {
    return NextResponse.redirect(new URL("/social-media?oauth_error=unknown_platform", origin));
  }

  const errorParam = searchParams.get("error");
  if (errorParam) {
    return NextResponse.redirect(
      new URL(`/social-media?oauth_error=denied&platform=${platform}`, origin)
    );
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const stateCookie = request.cookies.get(STATE_COOKIE)?.value;
  const pkceCookie = request.cookies.get(PKCE_COOKIE)?.value;

  if (!code || !state || !stateCookie || stateCookie !== `${platform}:${state}`) {
    return NextResponse.redirect(
      new URL(`/social-media?oauth_error=invalid_state&platform=${platform}`, origin)
    );
  }

  const redirectUri = `${origin}/api/oauth/${platform}/callback`;

  try {
    const workspaceId = await getCurrentWorkspaceId();
    const tokenResult = await exchangeCodeForToken(provider, code, redirectUri, pkceCookie);
    const accountInfo = await provider.fetchAccountInfo(tokenResult.accessToken);

    await prisma.platformAccount.upsert({
      where: { workspaceId_platform: { workspaceId, platform: platform as never } },
      create: {
        workspaceId,
        platform: platform as never,
        accountName: accountInfo.name,
        externalAccountId: accountInfo.externalId,
        status: "CONNECTED",
        accessTokenEnc: encryptToken(tokenResult.accessToken),
        refreshTokenEnc: tokenResult.refreshToken ? encryptToken(tokenResult.refreshToken) : null,
        tokenExpiresAt: tokenResult.expiresInSeconds
          ? new Date(Date.now() + tokenResult.expiresInSeconds * 1000)
          : null,
        lastError: null,
      },
      update: {
        accountName: accountInfo.name,
        externalAccountId: accountInfo.externalId,
        status: "CONNECTED",
        accessTokenEnc: encryptToken(tokenResult.accessToken),
        refreshTokenEnc: tokenResult.refreshToken ? encryptToken(tokenResult.refreshToken) : null,
        tokenExpiresAt: tokenResult.expiresInSeconds
          ? new Date(Date.now() + tokenResult.expiresInSeconds * 1000)
          : null,
        lastError: null,
      },
    });

    const response = NextResponse.redirect(new URL(`/social-media?connected=${platform}`, origin));
    response.cookies.delete(STATE_COOKIE);
    response.cookies.delete(PKCE_COOKIE);
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler beim Verbinden.";
    try {
      const workspaceId = await getCurrentWorkspaceId();
      await prisma.platformAccount.upsert({
        where: { workspaceId_platform: { workspaceId, platform: platform as never } },
        create: { workspaceId, platform: platform as never, status: "ERROR", lastError: message },
        update: { status: "ERROR", lastError: message },
      });
    } catch {
      // Fehlerprotokollierung darf den Redirect nicht zusätzlich blockieren.
    }
    const response = NextResponse.redirect(
      new URL(`/social-media?oauth_error=exchange_failed&platform=${platform}`, origin)
    );
    response.cookies.delete(STATE_COOKIE);
    response.cookies.delete(PKCE_COOKIE);
    return response;
  }
}
