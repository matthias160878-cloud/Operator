import { Brain } from "lucide-react";
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
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[280px] shrink-0">
      <div className="absolute inset-[6%] rounded-full border border-border/70" />
      <div className="absolute inset-[22%] rounded-full border border-border/50" />

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-accent via-accent-3 to-accent-2 shadow-[0_0_45px_rgba(109,91,255,0.55)]">
          <div className="absolute inset-0 animate-pulse rounded-full bg-accent/30 blur-xl" />
          <Brain className="relative h-9 w-9 text-white" />
        </div>
      </div>

      {platforms.slice(0, 6).map((p, i) => (
        <div
          key={p.key}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={positionStyle(ANGLES_DEG[i], 42)}
          title={`${p.label} — ${p.connected ? "verbunden" : "nicht konfiguriert"}`}
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
