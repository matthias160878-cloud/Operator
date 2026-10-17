import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { isPlanKey, PLANS, type PlanKey } from "@/lib/plans";

/**
 * Promocodes des Betreibers: schalten ein Paket dauerhaft frei, ohne Stripe.
 * - Klartext nur einmal beim Anlegen sichtbar; gespeichert wird ein SHA-256-Hash.
 * - Jeder Code hat eine feste Zahl Einlösungen (Standard 1), je Arbeitsbereich
 *   höchstens einmal. Einlösen ist atomar (bedingtes UPDATE), zwei gleichzeitige
 *   Versuche können einen Code nicht doppelt verbrauchen.
 * - Ein laufendes bezahltes Abo wird nie durch einen Code ersetzt.
 */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // ohne 0/O/1/I

export function hashPromoCode(code: string): string {
  return createHash("sha256").update(normalizePromoCode(code)).digest("hex");
}

export function normalizePromoCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function newCode(): string {
  const bytes = randomBytes(12);
  let out = "";
  for (let i = 0; i < 12; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
    if (i === 3 || i === 7) out += "-";
  }
  return `S58-${out}`;
}

export class PromoError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

export async function createPromoCodes(input: { plan: string; anzahl: number; label: string; createdById: string }) {
  const plan = input.plan.toUpperCase();
  if (!isPlanKey(plan)) throw new PromoError("Unbekanntes Paket.", 400);
  const anzahl = Math.floor(input.anzahl);
  if (!Number.isFinite(anzahl) || anzahl < 1 || anzahl > 20) throw new PromoError("Anzahl: 1 bis 20.", 400);
  const label = input.label.trim().slice(0, 80);
  const codes: string[] = [];
  for (let i = 0; i < anzahl; i++) {
    const code = newCode();
    await prisma.promoCode.create({
      data: { codeHash: hashPromoCode(code), hint: code.slice(-4), plan, label, createdById: input.createdById },
    });
    codes.push(code);
  }
  return { plan: plan as PlanKey, codes };
}

export async function listPromoCodes() {
  const rows = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return rows.map((r) => ({
    id: r.id,
    hint: `…${r.hint}`,
    plan: r.plan,
    label: r.label,
    usedCount: r.usedCount,
    maxUses: r.maxUses,
    createdAt: r.createdAt,
  }));
}

export async function redeemPromoCode(input: { code: string; workspaceId: string; userId: string }) {
  const normalized = normalizePromoCode(input.code);
  if (normalized.length < 8) throw new PromoError("Bitte einen gültigen Promocode eingeben.", 400);
  const row = await prisma.promoCode.findUnique({ where: { codeHash: hashPromoCode(normalized) } });
  if (!row) throw new PromoError("Dieser Promocode ist nicht gültig.", 404);
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) throw new PromoError("Dieser Promocode ist abgelaufen.", 410);
  if (!isPlanKey(row.plan)) throw new PromoError("Dieser Promocode ist nicht gültig.", 404);

  const current = await prisma.workspacePlan.findUnique({ where: { workspaceId: input.workspaceId } });
  if (current?.status === "ACTIVE" && current.source === "STRIPE") {
    throw new PromoError("Dieser Arbeitsbereich hat bereits ein bezahltes Paket. Der Code wurde nicht verbraucht.", 409);
  }
  if (current?.status === "ACTIVE" && current.source === "PROMO" && current.plan === row.plan) {
    throw new PromoError(`${PLANS[row.plan].name} ist hier bereits freigeschaltet. Der Code wurde nicht verbraucht.`, 409);
  }

  // Atomar: nur wenn noch Einlösungen frei sind.
  const claimed = await prisma.promoCode.updateMany({
    where: { id: row.id, usedCount: { lt: row.maxUses } },
    data: { usedCount: { increment: 1 } },
  });
  if (claimed.count !== 1) throw new PromoError("Dieser Promocode wurde bereits eingelöst.", 409);

  try {
    await prisma.promoRedemption.create({ data: { promoCodeId: row.id, workspaceId: input.workspaceId } });
  } catch {
    // Derselbe Arbeitsbereich hat diesen Code schon — Zählung zurücknehmen.
    await prisma.promoCode.update({ where: { id: row.id }, data: { usedCount: { decrement: 1 } } });
    throw new PromoError("Dieser Promocode wurde hier bereits eingelöst.", 409);
  }

  await prisma.workspacePlan.upsert({
    where: { workspaceId: input.workspaceId },
    create: { workspaceId: input.workspaceId, plan: row.plan, status: "ACTIVE", source: "PROMO", billingMode: "promo", activatedAt: new Date() },
    update: { plan: row.plan, status: "ACTIVE", source: "PROMO", billingMode: "promo", activatedAt: new Date(), currentPeriodEnd: null, cancelAtPeriodEnd: false },
  });
  await prisma.auditLog.create({
    data: { workspaceId: input.workspaceId, userId: input.userId, action: "promo.eingeloest", detail: `${row.plan} (…${row.hint})` },
  });
  return { plan: row.plan as PlanKey, name: PLANS[row.plan].name };
}
