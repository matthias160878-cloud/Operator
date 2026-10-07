/**
 * Legt die Stripe-Produkte/Preise für die Pakete Pro und Maxi an — liest
 * Preis und Name ausschließlich aus der zentralen Paketdefinition
 * (src/lib/packages.ts), erfindet nichts selbst. Sicher wiederholt
 * ausführbar: findet bereits angelegte Produkte/Preise (über Metadata
 * markiert) wieder, statt Duplikate anzulegen.
 *
 * WICHTIG: Dieses Skript liest STRIPE_SECRET_KEY ausschließlich aus der
 * lokalen .env-Datei (bzw. der Server-Umgebung) — niemals aus einem
 * Kommandozeilen-Argument oder Chat-Text. Trage den Key dort ein, bevor
 * du dieses Skript ausführst:
 *
 *   npm run stripe:setup-products
 *
 * Gibt am Ende die beiden Price-IDs aus, die du anschließend selbst in
 * STRIPE_PRICE_ID_PRO / STRIPE_PRICE_ID_MAXI einträgst. Legt NICHT den
 * Webhook an (STRIPE_WEBHOOK_SECRET) — das braucht eine öffentlich
 * erreichbare Domain und bleibt manueller Schritt im Stripe-Dashboard,
 * siehe README-SOCIAL-MEDIA.md, Abschnitt "Kauf-Freischaltung (Stripe) &
 * App-Installation (PWA)".
 */
import Stripe from "stripe";
import { PACKAGES, PACKAGE_IDS, type PackageId } from "../src/lib/packages";

try {
  process.loadEnvFile(".env");
} catch {
  // Keine .env vorhanden — process.env kann trotzdem von außen gesetzt sein
  // (z.B. im Server-Environment), also kein harter Fehler an dieser Stelle.
}

async function ensurePackagePrice(stripe: Stripe, id: PackageId) {
  const pkg = PACKAGES[id];
  const productName = `SECRET 58 ${pkg.name}`;

  const existingProducts = await stripe.products.search({
    query: `metadata['secret58_package']:'${id}' AND active:'true'`,
  });

  let product = existingProducts.data[0];
  if (!product) {
    product = await stripe.products.create({
      name: productName,
      metadata: { secret58_package: id },
    });
    console.log(`✓ Produkt angelegt: ${productName} (${product.id})`);
  } else {
    console.log(`– Produkt existiert bereits: ${productName} (${product.id})`);
  }

  const existingPrices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
  let price = existingPrices.data.find(
    (p) => p.unit_amount === pkg.priceCents && p.currency === "eur" && !p.recurring
  );
  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      currency: "eur",
      unit_amount: pkg.priceCents,
      metadata: { secret58_package: id },
    });
    console.log(`✓ Preis angelegt: ${pkg.priceEur} € einmalig (${price.id})`);
  } else {
    console.log(`– Preis existiert bereits: ${pkg.priceEur} € einmalig (${price.id})`);
  }

  console.log(`  -> ${pkg.stripePriceEnvVar}=${price.id}\n`);
  return { envVar: pkg.stripePriceEnvVar, priceId: price.id };
}

async function main() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error(
      "STRIPE_SECRET_KEY ist nicht gesetzt. Bitte zuerst in .env eintragen " +
        "(lokal in dieser Datei, live im Environment deines Hosters — niemals im " +
        "Chat/Code) und diesen Befehl erneut ausführen."
    );
    process.exitCode = 1;
    return;
  }

  const isLiveKey = secretKey.startsWith("sk_live_");
  const stripe = new Stripe(secretKey);

  console.log(
    `Verbunden mit Stripe im ${isLiveKey ? "LIVE" : "TEST"}-Modus (erkannt am Präfix des Secret Keys).\n`
  );
  if (isLiveKey) {
    console.log(
      "ACHTUNG: Das ist dein LIVE-Konto — hier angelegte Produkte/Preise sind sofort " +
        "echt nutzbar. Für einen ersten Test empfiehlt sich ein sk_test_...-Key.\n"
    );
  }

  const results = [];
  for (const id of PACKAGE_IDS) {
    results.push(await ensurePackagePrice(stripe, id));
  }

  console.log("Fertig. Trage die Price-IDs in .env (bzw. die Server-Umgebung) ein:\n");
  for (const r of results) {
    console.log(`  ${r.envVar}=${r.priceId}`);
  }
  console.log(
    "\nDanach fehlt für die vollständige Freischaltung nur noch STRIPE_WEBHOOK_SECRET " +
      "(manuell im Stripe-Dashboard anlegen, siehe README)."
  );
}

main().catch((err) => {
  console.error("Fehler beim Einrichten der Stripe-Produkte:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
