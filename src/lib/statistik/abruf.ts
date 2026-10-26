import { prisma } from "@/lib/db";
import { getValidAccessToken } from "@/lib/publishing/tokens";
import { pausierteWorkspaces } from "@/lib/automatik";
import type { ContentItem, PlatformAccount } from "@prisma/client";

/**
 * Automatischer Abruf der Plattformzahlen veröffentlichter Beiträge.
 *
 * Mit den heutigen Zugängen (Anmeldeumfang in src/lib/oauth/providers.ts):
 *  - YouTube: Aufrufe, Likes, Kommentare je Video (youtube.readonly).
 *  - Facebook-Seite: Reaktionen, Kommentare, Teilungen je Beitrag (pages_read_engagement).
 * Vorbereitet, startet erst nach Freigabe durch die Plattform (Schalter in der Umgebung):
 *  - Instagram (STATISTIK_INSTAGRAM=1, Umfang instagram_business_manage_insights),
 *  - TikTok (STATISTIK_TIKTOK=1, Umfang video.list),
 *  - LinkedIn (STATISTIK_LINKEDIN=1, Umfang r_member_social – nur für geprüfte Partner).
 *
 * Gelesen wird nur; veröffentlicht oder verändert wird auf der Plattform nichts.
 * Die Werte erscheinen mit Quelle „API:<Plattform>“ und werden je Beitrag
 * aktualisiert, nicht aufaddiert. Manuell eingetragene Werte bleiben erhalten.
 */

export interface BeitragsZahlen {
  aufrufe: number | null;
  likes: number | null;
  kommentare: number | null;
  geteilt: number | null;
  gespeichert: number | null;
  reichweite: number | null;
}

const LEER: BeitragsZahlen = { aufrufe: null, likes: null, kommentare: null, geteilt: null, gespeichert: null, reichweite: null };

/** Wie oft ein Beitrag höchstens abgefragt wird und wie lange nach der Veröffentlichung. */
export const ABRUF_ABSTAND_MS = 6 * 60 * 60 * 1000;
export const ABRUF_ZEITRAUM_TAGE = 90;

const YOUTUBE_BASE = () => process.env.STATISTIK_YOUTUBE_BASE || "https://www.googleapis.com/youtube/v3";
const GRAPH_BASE = () => process.env.STATISTIK_GRAPH_BASE || "https://graph.facebook.com/v19.0";
const INSTAGRAM_BASE = () => process.env.STATISTIK_INSTAGRAM_BASE || "https://graph.instagram.com";
const TIKTOK_BASE = () => process.env.STATISTIK_TIKTOK_BASE || "https://open.tiktokapis.com/v2";
const LINKEDIN_BASE = () => process.env.STATISTIK_LINKEDIN_BASE || "https://api.linkedin.com/v2";

const zahl = (v: unknown): number | null => {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
};

/** Ist der automatische Abruf für diese Plattform eingeschaltet? */
export function abrufAktiv(plattform: string): { aktiv: boolean; grund: string } {
  switch (plattform) {
    case "YOUTUBE":
      return { aktiv: true, grund: "automatisch (YouTube-Schnittstelle)" };
    case "FACEBOOK":
      return { aktiv: true, grund: "automatisch (Facebook-Schnittstelle): Reaktionen, Kommentare, Teilungen; Impressionen erst nach Meta-Freigabe" };
    case "INSTAGRAM":
      return process.env.STATISTIK_INSTAGRAM === "1"
        ? { aktiv: true, grund: "automatisch (Instagram-Schnittstelle)" }
        : { aktiv: false, grund: "vorbereitet – startet nach Freigabe von „instagram_business_manage_insights“ durch Meta" };
    case "TIKTOK":
      return process.env.STATISTIK_TIKTOK === "1"
        ? { aktiv: true, grund: "automatisch (TikTok-Schnittstelle)" }
        : { aktiv: false, grund: "vorbereitet – startet nach Freigabe von „video.list“ durch TikTok" };
    case "LINKEDIN":
      return process.env.STATISTIK_LINKEDIN === "1"
        ? { aktiv: true, grund: "automatisch (LinkedIn-Schnittstelle)" }
        : { aktiv: false, grund: "vorbereitet – LinkedIn gibt Beitragszahlen nur an geprüfte Partner frei" };
    default:
      return { aktiv: false, grund: "keine Plattform-Schnittstelle" };
  }
}

async function json(res: Response, was: string) {
  const text = await res.text();
  if (!res.ok) throw new Error(`${was} (${res.status}): ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : {};
}

/** YouTube: bis zu 50 Videos je Anfrage. */
export async function youtubeZahlen(token: string, videoIds: string[]): Promise<Map<string, BeitragsZahlen>> {
  const out = new Map<string, BeitragsZahlen>();
  for (let i = 0; i < videoIds.length; i += 50) {
    const ids = videoIds.slice(i, i + 50);
    const url = `${YOUTUBE_BASE()}/videos?part=statistics&id=${ids.map(encodeURIComponent).join(",")}`;
    const data = await json(await fetch(url, { headers: { Authorization: `Bearer ${token}` } }), "YouTube-Statistik");
    for (const v of data.items ?? []) {
      const s = v.statistics ?? {};
      out.set(String(v.id), { ...LEER, aufrufe: zahl(s.viewCount), likes: zahl(s.likeCount), kommentare: zahl(s.commentCount) });
    }
  }
  return out;
}

export async function facebookZahlen(token: string, postId: string): Promise<BeitragsZahlen> {
  const felder = "shares,reactions.summary(total_count).limit(0),comments.summary(total_count).limit(0)";
  const url = `${GRAPH_BASE()}/${encodeURIComponent(postId)}?fields=${encodeURIComponent(felder)}&access_token=${encodeURIComponent(token)}`;
  const d = await json(await fetch(url), "Facebook-Statistik");
  return { ...LEER, likes: zahl(d.reactions?.summary?.total_count), kommentare: zahl(d.comments?.summary?.total_count), geteilt: zahl(d.shares?.count ?? 0) };
}

export async function instagramZahlen(token: string, mediaId: string): Promise<BeitragsZahlen> {
  const url = `${INSTAGRAM_BASE()}/${encodeURIComponent(mediaId)}/insights?metric=views,reach,likes,comments,shares,saved&access_token=${encodeURIComponent(token)}`;
  const d = await json(await fetch(url), "Instagram-Statistik");
  const wert = (name: string) => zahl((d.data ?? []).find((m: { name: string }) => m.name === name)?.values?.[0]?.value);
  return { aufrufe: wert("views"), reichweite: wert("reach"), likes: wert("likes"), kommentare: wert("comments"), geteilt: wert("shares"), gespeichert: wert("saved") };
}

/** TikTok liefert beim Veröffentlichen nur eine publish_id; die Video-ID kommt aus dem Veröffentlichungsstatus. */
export async function tiktokZahlen(token: string, publishId: string): Promise<BeitragsZahlen> {
  const status = await json(
    await fetch(`${TIKTOK_BASE()}/post/publish/status/fetch/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ publish_id: publishId }),
    }),
    "TikTok-Status"
  );
  const videoId = status.data?.publicaly_available_post_id?.[0] ?? status.data?.publicly_available_post_id?.[0];
  if (!videoId) return LEER;
  const d = await json(
    await fetch(`${TIKTOK_BASE()}/video/query/?fields=id,view_count,like_count,comment_count,share_count`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ filters: { video_ids: [String(videoId)] } }),
    }),
    "TikTok-Statistik"
  );
  const v = d.data?.videos?.[0] ?? {};
  return { ...LEER, aufrufe: zahl(v.view_count), likes: zahl(v.like_count), kommentare: zahl(v.comment_count), geteilt: zahl(v.share_count) };
}

export async function linkedinZahlen(token: string, postUrn: string): Promise<BeitragsZahlen> {
  const d = await json(
    await fetch(`${LINKEDIN_BASE()}/socialActions/${encodeURIComponent(postUrn)}`, { headers: { Authorization: `Bearer ${token}` } }),
    "LinkedIn-Statistik"
  );
  return { ...LEER, likes: zahl(d.likesSummary?.totalLikes), kommentare: zahl(d.commentsSummary?.aggregatedTotalComments ?? d.commentsSummary?.totalFirstLevelComments) };
}

const LABEL: Record<string, string> = { YOUTUBE: "YouTube", FACEBOOK: "Facebook", INSTAGRAM: "Instagram", TIKTOK: "TikTok", LINKEDIN: "LinkedIn" };

/** Überträgt die Zahlen eines Beitrags in Analytics, Variantenvergleich und Weiterempfehlungen. */
export async function zahlenSpeichern(item: ContentItem, z: BeitragsZahlen, jetzt = new Date()) {
  const quelle = `API:${LABEL[item.platform] ?? item.platform}`;

  const bisher = await prisma.analytics.findFirst({ where: { contentItemId: item.id, quelle } });
  const analytics = { views: z.aufrufe ?? 0, likes: z.likes ?? 0, comments: z.kommentare ?? 0, shares: z.geteilt ?? 0, saves: z.gespeichert ?? 0, recordedAt: jetzt };
  if (bisher) await prisma.analytics.update({ where: { id: bisher.id }, data: analytics });
  else await prisma.analytics.create({ data: { ...analytics, contentItemId: item.id, platform: item.platform, quelle } });

  // Variantenvergleich: Varianten, die mit diesem Beitrag verknüpft sind
  const varianten = await prisma.testVariante.findMany({ where: { workspaceId: item.workspaceId, contentItemId: item.id }, select: { id: true } });
  const vWerte: [string, number | null][] = [["AUFRUFE", z.aufrufe], ["WEITERLEITUNGEN", z.geteilt], ["GESPEICHERT", z.gespeichert]];
  for (const v of varianten) {
    for (const [metrik, wert] of vWerte) {
      if (wert === null) continue;
      const alt = await prisma.variantenMesswert.findFirst({ where: { varianteId: v.id, metrik, quelle } });
      if (alt) await prisma.variantenMesswert.update({ where: { id: alt.id }, data: { wert, erfasstAm: jetzt } });
      else await prisma.variantenMesswert.create({ data: { workspaceId: item.workspaceId, varianteId: v.id, metrik, wert, quelle, erfasstAm: jetzt } });
    }
  }

  // Weiterempfehlungen: Summe aller abgerufenen Beiträge dieser Kampagne und Plattform
  if (item.reichweitenKampagneId) await kampagnenZahlenErneuern(item.workspaceId, item.reichweitenKampagneId, item.platform, quelle, jetzt);
}

async function kampagnenZahlenErneuern(workspaceId: string, kampagneId: string, plattform: ContentItem["platform"], quelle: string, jetzt: Date) {
  const items = await prisma.contentItem.findMany({
    where: { workspaceId, reichweitenKampagneId: kampagneId, platform: plattform, publishedAt: { not: null } },
    select: { id: true, publishedAt: true, analytics: { where: { quelle }, select: { views: true, shares: true } } },
  });
  const mitZahlen = items.filter((i) => i.analytics.length);
  if (!mitZahlen.length) return;
  const von = new Date(Math.min(...mitZahlen.map((i) => i.publishedAt!.getTime())));
  const summe = (f: "views" | "shares") => mitZahlen.reduce((s, i) => s + i.analytics[0][f], 0);
  const plattformName = plattform;
  await prisma.$transaction(async (tx) => {
    await tx.reichweitenKennzahl.deleteMany({ where: { workspaceId, kampagneId, quelle, plattform: plattformName } });
    await tx.reichweitenKennzahl.createMany({
      data: [
        { workspaceId, kampagneId, plattform: plattformName, metrik: "VIDEOAUFRUFE", wert: summe("views"), quelle, zeitraumVon: von, zeitraumBis: jetzt },
        { workspaceId, kampagneId, plattform: plattformName, metrik: "SHARES", wert: summe("shares"), quelle, zeitraumVon: von, zeitraumBis: jetzt },
      ],
    });
  });
}

async function zahlenFuer(account: PlatformAccount, items: ContentItem[]): Promise<Map<string, BeitragsZahlen>> {
  const token = await getValidAccessToken(account);
  const out = new Map<string, BeitragsZahlen>();
  if (account.platform === "YOUTUBE") {
    const r = await youtubeZahlen(token, items.map((i) => i.externalPostId!));
    for (const i of items) { const z = r.get(i.externalPostId!); if (z) out.set(i.id, z); }
    return out;
  }
  for (const i of items) {
    const id = i.externalPostId!;
    const z =
      account.platform === "FACEBOOK" ? await facebookZahlen(token, id)
      : account.platform === "INSTAGRAM" ? await instagramZahlen(token, id)
      : account.platform === "TIKTOK" ? await tiktokZahlen(token, id)
      : account.platform === "LINKEDIN" ? await linkedinZahlen(token, id)
      : null;
    if (z) out.set(i.id, z);
  }
  return out;
}

/** Ein Durchlauf: fällige Beiträge aller Arbeitsbereiche abfragen. Fehler je Konto stoppen nicht den Rest. */
export async function statistikAbrufen(jetzt = new Date(), log: (m: string) => void = () => {}) {
  const pausiert = await pausierteWorkspaces();
  const items = await prisma.contentItem.findMany({
    where: {
      status: "PUBLISHED",
      externalPostId: { not: null },
      simuliertAm: null,
      publishedAt: { gte: new Date(jetzt.getTime() - ABRUF_ZEITRAUM_TAGE * 86_400_000) },
      OR: [{ statistikAbgerufenAm: null }, { statistikAbgerufenAm: { lt: new Date(jetzt.getTime() - ABRUF_ABSTAND_MS) } }],
      ...(pausiert.length ? { workspaceId: { notIn: pausiert } } : {}),
    },
    orderBy: { statistikAbgerufenAm: { sort: "asc", nulls: "first" } },
    take: 200,
  });
  const gruppen = new Map<string, ContentItem[]>();
  for (const i of items) {
    if (!abrufAktiv(i.platform).aktiv) continue;
    const k = `${i.workspaceId}|${i.platform}`;
    gruppen.set(k, [...(gruppen.get(k) ?? []), i]);
  }
  let gespeichert = 0;
  for (const [k, liste] of gruppen) {
    const [workspaceId, platform] = k.split("|");
    const account = await prisma.platformAccount.findFirst({ where: { workspaceId, platform: platform as ContentItem["platform"], status: "CONNECTED" } });
    if (!account) continue;
    try {
      const zahlen = await zahlenFuer(account, liste);
      for (const i of liste) {
        const z = zahlen.get(i.id);
        if (z) { await zahlenSpeichern(i, z, jetzt); gespeichert++; }
        await prisma.contentItem.update({ where: { id: i.id }, data: { statistikAbgerufenAm: jetzt } });
      }
    } catch (err) {
      log(`Statistik ${platform}: ${err instanceof Error ? err.message : String(err)}`);
      // Beim nächsten Abstand erneut versuchen, nicht in jedem Takt
      await prisma.contentItem.updateMany({ where: { id: { in: liste.map((i) => i.id) } }, data: { statistikAbgerufenAm: jetzt } });
    }
  }
  return { geprueft: items.length, gespeichert };
}

/**
 * Läuft im Web-Prozess mit (src/instrumentation.ts), unabhängig vom Versand-Worker:
 * stündlich prüfen, je Beitrag höchstens alle sechs Stunden abrufen. Nur lesend.
 * Abschalten mit STATISTIK_ABRUF=0. Schläft der Dienst (Render-Gratistarif), wird
 * beim Aufwachen nachgeholt.
 */
export function startStatistikAbruf(log: (m: string) => void = (m) => console.log(`[statistik] ${m}`)) {
  if (process.env.STATISTIK_ABRUF === "0") return () => {};
  let laeuft = false;
  const lauf = async () => {
    if (laeuft) return;
    laeuft = true;
    try {
      const r = await statistikAbrufen(new Date(), log);
      if (r.gespeichert) log(`Plattformzahlen aktualisiert: ${r.gespeichert} Beiträge`);
    } catch (err) {
      log(`Abruf fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      laeuft = false;
    }
  };
  const timer = setInterval(lauf, Number(process.env.STATISTIK_INTERVALL_MS ?? 60 * 60 * 1000));
  const erster = setTimeout(lauf, 60_000);
  return () => {
    clearInterval(timer);
    clearTimeout(erster);
  };
}
