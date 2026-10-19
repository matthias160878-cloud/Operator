import Link from "next/link";
import { requireSessionUser } from "@/lib/auth/session";
import { darfFreigeben } from "@/lib/reichweite/zugriff";
import { isTokenEncryptionConfigured } from "@/lib/crypto";
import { WERBE_WEGWEISER, ZUGANG_ANBIETER } from "@/lib/zugaenge/anbieter";
import { zugaengeUebersicht } from "@/lib/zugaenge/service";
import { werbungFreigeschaltet } from "@/lib/reichweitenaufbau/freischaltung";
import { ZugangFormular } from "@/components/settings/ZugangFormular";

export const dynamic = "force-dynamic";

/** Einstellungen → Eigene Zugänge: Kunde trägt seine Schlüssel selbst ein, mit Wegweiser je Anbieter. */
export default async function ZugaengePage() {
  const user = await requireSessionUser();
  const zugaenge = await zugaengeUebersicht(user.workspaceId);
  const darf = darfFreigeben(user.role);
  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs text-muted">
          <Link href="/settings" className="underline">
            Einstellungen
          </Link>{" "}
          → Eigene Zugänge
        </div>
        <h1 className="mt-1 text-xl font-semibold text-foreground">Eigene Zugänge</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Dienste, die über Ihre eigenen Konten laufen. Sie tragen Ihren Schlüssel hier selbst ein – er wird verschlüsselt gespeichert, gilt nur für diesen Workspace und wird nie wieder
          angezeigt. Kosten entstehen nur bei Ihrem Anbieter; SECRET 58 berechnet dafür nichts.
        </p>
      </div>
      {!isTokenEncryptionConfigured() && (
        <div className="rounded-lg border border-danger/50 bg-danger/10 px-4 py-3 text-xs text-danger">
          Der Server kann Schlüssel derzeit nicht verschlüsselt speichern. Bitte den Betreiber informieren – bis dahin ist das Eintragen gesperrt.
        </div>
      )}
      {!darf && <p className="text-xs text-warning">Ansehen ist möglich; eintragen, prüfen und löschen dürfen nur Inhaber und Admins.</p>}

      {Object.values(ZUGANG_ANBIETER).map((a) => {
        const z = zugaenge.find((x) => x.anbieter === a.key) ?? null;
        return (
          <section key={a.key} className="card space-y-3 p-5" data-testid={`zugang-${a.key}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-foreground">{a.name}</h2>
              <span
                className={`rounded-full border px-2 py-0.5 text-[11px] ${z?.status === "OK" ? "border-success/50 text-success" : z ? "border-danger/50 text-danger" : "border-border text-muted"}`}
              >
                {z?.status === "OK" ? "eingerichtet und geprüft" : z?.status === "FEHLER" ? "Fehler" : z ? "ungeprüft" : "nicht eingerichtet"}
              </span>
            </div>
            <p className="text-xs text-muted">{a.wofuer}</p>
            <div>
              <h3 className="text-xs font-semibold text-foreground">So bekommen Sie den Schlüssel</h3>
              <ol className="mt-1 list-decimal space-y-1 pl-5 text-xs text-foreground">
                {a.schritte.map((s) => (
                  <li key={s.text}>
                    {s.text}{" "}
                    {s.link && (
                      <a href={s.link.href} target="_blank" rel="noopener noreferrer" className="text-accent-2 underline">
                        {s.link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ol>
              <a href={a.preise.href} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-[11px] text-accent-2 underline">
                {a.preise.text}
              </a>
            </div>
            {z && (
              <p className="text-xs text-muted">
                Gespeichert: Schlüssel …{z.endung} · {z.anzeige}
                {z.meldung && (
                  <>
                    <br />
                    <span className={z.status === "OK" ? "text-success" : "text-danger"}>{z.meldung}</span>
                  </>
                )}
              </p>
            )}
            {darf && isTokenEncryptionConfigured() && (
              <ZugangFormular anbieter={a.key} felder={a.felder.map((f) => ({ key: f.key, label: f.label, geheim: f.geheim, platzhalter: f.platzhalter }))} vorhanden={!!z} />
            )}
            <ul className="list-disc space-y-0.5 pl-5 text-[11px] text-muted">
              {a.hinweise.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </section>
        );
      })}

      <section className="card space-y-2 p-5">
        <h2 className="text-sm font-semibold text-foreground">Werbekonten (Meta, Google Ads, LinkedIn, TikTok)</h2>
        <p className="text-xs text-muted">
          Hier sind keine Schlüssel nötig. {werbungFreigeschaltet() ? "Werbepläne aus dem Reichweitenaufbau" : "Werbepläne"} werden freigegeben und als Datei exportiert; die Kampagne legen Sie
          selbst in Ihrem Werbekonto an. Eine direkte Anbindung setzt eine Freigabe durch die jeweilige Plattform voraus und ist noch nicht eingerichtet.
        </p>
        <ul className="grid gap-1 text-xs sm:grid-cols-2">
          {WERBE_WEGWEISER.map((w) => (
            <li key={w.name}>
              {w.name}:{" "}
              <a href={w.href} target="_blank" rel="noopener noreferrer" className="text-accent-2 underline">
                {w.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
