import { createHash } from "node:crypto";
import type { PlanKern } from "@/lib/reichweitenaufbau/werbung";

const tag = (d: Date) => d.toISOString().slice(0, 10);

/** Prüfsumme über alles, was die Freigabe abdeckt. Jede Änderung daran macht die Freigabe ungültig. */
export function freigabeHash(p: PlanKern): string {
  return createHash("sha256")
    .update([p.plattform, p.ziel, tag(p.startAm), tag(p.endeAm), p.tagesbudgetCent, p.gesamtbudgetCent].join("|"))
    .digest("hex");
}
