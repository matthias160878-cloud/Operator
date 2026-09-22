import type { PlatformAccount } from "@prisma/client";
import { prisma } from "@/lib/db";
import { decryptToken, encryptToken } from "@/lib/crypto";
import { getProvider, refreshAccessToken } from "@/lib/oauth/providers";

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
