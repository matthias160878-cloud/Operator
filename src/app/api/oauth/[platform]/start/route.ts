import { NextResponse } from "next/server";
import {
  buildAuthorizeUrl,
  generatePkcePair,
  getProvider,
  isProviderConfigured,
  randomState,
} from "@/lib/oauth/providers";
import { isTokenEncryptionConfigured } from "@/lib/crypto";

const STATE_COOKIE = "s58_oauth_state";
const PKCE_COOKIE = "s58_oauth_pkce";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform: platformParam } = await params;
  const platform = platformParam.toUpperCase();
  const provider = getProvider(platform);
  const origin = new URL(request.url).origin;

  if (!provider) {
    return NextResponse.redirect(new URL("/social-media?oauth_error=unknown_platform", origin));
  }
  if (!isProviderConfigured(provider)) {
    return NextResponse.redirect(
      new URL(`/social-media?oauth_error=not_configured&platform=${platform}`, origin)
    );
  }
  if (!isTokenEncryptionConfigured()) {
    return NextResponse.redirect(new URL("/social-media?oauth_error=encryption_key_missing", origin));
  }

  const redirectUri = `${origin}/api/oauth/${platform}/callback`;
  const state = randomState();

  let pkceChallenge: string | undefined;
  let pkceVerifier: string | undefined;
  if (provider.usesPkce) {
    const pair = generatePkcePair();
    pkceChallenge = pair.challenge;
    pkceVerifier = pair.verifier;
  }

  const finalUrl = buildAuthorizeUrl(provider, redirectUri, state, pkceChallenge);
  const response = NextResponse.redirect(finalUrl);

  response.cookies.set(STATE_COOKIE, `${platform}:${state}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: 600,
    path: "/",
  });
  if (pkceVerifier) {
    response.cookies.set(PKCE_COOKIE, pkceVerifier, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: 600,
      path: "/",
    });
  }

  return response;
}
