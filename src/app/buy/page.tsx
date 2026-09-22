import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { isStripeConfigured, getConfiguredPrice } from "@/lib/stripe";
import { BuyButton } from "@/components/buy/BuyButton";

export const dynamic = "force-dynamic";

const FEATURES = [
  "Content Brain — eine Idee, alle Plattformen",
  "Script-, Hook-, Hashtag- und Thumbnail-Agenten",
  "Content Factory mit Freigabe-Workflow",
  "Content Kalender, Analytics & Wachstums-Empfehlungen",
  "Posteingang mit KI-Antwortentwürfen",
  "Einnahmen-Tracking über alle Plattformen",
];

export default async function BuyPage() {
  const configured = isStripeConfigured();
  const price = await getConfiguredPrice();

  return (
    <div className="flex min-h-screen items-center justify-center bg-grid px-4 py-12">
      <div className="card relative w-full max-w-xl overflow-hidden p-8 text-center">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-accent-2/20 blur-3xl" />

        <div className="relative mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full shadow-[0_0_40px_rgba(109,91,255,0.5)]">
          <Image src="/brand/brain-core.png" alt="SECRET 58" fill sizes="96px" className="object-cover" priority />
        </div>

        <div className="relative">
          <div className="text-xs uppercase tracking-[0.25em] text-accent-2">AI Social Command Center</div>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">SECRET 58</h1>
          <p className="mt-2 text-sm text-muted">
            Eine Idee. Mehrere Plattformen. Maximale Reichweite. Schalte den vollständigen
            Zugriff frei.
          </p>

          <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm text-foreground">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                {f}
              </li>
            ))}
          </ul>

          {price && (
            <div className="mt-6 text-3xl font-semibold text-foreground">
              {price.formatted}
              <span className="ml-1 text-sm font-normal text-muted">einmalig</span>
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <BuyButton configured={configured} />
          </div>
        </div>
      </div>
    </div>
  );
}
