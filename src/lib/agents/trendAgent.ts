export interface TrendItem {
  topic: string;
  source: string;
  date: string;
  relevance: "hoch" | "mittel" | "niedrig";
  suggestedIdea: string;
  suggestedPlatform: string;
  risk: string;
}

export interface TrendResult {
  configured: boolean;
  status: string;
  trends: TrendItem[];
}

/**
 * TrendAgent — recherchiert NUR dann aktuelle Themen, wenn eine echte
 * Trend-Datenquelle konfiguriert ist (TREND_API_KEY/TREND_API_PROVIDER).
 * Es werden niemals erfundene Trends angezeigt (Abschnitt 7).
 */
export async function getTrends(): Promise<TrendResult> {
  const configured = Boolean(
    process.env.TREND_API_KEY && process.env.TREND_API_PROVIDER
  );

  if (!configured) {
    return {
      configured: false,
      status: "Trend API nicht konfiguriert.",
      trends: [],
    };
  }

  // Kein Trend-Provider ist aktuell fest angebunden — sobald TREND_API_PROVIDER
  // einen unterstützten Wert enthält, kann hier der jeweilige Client ergänzt
  // werden, ohne die Konsumenten (Ideen & Inspiration, Content Brain) anzufassen.
  return {
    configured: true,
    status: `Trend-Provider "${process.env.TREND_API_PROVIDER}" ist konfiguriert, aber noch kein Client dafür implementiert.`,
    trends: [],
  };
}
