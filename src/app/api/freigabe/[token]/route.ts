import { ohneSitzung, dateiAntwort } from "@/lib/dateien/http";
import { freigabeAbrufen } from "@/lib/dateien/service";

export const dynamic = "force-dynamic";

/** Öffentlicher Abruf per Freigabe-Link (ohne Anmeldung, mit Ablauf und Abrufgrenze). Immer als Download. */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  return ohneSitzung(async () => {
    const { token } = await params;
    const { datei, daten } = await freigabeAbrufen(token);
    return dateiAntwort(datei.name, daten, false);
  });
}
