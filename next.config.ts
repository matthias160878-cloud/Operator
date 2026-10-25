import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { ZENTRALE_PAGES } from "./src/lib/zentralePages";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  // Mikrofon nur für die eigene Seite (Genesis-Spracheingabe), Kamera/Ort nie.
  { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Private Vorschau/Staging nicht von Suchmaschinen erfassen lassen.
  ...(process.env.SITE_NOINDEX === "true" ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Dateiaustausch: Uploads bis 10 MB (plus Formular-Overhead) müssen den Proxy vollständig passieren.
  experimental: { proxyClientMaxBodySize: "12mb" },
  // Neue Zentrale (Vorschau, löst später die Hauptseite ab). Weiterleitung statt Rewrite, damit
  // relative Pfade (bilder/, referenzen/, motion.css) unter /zentrale-neu/ aufgelöst werden;
  // der Browser behält dabei das #/<seite>-Fragment.
  async redirects() {
    return [{ source: "/zentrale-neu", destination: "/zentrale-neu/index.html", permanent: false }];
  },
  // Inhaltsseiten der Zentrale unter ihren gewohnten Adressen (statisches HTML).
  async rewrites() {
    return [
      ...Object.entries(ZENTRALE_PAGES).map(([source, file]) => ({
        source,
        destination: `/zentrale/seiten/${file}.html`,
      })),
      // Historische Kopien der Zentrale (statisches HTML unter public/verlauf).
      { source: "/verlauf", destination: "/verlauf/index.html" },
      { source: "/hauptseite", destination: "/hauptseite/index.html" },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Die neue Zentrale bettet eigene Seiten (Referenzen) per iframe ein; nur vom eigenen Ursprung.
      { source: "/zentrale-neu/:path*", headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }] },
      // Das Einbindungsskript wird von Kundenwebseiten geladen.
      { source: "/widget.js", headers: [{ key: "Cross-Origin-Resource-Policy", value: "cross-origin" }, { key: "Cache-Control", value: "public, max-age=300" }] },
    ];
  },
};

export default withNextIntl(nextConfig);
