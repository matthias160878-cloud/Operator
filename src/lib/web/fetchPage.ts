import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * Sicherer Website-Abruf für WebsiteSocialAgent und SeoAgent.
 *
 * - nur http/https, Timeout und Größenlimit
 * - Redirects werden manuell verfolgt und jede Ziel-URL erneut geprüft
 * - private/lokale Adressen (localhost, 10.x, 192.168.x, Cloud-Metadaten
 *   169.254.169.254, …) werden abgelehnt, damit die Tools nicht zum Abruf
 *   interner Dienste missbraucht werden können. Für lokale Tests lässt sich
 *   das mit `WEB_FETCH_ALLOW_PRIVATE=true` bewusst abschalten.
 */

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_BYTES = 3 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const USER_AGENT =
  "Mozilla/5.0 (compatible; Secret58Bot/1.0; +https://secret58.media/bot)";

export interface FetchedPage {
  requestedUrl: string;
  finalUrl: string;
  status: number;
  headers: Record<string, string>;
  body: string;
  bytes: number;
  truncated: boolean;
  redirects: string[];
  responseTimeMs: number;
}

export class WebFetchError extends Error {}

function isPrivateIPv4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) return isPrivateIPv4(ip);
  const lower = ip.toLowerCase();
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return (
    lower === "::" ||
    lower === "::1" ||
    lower.startsWith("fc") ||
    lower.startsWith("fd") ||
    lower.startsWith("fe8") ||
    lower.startsWith("fe9") ||
    lower.startsWith("fea") ||
    lower.startsWith("feb") ||
    lower.startsWith("ff")
  );
}

async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new WebFetchError(`Ungültige URL: ${raw}`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new WebFetchError("Nur http- und https-URLs sind erlaubt.");
  }
  if (url.username || url.password) {
    throw new WebFetchError("URLs mit Zugangsdaten sind nicht erlaubt.");
  }
  if (process.env.WEB_FETCH_ALLOW_PRIVATE === "true") return url;

  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal")) {
    throw new WebFetchError("Lokale oder interne Adressen dürfen nicht abgerufen werden.");
  }
  const addresses = isIP(host)
    ? [host]
    : (await lookup(host, { all: true }).catch(() => {
        throw new WebFetchError(`Domain ${host} konnte nicht aufgelöst werden.`);
      })).map((a) => a.address);
  if (addresses.some(isPrivateAddress)) {
    throw new WebFetchError("Lokale oder interne Adressen dürfen nicht abgerufen werden.");
  }
  return url;
}

async function readLimited(res: Response, maxBytes: number) {
  if (!res.body) return { body: "", bytes: 0, truncated: false };
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  let truncated = false;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maxBytes) {
      chunks.push(value.slice(0, value.byteLength - (bytes - maxBytes)));
      truncated = true;
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }
  return {
    body: Buffer.concat(chunks).toString("utf8"),
    bytes: Math.min(bytes, maxBytes),
    truncated,
  };
}

export async function fetchPage(
  rawUrl: string,
  options: { timeoutMs?: number; maxBytes?: number; accept?: string } = {}
): Promise<FetchedPage> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const redirects: string[] = [];
  let current = await assertPublicUrl(rawUrl);
  const started = Date.now();

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetch(current, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "user-agent": USER_AGENT,
          accept: options.accept ?? "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
        },
        cache: "no-store",
      });
    } catch (error) {
      clearTimeout(timer);
      if (controller.signal.aborted) {
        throw new WebFetchError(`Zeitüberschreitung nach ${timeoutMs} ms beim Abruf von ${current}.`);
      }
      throw new WebFetchError(
        `${current} konnte nicht abgerufen werden: ${error instanceof Error ? error.message : "unbekannter Fehler"}`
      );
    }
    const responseTimeMs = Date.now() - started;

    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      clearTimeout(timer);
      await res.body?.cancel();
      redirects.push(current.toString());
      current = await assertPublicUrl(new URL(location, current).toString());
      continue;
    }

    try {
      const { body, bytes, truncated } = await readLimited(res, maxBytes);
      const headers: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        headers[key] = value;
      });
      return {
        requestedUrl: rawUrl,
        finalUrl: current.toString(),
        status: res.status,
        headers,
        body,
        bytes,
        truncated,
        redirects,
        responseTimeMs,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  throw new WebFetchError(`Zu viele Weiterleitungen (mehr als ${MAX_REDIRECTS}).`);
}

// --- HTML-Extraktion (bewusst ohne zusätzliche Parser-Abhängigkeit) ---------

export interface ExtractedPage {
  title: string;
  metaDescription: string;
  metaRobots: string;
  canonical: string;
  lang: string;
  viewport: string;
  openGraph: Record<string, string>;
  twitterCard: string;
  headings: { level: number; text: string }[];
  paragraphs: string[];
  images: { src: string; alt: string | null }[];
  links: { href: string; rel: string; internal: boolean }[];
  jsonLdTypes: string[];
  hreflangCount: number;
  scripts: { src: string; async: boolean; defer: boolean; inHead: boolean }[];
  stylesheetCount: number;
  wordCount: number;
  text: string;
}

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  auml: "ä", ouml: "ö", uuml: "ü", Auml: "Ä", Ouml: "Ö", Uuml: "Ü", szlig: "ß",
  ndash: "–", mdash: "—", hellip: "…", laquo: "«", raquo: "»", bdquo: "„", ldquo: "“", rdquo: "”",
};

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : match;
    }
    return ENTITIES[code] ?? match;
  });
}

function cleanText(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function parseAttributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  const inner = tag.replace(/^<\s*[a-zA-Z0-9]+/, "").replace(/\/?>$/, "");
  let m: RegExpExecArray | null;
  while ((m = re.exec(inner))) {
    attrs[m[1].toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? "");
  }
  return attrs;
}

function findTags(html: string, name: string): Record<string, string>[] {
  const re = new RegExp(`<${name}\\b[^>]*>`, "gi");
  return Array.from(html.matchAll(re), (m) => parseAttributes(m[0]));
}

export function extractPage(html: string, pageUrl: string): ExtractedPage {
  const base = new URL(pageUrl);
  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, "");
  const headEnd = withoutComments.search(/<\/head>/i);
  const head = headEnd === -1 ? "" : withoutComments.slice(0, headEnd);

  const jsonLdTypes: string[] = [];
  for (const m of withoutComments.matchAll(
    /<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi
  )) {
    try {
      const data = JSON.parse(m[1]);
      const nodes = Array.isArray(data) ? data : data["@graph"] ?? [data];
      for (const node of nodes) {
        const type = node?.["@type"];
        if (typeof type === "string") jsonLdTypes.push(type);
        else if (Array.isArray(type)) jsonLdTypes.push(...type.filter((t) => typeof t === "string"));
      }
    } catch {
      jsonLdTypes.push("(ungültiges JSON-LD)");
    }
  }

  const scripts = Array.from(withoutComments.matchAll(/<script\b[^>]*>/gi), (m) => {
    const attrs = parseAttributes(m[0]);
    return {
      src: attrs.src ?? "",
      async: "async" in attrs,
      defer: "defer" in attrs || attrs.type === "module",
      inHead: headEnd !== -1 && (m.index ?? 0) < headEnd,
    };
  }).filter((s) => s.src);

  const body = withoutComments
    .replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<head\b[\s\S]*?<\/head>/i, " ");

  const meta = findTags(withoutComments, "meta");
  const metaByName = (name: string) =>
    meta.find((m) => (m.name ?? "").toLowerCase() === name)?.content ?? "";
  const openGraph: Record<string, string> = {};
  for (const m of meta) {
    const prop = (m.property ?? "").toLowerCase();
    if (prop.startsWith("og:") && m.content) openGraph[prop] = m.content;
  }

  const linkTags = findTags(withoutComments, "link");
  const rels = (l: Record<string, string>) => (l.rel ?? "").toLowerCase().split(/\s+/);

  const headings = Array.from(body.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi), (m) => ({
    level: Number(m[1]),
    text: cleanText(m[2]),
  })).filter((h) => h.text);

  const paragraphs = Array.from(body.matchAll(/<(p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi), (m) => cleanText(m[2]))
    .filter((p) => p.length >= 40);

  const images = findTags(body, "img").map((attrs) => ({
    src: attrs.src ?? attrs["data-src"] ?? "",
    alt: "alt" in attrs ? attrs.alt : null,
  }));

  const links = findTags(body, "a")
    .filter((a) => a.href && !/^(#|javascript:|mailto:|tel:)/i.test(a.href))
    .map((a) => {
      let internal = false;
      try {
        internal = new URL(a.href, base).hostname === base.hostname;
      } catch {
        internal = false;
      }
      return { href: a.href, rel: (a.rel ?? "").toLowerCase(), internal };
    });

  const text = cleanText(body);
  const titleMatch = withoutComments.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const htmlTag = withoutComments.match(/<html\b[^>]*>/i);

  return {
    title: titleMatch ? cleanText(titleMatch[1]) : "",
    metaDescription: metaByName("description"),
    metaRobots: metaByName("robots"),
    canonical: linkTags.find((l) => rels(l).includes("canonical"))?.href ?? "",
    lang: htmlTag ? parseAttributes(htmlTag[0]).lang ?? "" : "",
    viewport: metaByName("viewport"),
    openGraph,
    twitterCard: metaByName("twitter:card"),
    headings,
    paragraphs,
    images,
    links,
    jsonLdTypes,
    hreflangCount: linkTags.filter((l) => rels(l).includes("alternate") && l.hreflang).length,
    scripts,
    stylesheetCount: linkTags.filter((l) => rels(l).includes("stylesheet")).length +
      (head.match(/<style\b/gi)?.length ?? 0),
    wordCount: text ? text.split(/\s+/).length : 0,
    text,
  };
}
