import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    // Designwelten: statischer Bereich unter public/designwelten, Einstieg ohne "/index.html".
    return [{ source: "/designwelten", destination: "/designwelten/index.html" }];
  },
};

export default withNextIntl(nextConfig);
