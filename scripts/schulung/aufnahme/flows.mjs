import { record } from "./lib.mjs";
const only = process.argv.slice(2);
const F = {};
F.start = async (p, h) => {
  await h.cue(1, () => h.go("/"));
  await h.cue(2, () => h.hl("aside"));
  await h.hl(null);
  await h.cue(3, () => h.nav("/integrations"));
  await h.cue(4, () => h.scroll(150));
  await h.cue(5, () => h.scroll(300));
  await h.cue(6, async () => { await h.scroll(-600, 500); await h.nav("/brand-dna"); });
  await h.cue(7, async () => { await h.type(p.locator("main input").nth(1), "Social-Media-Beratung"); await h.type(p.locator("main input").nth(2), "Kleine Unternehmen in der Region"); await h.click(h.btn(/Brand DNA speichern/)); });
  await h.cue(8, async () => { await h.nav("/ideas"); await h.type(p.getByPlaceholder(/Produktivität/), "Social Media planen in 30 Minuten pro Woche"); await h.click(h.btn(/Ideen generieren/)); });
  await h.cue(9, () => p.waitForTimeout(500));
  await h.cue(10, () => h.hl(null));
};
F.dashboard = async (p, h) => {
  await h.cue(1, () => h.nav("/"));
  await h.cue(2, () => h.hl("main .card"));
  await h.cue(3, () => { h.hl(null); return h.scroll(500); });
  await h.cue(4, async () => { await h.scroll(-500, 600); await h.click(h.btn(/^Woche/)); });
  await h.cue(5, () => h.hl("aside"));
};
F.schulung = async (p, h) => {
  await h.cue(1, () => h.nav("/schulung"));
  await h.cue(2, () => h.hl("main .card"));
  await h.cue(3, () => { h.hl(null); return h.scroll(500); });
  await h.cue(4, () => h.scroll(-500, 800));
};
F.contentFactory = async (p, h) => {
  await h.cue(1, () => h.nav("/content-factory"));
  await h.cue(2, () => h.hl("main .card, main a[href^='/content-factory/']"));
  await h.cue(3, () => h.hlText("main div", "Alle"));
  await h.cue(4, async () => { await h.hl(null); await h.click(h.btn(/Neues Content-Item/)); });
  await h.cue(5, async () => { await p.keyboard.press("Escape"); const a = p.locator("main a[href^='/content-factory/']").first(); await h.click(a); await p.waitForLoadState("networkidle").catch(() => {}); });
  await h.cue(6, () => h.scroll(400));
};
F.ideas = async (p, h) => {
  await h.cue(1, () => h.nav("/ideas"));
  await h.cue(2, () => h.hl("main form"));
  await h.cue(3, async () => { await h.type(p.getByPlaceholder(/Produktivität/), "Kundenstimmen für Social Media nutzen"); await h.click(h.btn(/Ideen generieren/)); });
  await h.cue(4, async () => { await h.hl(null); await p.waitForTimeout(1500); await h.scroll(300); });
  await h.cue(5, async () => { await h.scroll(-300, 400); await h.click(h.btn(/^Manuell/)); });
  await h.cue(6, () => p.waitForTimeout(300));
};
F.contentBrain = async (p, h) => {
  await h.cue(1, () => h.nav("/content-brain"));
  await h.cue(2, () => h.hl("main h1 + p"));
  await h.cue(3, async () => { await h.hl(null); await h.type(p.locator("main textarea").first(), "Erkläre, wie kleine Firmen mit KI in 30 Minuten pro Woche Social Media planen."); await h.type(p.getByPlaceholder(/25-45/), "Selbstständige und kleine Teams"); });
  await h.cue(4, async () => { await h.click(h.btn(/^TikTok/)); await h.hlText("button", "TikTok"); });
  await h.cue(5, async () => { await h.hl(null); await h.glide(p.locator("main input[type=range]")); });
  await h.cue(6, async () => { await h.click(h.btn(/Content-Plan generieren/)); await p.waitForTimeout(3500); });
  await h.cue(7, () => h.scroll(700));
};
F.brandDna = async (p, h) => {
  await h.cue(1, () => h.nav("/brand-dna"));
  await h.cue(2, () => h.hl("main h1 + p"));
  await h.cue(3, async () => { await h.hl(null); await h.type(p.locator("main input").nth(1), "Beratung für Social Media"); await h.type(p.locator("main input").nth(2), "Kleine Unternehmen und Selbstständige"); });
  await h.cue(4, () => h.scroll(700));
  await h.cue(5, async () => { await h.click(h.btn(/Brand DNA speichern/)); await p.waitForTimeout(800); });
};
F.scriptStudio = async (p, h) => {
  await h.cue(1, () => h.nav("/script-studio"));
  await h.cue(2, () => h.hl("main h1 + p"));
  await h.cue(3, async () => { await h.hl(null); await h.type(p.getByPlaceholder(/5 Wege/), "3 Tipps für mehr Sichtbarkeit auf LinkedIn"); });
  await h.cue(4, async () => { await h.click(h.btn(/Script & Hooks generieren/)); await p.waitForTimeout(3500); });
  await h.cue(5, () => h.scroll(500));
};
F.voiceStudio = async (p, h) => {
  await h.cue(1, () => h.nav("/voice-studio"));
  await h.cue(2, () => h.hl("main h1 + p"));
  await h.cue(3, async () => { await h.hl(null); await h.glide(h.btn(/Voice manuell anlegen/)); await h.hl("main button"); await p.waitForTimeout(800); await h.glide(h.btn(/Von ElevenLabs importieren/)); });
  await h.cue(4, async () => { await h.hl(null); await h.glide(p.locator("main textarea").first()); });
};
F.videoStudio = async (p, h) => {
  await h.cue(1, () => h.nav("/video-studio"));
  await h.cue(2, () => h.hl("main h1 + p"));
  await h.cue(3, () => { h.hl(null); return h.scroll(400); });
  await h.cue(4, () => h.scroll(400));
};
F.designStudio = async (p, h) => {
  await h.cue(1, () => h.nav("/design-studio"));
  await h.cue(2, () => h.hl("main h1 + p"));
  await h.cue(3, async () => { await h.hl(null); await h.type(p.getByPlaceholder(/Thema für das Thumbnail/), "5 Fehler bei Instagram-Reels"); });
  await h.cue(4, async () => { await h.click(h.btn(/Konzept generieren/)); await p.waitForTimeout(3000); });
  await h.cue(5, () => h.scroll(500));
};
F.socialMedia = async (p, h) => {
  await h.cue(1, () => h.nav("/social-media"));
  await h.cue(2, () => h.hl("main h1 + p"));
  await h.cue(3, async () => { await h.hl("main .card"); await h.scroll(250); });
  await h.cue(4, async () => { await h.hl(null); await h.scroll(-250, 400); await h.hlText("div", "Noch nicht eingerichtet"); });
  await h.cue(5, () => { h.hl(null); return h.scroll(400); });
};
F.calendar = async (p, h) => {
  await h.cue(1, () => h.nav("/calendar"));
  await h.cue(2, () => h.hl("main h1 + p"));
  await h.cue(3, async () => { await h.hl(null); await h.glide(p.locator("main select").first()); });
  await h.cue(4, async () => { await h.scroll(300); });
};
F.analytics = async (p, h) => {
  await h.cue(1, () => h.nav("/analytics"));
  await h.cue(2, () => h.hl("main h1 + p"));
  await h.cue(3, () => { h.hl(null); return h.scroll(450); });
  await h.cue(4, () => h.scroll(450));
};
F.growth = async (p, h) => {
  await h.cue(1, () => h.nav("/growth"));
  await h.cue(2, () => h.hl("main h1 + p"));
  await h.cue(3, async () => { await h.hl(null); await h.glide(p.locator("main select").first()); });
  await h.cue(4, async () => { await h.scroll(400); });
};
F.revenue = async (p, h) => {
  await h.cue(1, () => h.nav("/revenue"));
  await h.cue(2, () => h.hl("main h1 + p"));
  await h.cue(3, async () => { await h.hl(null); await h.click(h.btn(/Einnahme erfassen/)); });
  await h.cue(4, () => h.scroll(300));
};
F.sales = async (p, h) => {
  await h.cue(1, () => h.nav("/sales"));
  await h.cue(2, () => h.hl("main h1 + p"));
  await h.cue(3, () => { h.hl(null); return h.scroll(350); });
  await h.cue(4, () => h.scroll(500));
  await h.cue(5, () => h.scroll(500));
};
F.website = async (p, h) => {
  await h.cue(1, () => h.nav("/website"));
  await h.cue(2, () => h.hl("main h1 + p"));
  await h.cue(3, () => h.hlText("main p", "Binde"));
  await h.cue(4, async () => { await h.hl(null); await h.type(p.getByPlaceholder(/meine-firma/), "https://meine-firma.de"); await h.click(h.btn(/Webseite hinzufügen/)); });
  await h.cue(5, () => h.scroll(400));
};
F.inbox = async (p, h) => {
  await h.cue(1, () => h.nav("/inbox"));
  await h.cue(2, () => h.hl("main h1 + p"));
  await h.cue(3, async () => { await h.hl(null); await h.click(h.btn(/Konversation simulieren/)); await p.waitForTimeout(2500); });
  await h.cue(4, () => h.scroll(300));
};
F.agents = async (p, h) => {
  await h.cue(1, () => h.nav("/agents"));
  await h.cue(2, () => h.hl("main h1 + p"));
  await h.cue(3, () => { h.hl(null); return h.scroll(500); });
  await h.cue(4, () => h.scroll(-500, 800));
};
F.integrations = async (p, h) => {
  await h.cue(1, () => h.nav("/integrations"));
  await h.cue(2, () => h.hl("main h1 + p"));
  await h.cue(3, async () => { await h.hl(null); await h.scroll(400); });
  await h.cue(4, async () => { const l = p.locator("main a", { hasText: /API-Schlüssel holen/ }).first(); await h.glide(l); await h.hl("main a[href^='http']"); });
  await h.cue(5, () => { h.hl(null); return h.scroll(500); });
};
F.billing = async (p, h) => {
  await h.cue(1, () => h.nav("/billing"));
  await h.cue(2, () => h.hl("main h1 + p"));
  await h.cue(3, async () => { await h.hl(null); await h.click(h.btn(/^Jährlich/)); await p.waitForTimeout(1200); await h.click(h.btn(/^Monatlich/)); await h.scroll(300); });
  await h.cue(4, async () => { await h.glide(h.btn(/Zahlungspflichtig bestellen/)); });
  await h.cue(5, async () => { await h.glide(p.getByPlaceholder(/S58-XXXX/)); });
};
F.settings = async (p, h) => {
  await h.cue(1, () => h.nav("/settings"));
  await h.cue(2, () => h.hl("main h1 + p"));
  await h.cue(3, () => { h.hl(null); return h.scroll(500); });
  await h.cue(4, () => h.scroll(600));
};
const ORDER = ["start","ideas","contentBrain","brandDna","contentFactory","scriptStudio","voiceStudio","videoStudio","designStudio","socialMedia","calendar","analytics","growth","revenue","sales","website","inbox","agents","integrations","billing","settings","schulung","dashboard"];
for (const k of (only.length ? only : ORDER)) { try { await record(k, F[k]); } catch (e) { console.log("FEHLER", k, e.message.split("\n")[0]); } }
