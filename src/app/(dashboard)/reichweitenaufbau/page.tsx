import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth/session";
import { darfBearbeiten, darfFreigeben } from "@/lib/reichweite/zugriff";
import { seitenOrigin } from "@/lib/reichweite/origin";
import { DEMO_FORMAT, kampagnenBelege, newsletterAufraeumen, seitenZahlen, variantenAuswertung } from "@/lib/reichweitenaufbau/service";
import { versandStand } from "@/lib/reichweitenaufbau/newsletterKunden";
import { newsletterFreigeschaltet, werbungFreigeschaltet } from "@/lib/reichweitenaufbau/freischaltung";
import { kennzeichnungWarnung } from "@/lib/reichweitenaufbau/kooperation";
import { sellerProfileMissing } from "@/lib/connect/sellerProfile";
import { bewerbungsVorschlaege } from "@/lib/reichweitenaufbau/werbung";
import { naechsteSchritte, termineBald, stufeAusgabe, stufeInhalt, stufeWerbeplan, zaehleStufen } from "@/lib/reichweitenaufbau/status";
import { plain } from "@/components/reichweitenaufbau/typen";
import { DemoSteuerung } from "@/components/reichweitenaufbau/DemoSteuerung";
import { UebersichtTab } from "@/components/reichweitenaufbau/UebersichtTab";
import { IdeenTab } from "@/components/reichweitenaufbau/IdeenTab";
import { VariantenTab } from "@/components/reichweitenaufbau/VariantenTab";
import { KooperationenTab } from "@/components/reichweitenaufbau/KooperationenTab";
import { WerbungTab } from "@/components/reichweitenaufbau/WerbungTab";
import { NewsletterTab } from "@/components/reichweitenaufbau/NewsletterTab";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "uebersicht", label: "Übersicht" },
  { key: "ideen", label: "Content-Ideen" },
  { key: "varianten", label: "Variantenvergleich" },
  { key: "kooperationen", label: "Kooperationen" },
  { key: "werbung", label: "Werbeplanung" },
  { key: "newsletter", label: "Newsletter" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default async function ReichweitenaufbauPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: tabParam } = await searchParams;
  const frei = { newsletter: newsletterFreigeschaltet(), werbung: werbungFreigeschaltet() };
  const tabs = TABS.filter((t) => (t.key !== "newsletter" || frei.newsletter) && (t.key !== "werbung" || frei.werbung));
  const tab: TabKey = (tabs.find((t) => t.key === tabParam)?.key ?? "uebersicht") as TabKey;
  const user = await requireSessionUser();
  const { workspaceId } = user;
  if (frei.newsletter) await newsletterAufraeumen(workspaceId);

  const inhaltFilter = { workspaceId, OR: [{ format: { startsWith: "Reichweitenaufbau" } }, { format: DEMO_FORMAT }] };
  const leer = <T,>(): Promise<T[]> => Promise.resolve([]);
  const [kampagnen, inhalte, alleInhalte, tests, kooperationen, werbeplaene, seiten, kontakte, ausgaben, belege, zahlen, origin, anbieterProfil] = await Promise.all([
    prisma.reichweitenKampagne.findMany({ where: { workspaceId }, select: { id: true, titel: true, istDemo: true, aktiv: true }, orderBy: { createdAt: "desc" } }),
    prisma.contentItem.findMany({
      where: inhaltFilter,
      select: { id: true, title: true, status: true, platform: true, format: true, publishedAt: true, updatedAt: true, _count: { select: { analytics: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.contentItem.findMany({ where: { workspaceId, status: { not: "ARCHIVED" } }, select: { id: true, title: true, status: true, platform: true }, orderBy: { updatedAt: "desc" }, take: 100 }),
    prisma.variantenTest.findMany({
      where: { workspaceId },
      include: { varianten: { include: { messwerte: { orderBy: { erfasstAm: "desc" } }, link: { select: { code: true } } }, orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.kooperation.findMany({ where: { workspaceId }, include: { kampagne: { select: { titel: true } }, link: { select: { code: true } } }, orderBy: { updatedAt: "desc" } }),
    frei.werbung
      ? prisma.werbeplan.findMany({ where: { workspaceId }, include: { contentItem: { select: { title: true } }, kampagne: { select: { titel: true } } }, orderBy: { createdAt: "desc" } })
      : leer<never>(),
    frei.newsletter ? prisma.newsletterSeite.findMany({ where: { workspaceId }, include: { kampagne: { select: { titel: true } } }, orderBy: { createdAt: "desc" } }) : leer<never>(),
    !frei.newsletter ? leer<never>() : prisma.newsletterKontakt.findMany({
      where: { workspaceId },
      select: { id: true, email: true, status: true, themen: true, consentAt: true, confirmedAt: true, unsubscribedAt: true, istDemo: true, seiteId: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    frei.newsletter ? prisma.newsletterAusgabe.findMany({ where: { workspaceId }, include: { kampagne: { select: { titel: true } } }, orderBy: { createdAt: "desc" } }) : leer<never>(),
    kampagnenBelege(workspaceId),
    seitenZahlen(workspaceId),
    seitenOrigin(),
    prisma.sellerProfile.findUnique({ where: { workspaceId } }),
  ]);
  const anbieterFehlt = sellerProfileMissing(anbieterProfil);
  const auswertungen = await Promise.all(tests.map(async (t) => ({ testId: t.id, ergebnis: (await variantenAuswertung(workspaceId, t.id)).ergebnis })));
  const stand = await versandStand(workspaceId);
  const modus = stand.modus;

  const stufen = {
    inhalte: zaehleStufen(inhalte.map((i) => stufeInhalt(i.status, i._count.analytics > 0))),
    newsletter: zaehleStufen(ausgaben.map((a) => stufeAusgabe(a.status))),
    werbung: zaehleStufen(werbeplaene.map((w) => stufeWerbeplan(w.status, w.gemeldeteAusgabenCent))),
  };
  const schritte = naechsteSchritte({
    inhalteInPruefung: inhalte.filter((i) => i.status === "IN_REVIEW").length,
    inhalteFreigegebenOhneVeroeffentlichung: inhalte.filter((i) => i.status === "APPROVED" || i.status === "SCHEDULED").length,
    variantenOhneAussage: auswertungen.filter((a) => a.ergebnis.status === "KEINE_AUSSAGE").length,
    kooperationenOhneNaechstenSchritt: kooperationen.filter((k) => !k.naechsterSchritt.trim() && !["ABGESCHLOSSEN", "ABGESAGT"].includes(k.status)).length,
    kooperationenTerminBald: termineBald(kooperationen.map((k) => k.termin)),
    werbeplaeneFreigegeben: werbeplaene.filter((w) => w.status === "FREIGEGEBEN").length,
    werbeplaeneInPruefung: werbeplaene.filter((w) => w.status === "PRUEFUNG").length,
    ausgabenGeplant: ausgaben.filter((a) => a.status === "GEPLANT").length,
    ausgabenInPruefung: ausgaben.filter((a) => a.status === "PRUEFUNG").length,
    newsletterModus: modus,
    newsletterSeiten: seiten.length,
    plattformStatistikAngebunden: false,
    kooperationenOhneKennzeichnung: kooperationen.filter((k) => kennzeichnungWarnung(k)).length,
    newsletterAktiv: frei.newsletter,
    werbungAktiv: frei.werbung,
  });
  const hatDemo =
    kampagnen.some((k) => k.istDemo) || tests.some((t) => t.istDemo) || kooperationen.some((k) => k.istDemo) || werbeplaene.some((w) => w.istDemo) || seiten.some((s) => s.istDemo);
  const rechte = { bearbeiten: darfBearbeiten(user.role), freigeben: darfFreigeben(user.role) };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Reichweitenaufbau</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted">
            Inhalte vorbereiten, Varianten vergleichen und Kooperationen organisieren
            {frei.werbung && ", Werbung kontrolliert planen"}
            {frei.newsletter && " und Interessenten per Newsletter halten"}.
            Kampagnen, Links und Messdaten kommen aus{" "}
            <Link href="/weiterempfehlungen" className="underline">
              Weiterempfehlungen
            </Link>
            . Es wird nichts automatisch veröffentlicht, versendet oder bezahlt.
          </p>
        </div>
        {rechte.bearbeiten && <DemoSteuerung hatDemo={hatDemo} />}
      </div>
      {hatDemo && (
        <div className="rounded-lg border border-warning/50 bg-warning/10 px-4 py-3 text-xs text-warning" data-testid="demo-banner">
          <strong>Demo-Daten aktiv:</strong> Einträge mit DEMO-Kennzeichen sind erfunden. Nichts davon wurde veröffentlicht, versendet oder bezahlt.
        </div>
      )}
      {anbieterFehlt.length > 0 && (
        <div className="rounded-lg border border-warning/50 bg-warning/10 px-4 py-3 text-xs text-warning" data-testid="anbieter-hinweis">
          <strong>Öffentliche Empfehlungsseiten noch gesperrt:</strong> Es fehlen Pflichtangaben für Impressum und Datenschutz ({anbieterFehlt.join(", ")}).{" "}
          <Link href="/sales" className="underline">
            Jetzt unter „Verkaufen“ hinterlegen
          </Link>
          . Demo-Seiten sind davon ausgenommen.
        </div>
      )}
      <nav className="-mx-1 flex gap-1 overflow-x-auto pb-1" aria-label="Bereiche">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/reichweitenaufbau?tab=${t.key}`}
            aria-current={t.key === tab ? "page" : undefined}
            className={`whitespace-nowrap rounded-lg border px-3 py-2 text-sm ${t.key === tab ? "border-accent text-foreground" : "border-border text-muted"}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "uebersicht" && (
        <UebersichtTab
          kampagnen={plain(kampagnen)}
          belege={belege}
          stufen={stufen}
          schritte={schritte}
          anbindungen={{ newsletterModus: modus, fehlt: stand.fehlt, newsletterAktiv: frei.newsletter, werbungAktiv: frei.werbung }}
          kooperationen={kooperationen.length}
          tests={tests.length}
        />
      )}
      {tab === "ideen" && <IdeenTab kampagnen={plain(kampagnen)} inhalte={plain(inhalte)} darfBearbeiten={rechte.bearbeiten} />}
      {tab === "varianten" && (
        <VariantenTab tests={plain(tests)} auswertungen={auswertungen} kampagnen={plain(kampagnen)} inhalte={plain(alleInhalte)} darfBearbeiten={rechte.bearbeiten} origin={origin} />
      )}
      {tab === "kooperationen" && <KooperationenTab kooperationen={plain(kooperationen)} kampagnen={plain(kampagnen)} darfBearbeiten={rechte.bearbeiten} origin={origin} />}
      {frei.werbung && tab === "werbung" && (
        <WerbungTab plaene={plain(werbeplaene)} kampagnen={plain(kampagnen)} inhalte={plain(alleInhalte)} vorschlaege={bewerbungsVorschlaege(belege)} rechte={rechte} />
      )}
      {frei.newsletter && tab === "newsletter" && (
        <NewsletterTab
          seiten={plain(seiten)}
          kontakte={plain(kontakte)}
          ausgaben={plain(ausgaben)}
          zahlen={zahlen}
          kampagnen={plain(kampagnen)}
          modus={modus}
          fehlt={stand.fehlt}
          rechte={rechte}
          origin={origin}
        />
      )}
    </div>
  );
}
