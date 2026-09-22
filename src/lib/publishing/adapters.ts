import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ContentItem, MediaAsset, PlatformAccount } from "@prisma/client";
import { getValidAccessToken } from "./tokens";

export interface PublishResult {
  published: boolean;
  message: string;
  externalPostId?: string;
}

function parseHashtags(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

async function readLocalMedia(relativeUrl: string): Promise<Buffer> {
  const filePath = path.join(process.cwd(), "public", relativeUrl);
  return readFile(filePath);
}

function buildCaption(item: ContentItem): string {
  const hashtags = parseHashtags(item.hashtags);
  const tagText = hashtags.length ? `\n\n${hashtags.join(" ")}` : "";
  return `${item.caption || item.title}${tagText}`;
}

/**
 * Veröffentlicht ein Video auf YouTube über den Resumable-Upload der
 * YouTube Data API v3. Setzt voraus, dass der Account CONNECTED ist und
 * eine echte Videodatei als MediaAsset vorliegt.
 */
export async function publishToYouTube(
  account: PlatformAccount,
  item: ContentItem,
  video: MediaAsset | undefined
): Promise<PublishResult> {
  if (!video) {
    return {
      published: false,
      message: "Kein Video vorhanden — YouTube benötigt eine Videodatei zum Veröffentlichen.",
    };
  }
  const accessToken = await getValidAccessToken(account);
  const fileBuffer = await readLocalMedia(video.url);

  const metadata = {
    snippet: {
      title: item.title.slice(0, 100),
      description: buildCaption(item),
      tags: parseHashtags(item.hashtags).map((h) => h.replace(/^#/, "")),
    },
    status: { privacyStatus: "public" },
  };

  const initRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": "video/mp4",
        "X-Upload-Content-Length": String(fileBuffer.byteLength),
      },
      body: JSON.stringify(metadata),
    }
  );
  if (!initRes.ok) {
    const text = await initRes.text();
    throw new Error(`YouTube-Upload-Start fehlgeschlagen (${initRes.status}): ${text.slice(0, 300)}`);
  }
  const uploadUrl = initRes.headers.get("location");
  if (!uploadUrl) throw new Error("YouTube-Upload: keine Upload-URL von Google erhalten.");

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(fileBuffer.byteLength),
    },
    body: new Uint8Array(fileBuffer),
  });
  const uploadText = await uploadRes.text();
  if (!uploadRes.ok) {
    throw new Error(`YouTube-Video-Upload fehlgeschlagen (${uploadRes.status}): ${uploadText.slice(0, 300)}`);
  }
  const uploadData = uploadText ? JSON.parse(uploadText) : {};
  return { published: true, message: "Auf YouTube veröffentlicht.", externalPostId: uploadData.id };
}

/**
 * Teilt einen Text-/Link-Beitrag über die LinkedIn UGC Posts API. Braucht
 * kein Video — funktioniert bereits mit Titel/Caption/Hashtags.
 * Bild-/Video-Anhänge sind hier bewusst nicht gebaut (separater Asset-
 * Registrierungs-Ablauf bei LinkedIn), Text-/Link-Beiträge reichen für den
 * ersten echten Test.
 */
export async function publishToLinkedIn(
  account: PlatformAccount,
  item: ContentItem
): Promise<PublishResult> {
  if (!account.externalAccountId) {
    throw new Error("LinkedIn-Mitglieds-ID fehlt — Account erneut verbinden.");
  }
  const accessToken = await getValidAccessToken(account);

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: `urn:li:person:${account.externalAccountId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: buildCaption(item) },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`LinkedIn-Veröffentlichung fehlgeschlagen (${res.status}): ${text.slice(0, 300)}`);
  }
  const postId = res.headers.get("x-restli-id") ?? undefined;
  return { published: true, message: "Auf LinkedIn veröffentlicht.", externalPostId: postId };
}

/**
 * Veröffentlicht auf einer Facebook-Seite: mit Video als Seiten-Video-Post
 * (multipart Upload), ohne Video als reiner Text-/Link-Post im Feed.
 */
export async function publishToFacebook(
  account: PlatformAccount,
  item: ContentItem,
  video: MediaAsset | undefined
): Promise<PublishResult> {
  if (!account.externalAccountId) {
    throw new Error("Facebook-Seiten-ID fehlt — Account erneut verbinden.");
  }
  const accessToken = await getValidAccessToken(account);

  if (video) {
    const fileBuffer = await readLocalMedia(video.url);
    const form = new FormData();
    form.set("description", buildCaption(item));
    form.set("access_token", accessToken);
    form.set("source", new Blob([new Uint8Array(fileBuffer)], { type: "video/mp4" }), "video.mp4");

    const res = await fetch(`https://graph-video.facebook.com/v19.0/${account.externalAccountId}/videos`, {
      method: "POST",
      body: form,
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Facebook-Video-Veröffentlichung fehlgeschlagen (${res.status}): ${text.slice(0, 300)}`);
    }
    const data = text ? JSON.parse(text) : {};
    return { published: true, message: "Video auf Facebook-Seite veröffentlicht.", externalPostId: data.id };
  }

  const res = await fetch(`https://graph.facebook.com/v19.0/${account.externalAccountId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ message: buildCaption(item), access_token: accessToken }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Facebook-Veröffentlichung fehlgeschlagen (${res.status}): ${text.slice(0, 300)}`);
  }
  const data = text ? JSON.parse(text) : {};
  return { published: true, message: "Beitrag auf Facebook-Seite veröffentlicht.", externalPostId: data.id };
}

/**
 * Veröffentlicht ein Video als Reel über die Instagram Graph API
 * (Zwei-Schritt-Ablauf: Media-Container erzeugen, dann veröffentlichen).
 * Instagram lädt das Video selbst von einer öffentlich erreichbaren
 * HTTPS-URL — braucht daher `publicOrigin` (die tatsächliche Domain, unter
 * der diese App erreichbar ist), nicht die Rohdaten.
 */
export async function publishToInstagram(
  account: PlatformAccount,
  item: ContentItem,
  video: MediaAsset | undefined,
  publicOrigin: string
): Promise<PublishResult> {
  if (!video) {
    return {
      published: false,
      message: "Kein Video vorhanden — Instagram benötigt ein Bild oder Video zum Veröffentlichen.",
    };
  }
  if (!account.externalAccountId) {
    throw new Error("Instagram-Konto-ID fehlt — Account erneut verbinden.");
  }
  const accessToken = await getValidAccessToken(account);
  const videoUrl = `${publicOrigin}${video.url}`;

  const createRes = await fetch(
    `https://graph.instagram.com/v21.0/${account.externalAccountId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        media_type: "REELS",
        video_url: videoUrl,
        caption: buildCaption(item),
        access_token: accessToken,
      }),
    }
  );
  const createText = await createRes.text();
  if (!createRes.ok) {
    throw new Error(`Instagram-Media-Erstellung fehlgeschlagen (${createRes.status}): ${createText.slice(0, 300)}`);
  }
  const { id: containerId } = JSON.parse(createText) as { id: string };

  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const statusRes = await fetch(
      `https://graph.instagram.com/v21.0/${containerId}?fields=status_code&access_token=${encodeURIComponent(accessToken)}`
    );
    const statusData = (await statusRes.json().catch(() => ({}))) as { status_code?: string };
    if (statusData.status_code === "FINISHED") break;
    if (statusData.status_code === "ERROR") {
      throw new Error("Instagram konnte das Video nicht verarbeiten.");
    }
  }

  const publishRes = await fetch(
    `https://graph.instagram.com/v21.0/${account.externalAccountId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ creation_id: containerId, access_token: accessToken }),
    }
  );
  const publishText = await publishRes.text();
  if (!publishRes.ok) {
    throw new Error(`Instagram-Veröffentlichung fehlgeschlagen (${publishRes.status}): ${publishText.slice(0, 300)}`);
  }
  const publishData = JSON.parse(publishText) as { id: string };
  return { published: true, message: "Als Reel auf Instagram veröffentlicht.", externalPostId: publishData.id };
}

/**
 * Reicht ein Video über die TikTok Content Posting API ein (Direct Post,
 * PULL_FROM_URL). Funktioniert erst, sobald TikTok die App für
 * video.publish freigegeben hat (siehe publishingCaveat) — bis dahin
 * liefert TikTok hier ehrlich einen Berechtigungsfehler zurück.
 */
export async function publishToTikTok(
  account: PlatformAccount,
  item: ContentItem,
  video: MediaAsset | undefined,
  publicOrigin: string
): Promise<PublishResult> {
  if (!video) {
    return {
      published: false,
      message: "Kein Video vorhanden — TikTok benötigt eine Videodatei zum Veröffentlichen.",
    };
  }
  const accessToken = await getValidAccessToken(account);
  const videoUrl = `${publicOrigin}${video.url}`;

  const res = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      post_info: {
        title: buildCaption(item).slice(0, 150),
        privacy_level: "SELF_ONLY",
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: { source: "PULL_FROM_URL", video_url: videoUrl },
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`TikTok-Veröffentlichung fehlgeschlagen (${res.status}): ${text.slice(0, 300)}`);
  }
  const data = JSON.parse(text) as { data?: { publish_id?: string } };
  return {
    published: true,
    message:
      "An TikTok übergeben (Status: SELF_ONLY/privat zur Prüfung, bis die App-Freigabe für öffentliches Posten vorliegt).",
    externalPostId: data.data?.publish_id,
  };
}
