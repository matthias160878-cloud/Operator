import { DateienPanel } from "@/components/dateien/DateienPanel";

export const dynamic = "force-dynamic";

/** Dateiaustausch des eigenen Kundenkontos: Ordner, Upload, Freigabe-Links, Webseite & Links. */
export default function DateienPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dateien</h1>
        <p className="text-sm text-muted">
          Ihr Dateiaustausch mit SECRET 58 und Ihren Agenten. Legen Sie Dateien für uns in „An SECRET 58“ ab, unsere
          Dateien für Sie finden Sie in „Von SECRET 58“. Mit „Link teilen“ geben Sie eine Datei zeitlich begrenzt an andere weiter.
        </p>
      </div>
      <DateienPanel />
    </div>
  );
}
