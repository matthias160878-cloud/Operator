import { escapeHtml } from "@/lib/email";

/** Schlichte Antwortseite für Bestätigen/Abmelden per Link (ohne Marke des Betreibers). */
export function antwortSeite(titel: string, text: string, demo = false): Response {
  const body = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><meta name="referrer" content="no-referrer"><title>${escapeHtml(titel)}</title>
<style>body{margin:0;background:#05070f;color:#e7ebfa;font:16px/1.5 system-ui,sans-serif}main{max-width:32rem;margin:15vh auto;padding:0 1rem}.demo{border:1px solid #fbbf24;color:#fbbf24;border-radius:.5rem;padding:.5rem .75rem;font-size:.85rem}</style></head>
<body><main>${demo ? '<p class="demo">DEMO – es wurde keine E-Mail versendet.</p>' : ""}<h1>${escapeHtml(titel)}</h1><p>${escapeHtml(text)}</p></main></body></html>`;
  return new Response(body, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" } });
}
