import Link from "next/link";
import { legalLinks } from "@/lib/legal";

/** Impressum, Datenschutz, AGB und Kündigungsbutton (§ 312k BGB) — von jeder Seite aus mit einem Klick erreichbar. */
export function LegalFooter({ className }: { className?: string }) {
  const { agb, datenschutz } = legalLinks();
  return (
    <footer className={className ?? "mt-8 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted"}>
      <Link href="/impressum" className="hover:text-foreground">Impressum</Link>
      {datenschutz.startsWith("/") ? (
        <Link href={datenschutz} className="hover:text-foreground">Datenschutz</Link>
      ) : (
        <a href={datenschutz} className="hover:text-foreground" target="_blank" rel="noreferrer">Datenschutz</a>
      )}
      {agb && (
        <a href={agb} className="hover:text-foreground" target="_blank" rel="noreferrer">AGB</a>
      )}
      <Link href="/kuendigen" className="hover:text-foreground">Verträge hier kündigen</Link>
    </footer>
  );
}
