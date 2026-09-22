import Image from "next/image";
import { useTranslations } from "next-intl";
import { PlatformGlyph, type PlatformGlyphKey } from "@/components/dashboard/PlatformGlyph";

export interface OrbitPlatform {
  key: PlatformGlyphKey;
  label: string;
  connected: boolean;
}

const ANGLES_DEG = [-90, -30, 30, 90, 150, 210];

function positionStyle(angleDeg: number, radiusPct: number): React.CSSProperties {
  const rad = (angleDeg * Math.PI) / 180;
  const left = 50 + radiusPct * Math.cos(rad);
  const top = 50 + radiusPct * Math.sin(rad);
  return { left: `${left}%`, top: `${top}%` };
}

/**
 * Das SECRET-58-Gehirn mit den Plattformen im Orbit (Abschnitt 26 im
 * Master-Prompt). Ein Badge leuchtet erst grün/aktiv, sobald die
 * zugehörige Plattform tatsächlich verbunden ist (`connected: true`,
 * abgeleitet vom echten `PlatformAccount`-Status) — nicht konfigurierte
 * Plattformen bleiben bewusst gedimmt statt eine Verbindung vorzutäuschen.
 */
export function BrainOrbit({ platforms }: { platforms: OrbitPlatform[] }) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[280px] shrink-0">
      <div className="absolute inset-[6%] rounded-full border border-border/70" />
      <div className="absolute inset-[22%] rounded-full border border-border/50" />

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative h-28 w-28 overflow-hidden rounded-full shadow-[0_0_50px_rgba(109,91,255,0.55)]">
          <Image
            src="/brand/brain-core.png"
            alt={t("orbit.brainAlt")}
            fill
            sizes="112px"
            className="object-cover"
            priority
          />
        </div>
      </div>

      {platforms.slice(0, 6).map((p, i) => (
        <div
          key={p.key}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={positionStyle(ANGLES_DEG[i], 42)}
          title={`${p.label} — ${p.connected ? tc("status.connected") : tc("status.notConfigured")}`}
        >
          <div
            className={
              "flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-sm transition-colors " +
              (p.connected
                ? "border-success/50 bg-success/15 text-success shadow-[0_0_16px_rgba(52,211,153,0.45)]"
                : "border-border bg-surface-2 text-muted grayscale")
            }
          >
            <PlatformGlyph platform={p.key} className="h-4.5 w-4.5" />
          </div>
          <span
            className={
              "absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface " +
              (p.connected ? "bg-success" : "bg-muted")
            }
          />
        </div>
      ))}
    </div>
  );
}
