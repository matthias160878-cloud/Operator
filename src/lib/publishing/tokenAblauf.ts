/**
 * Hinweis vor Ablauf eines Plattform-Zugangs (z. B. LinkedIn, ca. 60 Tage),
 * wenn kein Refresh-Token vorliegt und der Zugang daher nicht automatisch
 * verlängert werden kann. Rein informativ, ändert nichts.
 */
export interface TokenAblaufHinweis {
  ablaufAm: Date;
  abgelaufen: boolean;
  /** Anzahl geplanter Beiträge dieser Plattform nach dem Ablaufdatum. */
  geplantNachAblauf: number;
  /** Rot: abgelaufen oder geplante Beiträge nach dem Ablauf. */
  kritisch: boolean;
}

export function tokenAblaufHinweis(
  account: { status: string; tokenExpiresAt: Date | null; refreshTokenEnc: string | null },
  geplanteTermine: (Date | null)[],
  jetzt: Date = new Date(),
): TokenAblaufHinweis | null {
  if (account.status !== "CONNECTED" || !account.tokenExpiresAt || account.refreshTokenEnc) return null;
  const ablaufAm = account.tokenExpiresAt;
  const abgelaufen = ablaufAm.getTime() <= jetzt.getTime();
  const geplantNachAblauf = geplanteTermine.filter((d) => d && d.getTime() >= ablaufAm.getTime()).length;
  return { ablaufAm, abgelaufen, geplantNachAblauf, kritisch: abgelaufen || geplantNachAblauf > 0 };
}
