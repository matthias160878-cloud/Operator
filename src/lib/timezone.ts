/**
 * Anzeige-Zeitzone der Anwendung (Termine, Kalender, Zeitstempel). Server
 * (Render läuft in UTC) und Browser müssen dieselbe Zeitzone nutzen, sonst
 * erscheinen Termine verschoben und React meldet Abweichungen beim Laden.
 * Gespeichert wird immer in UTC; nur die Anzeige richtet sich hiernach.
 */
export const APP_TIME_ZONE = process.env.NEXT_PUBLIC_APP_TIME_ZONE || "Europe/Berlin";
