import Link from "next/link";
import { legalLinks } from "@/lib/legal";

/** Impressum, Datenschutz und AGB — von jeder Seite aus mit einem Klick erreichbar. */
export function LegalFooter({ className }: { className?: string }) {
  const { agb, datenschutz } = legalLinks();
  return (
    <footer className={className ?? "mt-8 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted"}>
      <Link href="/impressum" className="hover:text-foreground">Impressum</Link>
      {datenschutz && (
        <a href={datenschutz} className="hover:text-foreground" target="_blank" rel="noreferrer">Datenschutz</a>
      )}
      {agb && (
        <a href={agb} className="hover:text-foreground" target="_blank" rel="noreferrer">AGB</a>
      )}
    </footer>
  );
}
