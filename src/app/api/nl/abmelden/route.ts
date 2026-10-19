import { newsletterAbmelden } from "@/lib/reichweitenaufbau/service";
import { antwortSeite } from "@/lib/reichweitenaufbau/antwortSeite";

async function abmelden(request: Request) {
  const t = new URL(request.url).searchParams.get("t") ?? "";
  const k = t.length >= 20 && t.length <= 64 ? await newsletterAbmelden(t) : null;
  if (!k) return antwortSeite("Link ungültig", "Diese Abmeldung konnte nicht zugeordnet werden.");
  return antwortSeite("Abgemeldet", "Sie erhalten keinen Newsletter mehr.", k.istDemo);
}

export const GET = abmelden;
/** One-Click-Abmeldung (List-Unsubscribe-Post). */
export const POST = abmelden;
