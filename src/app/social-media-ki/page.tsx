import { redirect } from "next/navigation";

/** Alte Adresse der Zentrale (secret58-web) — führt auf die Verkaufsseite der App. */
export default async function SocialMediaKiRedirect({
  searchParams,
}: {
  searchParams: Promise<{ vorauswahl?: string; plan?: string }>;
}) {
  const { vorauswahl, plan } = await searchParams;
  const choice = (plan ?? vorauswahl ?? "").toLowerCase();
  redirect(choice === "pro" || choice === "maxi" ? `/buy?plan=${choice}#paket-${choice}` : "/buy");
}
