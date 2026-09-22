/**
 * Ein Paket, ein Preis: SECRET 58 wird als einzelnes Komplettpaket verkauft,
 * kein Staffel-/Tarif-System. Dieser Wert ist der empfohlene Preis, mit dem
 * das Stripe-Produkt/Preis-Objekt angelegt werden sollte — sobald Stripe
 * konfiguriert ist, zeigt /buy den echten, dort hinterlegten Preis an.
 */
export const PACKAGE_NAME = "Social Media KI";
export const PACKAGE_PRICE_EUR = 497;

export const PACKAGE_PRICE_DISPLAY = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
}).format(PACKAGE_PRICE_EUR);
