import Link from "next/link";

/** Fußzeile einer Angebotsseite: Rechtstexte des VERKÄUFERS, dazu ein Hinweis auf die Plattform. */
export function SellerLegalFooter({
  productId,
  agbUrl,
  datenschutzUrl,
  widerrufUrl,
}: {
  productId: string;
  agbUrl: string;
  datenschutzUrl: string;
  widerrufUrl: string;
}) {
  return (
    <footer className="mt-8 space-y-1 text-center text-xs text-muted">
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        <Link href={`/shop/${productId}/impressum`} className="hover:text-foreground">Impressum des Verkäufers</Link>
        {datenschutzUrl && <a href={datenschutzUrl} target="_blank" rel="noreferrer nofollow" className="hover:text-foreground">Datenschutz</a>}
        {agbUrl && <a href={agbUrl} target="_blank" rel="noreferrer nofollow" className="hover:text-foreground">AGB</a>}
        {widerrufUrl && <a href={widerrufUrl} target="_blank" rel="noreferrer nofollow" className="hover:text-foreground">Widerruf</a>}
      </div>
      <div>
        Technische Plattform: SECRET 58 · <Link href="/impressum" className="hover:text-foreground">Impressum der Plattform</Link>
      </div>
    </footer>
  );
}
