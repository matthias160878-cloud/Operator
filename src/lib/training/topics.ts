/**
 * Themen der Schulungsseite (/schulung). `videoUrl` ist bewusst leer, bis
 * ein echtes Video existiert — die Seite zeigt dann ehrlich "Video folgt"
 * statt eine Aufnahme vorzutäuschen. Sobald ein Video aufgenommen ist,
 * hier die YouTube-/Vimeo-Einbettungs-URL eintragen (z. B.
 * "https://www.youtube.com/embed/VIDEO_ID"), mehr ist nicht nötig.
 */
export interface TrainingTopic {
  key: string;
  href?: string;
  videoUrl?: string;
}

export const TRAINING_TOPICS: TrainingTopic[] = [
  { key: "firstSteps", href: "/integrations" },
  { key: "contentBrainToFactory", href: "/content-brain" },
  { key: "studios", href: "/script-studio" },
  { key: "calendarPublishing", href: "/calendar" },
  { key: "analyticsGrowth", href: "/analytics" },
  { key: "inbox", href: "/inbox" },
  { key: "revenue", href: "/revenue" },
  { key: "integrations", href: "/integrations" },
];
