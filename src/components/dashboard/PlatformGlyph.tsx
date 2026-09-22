import type { SVGProps } from "react";

export type PlatformGlyphKey =
  | "YOUTUBE"
  | "INSTAGRAM"
  | "TIKTOK"
  | "LINKEDIN"
  | "FACEBOOK"
  | "X";

/**
 * Minimalistische, selbst gezeichnete Icon-Glyphen für die Plattform-Badges.
 * lucide-react führt aus Marken-/Lizenzgründen keine Social-Logos mehr —
 * daher hier bewusst vereinfachte, wiedererkennbare Formen statt exakter
 * Logo-Nachbildungen.
 */
function IconBase({ children, ...props }: SVGProps<SVGSVGElement> & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {children}
    </svg>
  );
}

const GLYPHS: Record<PlatformGlyphKey, (props: SVGProps<SVGSVGElement>) => React.ReactElement> = {
  YOUTUBE: (props) => (
    <IconBase {...props}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.2 9.3v5.4l4.8-2.7-4.8-2.7Z" fill="currentColor" />
    </IconBase>
  ),
  INSTAGRAM: (props) => (
    <IconBase {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </IconBase>
  ),
  TIKTOK: (props) => (
    <IconBase {...props}>
      <path
        d="M14.5 3v9.8a2.9 2.9 0 1 1-2.3-2.84"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M14.5 3c.35 2.3 2 4.05 4.3 4.3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </IconBase>
  ),
  LINKEDIN: (props) => (
    <IconBase {...props}>
      <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="8.3" cy="8.3" r="1.1" fill="currentColor" />
      <path d="M8.3 11v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M12.2 17v-3.6c0-1.2.9-2.1 2-2.1s1.8.9 1.8 2.1V17"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </IconBase>
  ),
  FACEBOOK: (props) => (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M13.6 8.4h1.3V6h-1.6c-1.5 0-2.6 1.1-2.6 2.7v1.5H9.3v2.4h1.4V18h2.4v-5.4h1.6l.3-2.4h-1.9V8.9c0-.3.2-.5.5-.5Z"
        fill="currentColor"
      />
    </IconBase>
  ),
  X: (props) => (
    <IconBase {...props}>
      <path
        d="M5 5l14 14M19 5 5 19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </IconBase>
  ),
};

export function PlatformGlyph({
  platform,
  className,
}: {
  platform: PlatformGlyphKey;
  className?: string;
}) {
  const Glyph = GLYPHS[platform];
  return <Glyph className={className} />;
}
