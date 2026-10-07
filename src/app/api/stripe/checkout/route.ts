import { NextResponse } from "next/server";

/**
 * Retired: Pro/Maxi wird ausschließlich bei der Zentrale (secret58-web) als
 * Abo verkauft, nie hier und nie einmalig (siehe /buy, das jetzt auf die
 * Zentrale verlinkt statt diese Route aufzurufen). 410 statt 404, weil die
 * Route bewusst und dauerhaft abgeschaltet ist, nicht weil sie nie
 * existiert hätte.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Dieser Checkout ist abgeschaltet. Pro/Maxi gibt es ausschließlich als Abo bei der Zentrale.",
    },
    { status: 410 },
  );
}
