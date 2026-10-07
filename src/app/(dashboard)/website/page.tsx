import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { VERIFY_PATH, embedCode } from "@/lib/website";
import { WebsiteClient } from "@/components/website/WebsiteClient";

export const dynamic = "force-dynamic";

async function appOrigin(): Promise<string> {
  if (process.env.PUBLIC_APP_URL) return process.env.PUBLIC_APP_URL.replace(/\/$/, "");
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${h.get("host")}`;
}

export default async function WebsitePage() {
  const workspaceId = await getCurrentWorkspaceId();
  const origin = await appOrigin();
  const sites = await prisma.websiteConnection.findMany({ where: { workspaceId, revokedAt: null }, orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Meine Webseite verbinden</h1>
        <p className="mt-1 text-sm text-muted">
          Binde den SECRET-58-Webseiten-Assistenten selbst auf deiner Webseite ein. Wir ändern deine Webseite nicht
          automatisch — du fügst den Code selbst ein (oder lässt ihn von deinem Webdesigner einfügen).
        </p>
      </div>
      <ol className="card list-decimal space-y-1 p-5 pl-9 text-sm text-foreground">
        <li>Adresse deiner Webseite eintragen.</li>
        <li>
          Domain bestätigen: Lege die Datei <code>{VERIFY_PATH}</code> mit der angezeigten Zeile auf deiner Webseite ab
          und klicke „Domain prüfen“.
        </li>
        <li>Einbindungscode kopieren und vor <code>&lt;/body&gt;</code> auf deinen Seiten einfügen.</li>
        <li>„Verbindung testen“ prüft, ob der Code auf deiner Startseite gefunden wird.</li>
      </ol>
      <WebsiteClient
        sites={sites.map((s) => ({
          id: s.id,
          origin: s.origin,
          verified: Boolean(s.verifiedAt),
          verifyToken: s.verifyToken,
          embed: embedCode(origin, s.publicKey),
        }))}
      />
      <div className="card p-5 text-xs text-muted">
        <p>
          <strong className="text-foreground">Was der Assistent weiß:</strong> nur deine öffentlichen Markenangaben (Name,
          Beschreibung, Branche, Tonalität aus der Marken-DNA). Deine privaten Inhalte, Nachrichten, Dateien und Einnahmen
          sind für das Widget nicht erreichbar. Der Code enthält keine geheimen Schlüssel; die Kennung funktioniert nur
          auf der bestätigten Domain und lässt sich jederzeit widerrufen. Jede Antwort zählt gegen dein Paket-Kontingent.
        </p>
        <p className="mt-2">
          <strong className="text-foreground">Webseiten-Chat ≠ Telefonassistent:</strong> Ein Telefonassistent bräuchte
          zusätzlich eine Telefonie-Anbindung, eine Rufnummer sowie eigene Einwilligungs- und Datenschutzabläufe. Er ist
          derzeit nicht verfügbar.
        </p>
        <p className="mt-2">
          Hinweis für deine Datenschutzerklärung: Fragen deiner Besucher werden zur Beantwortung an den vom Betreiber
          eingesetzten KI-Anbieter übermittelt.
        </p>
      </div>
    </div>
  );
}
