import { prisma } from "@/lib/db";
import type { ContentStatus } from "@prisma/client";

/**
 * Freigabe-Workflow der Content Factory, serverseitig erzwungen:
 *  - Planen und Veröffentlichen nur nach Freigabe (APPROVED/SCHEDULED).
 *  - Jede inhaltliche Änderung entzieht eine bestehende Freigabe
 *    (zurück auf IN_REVIEW, Termin bleibt nur als Information).
 *  - Veröffentlichen ist gegen parallelen Doppelversand gesperrt.
 */
export class WorkflowError extends Error {
  constructor(message: string, readonly status = 409) {
    super(message);
  }
}

import { isActionAllowed, REFUSAL, type WorkflowAction } from "@/lib/contentWorkflowRules";

export { isActionAllowed, type WorkflowAction };

export function assertActionAllowed(action: WorkflowAction, status: ContentStatus) {
  if (!isActionAllowed(action, status)) throw new WorkflowError(REFUSAL[action]);
}

/** Nach einer inhaltlichen Änderung: Freigabe entziehen. Gibt true zurück, wenn entzogen wurde. */
export async function revokeApprovalOnChange(contentItemId: string): Promise<boolean> {
  const res = await prisma.contentItem.updateMany({
    where: { id: contentItemId, status: { in: ["APPROVED", "SCHEDULED"] } },
    data: { status: "IN_REVIEW" },
  });
  return res.count > 0;
}

const PUBLISH_LOCK_MS = 10 * 60 * 1000;

/**
 * Sperre für genau einen Veröffentlichungsversuch. Atomar über ein bedingtes
 * UPDATE: Nur wer die Zeile von „frei“ auf „läuft“ setzt, darf senden.
 * Eine hängengebliebene Sperre verfällt nach 10 Minuten.
 */
export async function claimPublishLock(contentItemId: string): Promise<boolean> {
  const now = new Date();
  const res = await prisma.contentItem.updateMany({
    where: {
      id: contentItemId,
      status: { in: ["APPROVED", "SCHEDULED"] },
      OR: [{ publishingStartedAt: null }, { publishingStartedAt: { lt: new Date(now.getTime() - PUBLISH_LOCK_MS) } }],
    },
    data: { publishingStartedAt: now },
  });
  return res.count === 1;
}

export async function releasePublishLock(contentItemId: string) {
  await prisma.contentItem.updateMany({ where: { id: contentItemId }, data: { publishingStartedAt: null } });
}
