import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  // Mikrofon nur für die eigene Seite (Genesis-Spracheingabe), Kamera/Ort nie.
  { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Das Einbindungsskript wird von Kundenwebseiten geladen.
      { source: "/widget.js", headers: [{ key: "Cross-Origin-Resource-Policy", value: "cross-origin" }, { key: "Cache-Control", value: "public, max-age=300" }] },
    ];
  },
};

export default withNextIntl(nextConfig);
