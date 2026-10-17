/**
 * Erklärvideos zu jedem Bereich der App. Die Aufnahmen (public/schulung/videos/<key>.mp4)
 * sind stumm; Untertitel und Vorlesestimme kommen aus messages/<sprache>/schulungVideos.json,
 * die Zeitmarken aus public/schulung/videos/<key>.json.
 */
export const TRAINING_VIDEO_KEYS = [
  "start", "dashboard", "schulung", "contentFactory", "ideas", "contentBrain", "brandDna",
  "scriptStudio", "voiceStudio", "videoStudio", "designStudio", "socialMedia", "calendar",
  "analytics", "growth", "revenue", "sales", "website", "inbox", "agents", "integrations",
  "billing", "settings",
] as const;
export type TrainingVideoKey = (typeof TRAINING_VIDEO_KEYS)[number];
export function isTrainingVideoKey(v: string): v is TrainingVideoKey {
  return (TRAINING_VIDEO_KEYS as readonly string[]).includes(v);
}
export interface TrainingCueTiming { id: string; start: number; end: number }
