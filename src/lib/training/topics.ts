/**
 * Themen der Schulungsseite (/schulung): schriftliche Schritte je Bereich. Das passende
 * Erklärvideo (public/schulung/videos/<videoKey>.mp4, siehe src/lib/training/videos.ts)
 * steht im Abschnitt „Erklärvideos“ weiter oben; die Karte verlinkt darauf.
 */
import type { TrainingVideoKey } from "./videos";

export interface TrainingTopic {
  key: string;
  href?: string;
  videoKey: TrainingVideoKey;
}

export const TRAINING_TOPICS: TrainingTopic[] = [
  { key: "firstSteps", href: "/integrations", videoKey: "start" },
  { key: "contentBrainToFactory", href: "/content-brain", videoKey: "contentBrain" },
  { key: "studios", href: "/script-studio", videoKey: "scriptStudio" },
  { key: "calendarPublishing", href: "/calendar", videoKey: "calendar" },
  { key: "analyticsGrowth", href: "/analytics", videoKey: "analytics" },
  { key: "inbox", href: "/inbox", videoKey: "inbox" },
  { key: "revenue", href: "/revenue", videoKey: "revenue" },
  { key: "integrations", href: "/integrations", videoKey: "integrations" },
];
