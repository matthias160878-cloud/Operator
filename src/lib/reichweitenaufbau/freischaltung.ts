/**
 * Freischaltung einzelner Bausteine. Newsletter und Werbeplanung sind
 * vorbereitet, aber standardmäßig aus — sie werden erst nach ausdrücklicher
 * Freigabe per Umgebungsvariable eingeschaltet.
 */
export function newsletterFreigeschaltet(): boolean {
  return process.env.REICHWEITE_NEWSLETTER === "1";
}

export function werbungFreigeschaltet(): boolean {
  return process.env.REICHWEITE_WERBUNG === "1";
}

/** API-Handler nur bei freigeschaltetem Baustein; sonst 404 wie eine nicht vorhandene Route. */
export function nurWenn<A extends unknown[]>(freigeschaltet: () => boolean, handler: (...args: A) => Promise<Response> | Response) {
  return async (...args: A): Promise<Response> => {
    if (!freigeschaltet()) return Response.json({ error: "Dieser Bereich ist nicht freigeschaltet." }, { status: 404 });
    return handler(...args);
  };
}
