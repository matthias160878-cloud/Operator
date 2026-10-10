import type { ContentStatus } from "@prisma/client";

/** Erlaubte Status-Übergänge der Content Factory — gemeinsam für Server und Oberfläche. */
export type WorkflowAction = "review" | "approve" | "reject" | "archive" | "schedule" | "publish";

export const ALLOWED_FROM: Record<WorkflowAction, ContentStatus[]> = {
  review: ["DRAFT", "REJECTED"],
  approve: ["DRAFT", "IN_REVIEW", "REJECTED"],
  reject: ["DRAFT", "IN_REVIEW", "APPROVED", "SCHEDULED"],
  archive: ["DRAFT", "IN_REVIEW", "APPROVED", "SCHEDULED", "REJECTED", "PUBLISHED"],
  schedule: ["APPROVED", "SCHEDULED"],
  publish: ["APPROVED", "SCHEDULED"],
};

export const REFUSAL: Record<WorkflowAction, string> = {
  review: "Zur Prüfung geben geht nur bei Entwürfen oder abgelehnten Beiträgen.",
  approve: "Freigeben geht nur bei Entwürfen oder Beiträgen in Prüfung.",
  reject: "Dieser Beitrag kann nicht mehr abgelehnt werden.",
  archive: "Dieser Beitrag ist bereits archiviert.",
  schedule: "Planen geht erst nach der Freigabe.",
  publish: "Veröffentlichen geht erst nach der Freigabe.",
};

export function isActionAllowed(action: WorkflowAction, status: ContentStatus): boolean {
  return ALLOWED_FROM[action].includes(status);
}

