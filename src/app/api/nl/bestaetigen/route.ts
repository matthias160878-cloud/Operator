import { newsletterBestaetigen } from "@/lib/reichweitenaufbau/service";
import { antwortSeite } from "@/lib/reichweitenaufbau/antwortSeite";

export async function GET(request: Request) {
  const t = new URL(request.url).searchParams.get("t") ?? "";
  const k = t.length >= 20 && t.length <= 64 ? await newsletterBestaetigen(t) : null;
  if (!k) return antwortSeite("Link ungültig oder abgelaufen", "Bitte melden Sie sich bei Bedarf erneut an.");
  return antwortSeite("Anmeldung bestätigt", "Danke! Sie erhalten künftig den Newsletter. Abmelden ist jederzeit über den Link in jeder Ausgabe möglich.", k.istDemo);
}
