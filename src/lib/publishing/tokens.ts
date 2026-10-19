import type { PlatformAccount } from "@prisma/client";
import { prisma } from "@/lib/db";
import { decryptToken, encryptToken } from "@/lib/crypto";
import { getMessagingProvider, getProvider, refreshAccessToken } from "@/lib/oauth/providers";

const EXPIRY_SAFETY_MARGIN_MS = 60_000;

/**
 * Liefert einen gültigen Zugangstoken für einen verbundenen Plattform-
 * Account — erneuert ihn bei Bedarf (nur möglich, wenn die Plattform
 * einen Refresh-Token ausgibt, siehe providers.ts). Wirft einen klaren
 * Fehler statt still fehlzuschlagen, wenn kein gültiger Token verfügbar
 * ist (z.B. nach 60 Tagen bei LinkedIn ohne Refresh-Zugriff).
 */
export async function getValidAccessToken(account: PlatformAccount): Promise<string> {
  if (!account.accessTokenEnc) {
    throw new Error("Kein Zugangstoken gespeichert — Account erneut verbinden.");
  }
  const isExpired =
    account.tokenExpiresAt && account.tokenExpiresAt.getTime() - EXPIRY_SAFETY_MARGIN_MS < Date.now();

  if (!isExpired) {
    return decryptToken(account.accessTokenEnc);
  }

  if (!account.refreshTokenEnc) {
    throw new Error(
      `Zugangstoken für ${account.platform} ist abgelaufen und kann nicht automatisch erneuert werden — bitte unter "Social Media" erneut verbinden.`
    );
  }

  const provider = getProvider(account.platform);
  if (!provider) {
    throw new Error(`Unbekannte Plattform: ${account.platform}`);
  }

  const refreshToken = decryptToken(account.refreshTokenEnc);
  const result = await refreshAccessToken(provider, refreshToken);

  await prisma.platformAccount.update({
    where: { id: account.id },
    data: {
      accessTokenEnc: encryptToken(result.accessToken),
      refreshTokenEnc: encryptToken(result.refreshToken ?? refreshToken),
      tokenExpiresAt: result.expiresInSeconds
        ? new Date(Date.now() + result.expiresInSeconds * 1000)
        : null,
    },
  });

  return result.accessToken;
}

/**
 * Wie `getValidAccessToken`, aber für die separate Posteingangs-Verbindung
 * (TikTok Business / LinkedIn-Unternehmensseite).
 */
export async function getValidMessagingToken(account: PlatformAccount): Promise<string> {
  if (!account.messagingAccessTokenEnc) {
    throw new Error(
      `Für ${account.platform} ist keine Posteingangs-Verbindung eingerichtet — unter "Social Media" → „Posteingang verbinden“ verbinden.`
    );
  }
  const isExpired =
    account.messagingTokenExpiresAt &&
    account.messagingTokenExpiresAt.getTime() - EXPIRY_SAFETY_MARGIN_MS < Date.now();
  if (!isExpired) return decryptToken(account.messagingAccessTokenEnc);

  const provider = getMessagingProvider(account.platform);
  if (!account.messagingRefreshTokenEnc || !provider) {
    throw new Error(
      `Posteingangs-Zugang für ${account.platform} ist abgelaufen und kann nicht automatisch erneuert werden — bitte erneut verbinden.`
    );
  }
  const refreshToken = decryptToken(account.messagingRefreshTokenEnc);
  const result = await refreshAccessToken(provider, refreshToken);
  await prisma.platformAccount.update({
    where: { id: account.id },
    data: {
      messagingAccessTokenEnc: encryptToken(result.accessToken),
      messagingRefreshTokenEnc: encryptToken(result.refreshToken ?? refreshToken),
      messagingTokenExpiresAt: result.expiresInSeconds
        ? new Date(Date.now() + result.expiresInSeconds * 1000)
        : null,
    },
  });
  return result.accessToken;
}
