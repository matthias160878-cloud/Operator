import { z } from "zod";
import { HAUPTKENNZAHLEN, SCHRITT_ARTEN } from "@/lib/reichweitenaufbau/kampagnenplan";
import { FORMAT_PLATTFORMEN } from "@/lib/reichweitenaufbau/plattformformate";

const datum = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Datum im Format JJJJ-MM-TT");

export const assistentSchema = z.object({
  titel: z.string().max(120),
  text: z.string().max(1000).default(""),
  ziel: z.string().max(300),
  hauptkennzahl: z.enum(Object.keys(HAUPTKENNZAHLEN) as [string, ...string[]]),
  zielgruppe: z.string().max(300),
  zielUrl: z.string().max(500),
  startAm: datum,
  endeAm: datum,
  verantwortlichId: z.string().max(40),
  budgetCent: z.number().int().positive().max(100_000_000).nullable(),
  erstellKennung: z.string().min(8).max(64),
});

export const planSchema = assistentSchema.omit({ erstellKennung: true, text: true }).partial();

export const schrittSchema = z.object({
  titel: z.string().min(1).max(200).optional(),
  notiz: z.string().max(1000).optional(),
  art: z.enum(Object.keys(SCHRITT_ARTEN) as [string, ...string[]]).optional(),
  faelligAm: datum.nullable().optional(),
  erledigt: z.boolean().optional(),
  verschieben: z.enum(["hoch", "runter"]).optional(),
});

const fakt = z.object({ text: z.string().max(500), quelle: z.string().max(300).default(""), geprueft: z.boolean().default(false) });
export const formatEingabeSchema = z.object({
  thema: z.string().max(200),
  kernaussage: z.string().max(400),
  zielgruppe: z.string().max(300).default(""),
  aufforderung: z.string().max(200).default(""),
  zielUrl: z.string().max(500).default(""),
  fakten: z.array(fakt).max(10).default([]),
  plattformen: z.array(z.enum(Object.keys(FORMAT_PLATTFORMEN) as [keyof typeof FORMAT_PLATTFORMEN, ...(keyof typeof FORMAT_PLATTFORMEN)[]])).min(1).max(5),
});
