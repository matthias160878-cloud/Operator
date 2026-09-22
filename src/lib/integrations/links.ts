/**
 * Wo bekommt man den API-Schlüssel für jede Integration? Reine Navigations-
 * Links zu den offiziellen Entwickler-/Account-Seiten der Anbieter — es wird
 * niemals ein Schlüssel über die App selbst entgegengenommen (Secrets landen
 * ausschließlich als Environment-Variable, nie im Frontend/Formular).
 */
export const API_KEY_SIGNUP_LINKS: Partial<Record<string, string>> = {
  anthropic: "https://console.anthropic.com/settings/keys",
  openai: "https://platform.openai.com/api-keys",
  elevenlabs: "https://elevenlabs.io/app/settings/api-keys",
  youtube: "https://console.cloud.google.com/apis/credentials",
  instagram: "https://developers.facebook.com/apps/",
  tiktok: "https://developers.tiktok.com/",
  linkedin: "https://www.linkedin.com/developers/apps",
  facebook: "https://developers.facebook.com/apps/",
  canva: "https://www.canva.com/developers/",
};

/**
 * Wo trägt man den Schlüssel danach ein? Direktlink auf die Environment-
 * Variablen dieses Render-Diensts — es gibt bewusst kein Eingabeformular
 * innerhalb der App dafür (siehe README-SOCIAL-MEDIA.md, Abschnitt
 * "Kauf-Freischaltung"/Environment Variables).
 */
export const RENDER_ENV_DASHBOARD_URL =
  "https://dashboard.render.com/web/srv-dap4u46gekts73fq80q0/env";
