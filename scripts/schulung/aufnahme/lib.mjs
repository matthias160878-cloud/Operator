const { chromium } = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
import fs from "node:fs";
import { execFileSync } from "node:child_process";
export const BASE = "http://127.0.0.1:3126";
export const V = process.env.S58_VIDEO_DIR ?? "/tmp/s58-videos";
const ROOT = new URL("../../../", import.meta.url).pathname.replace(/\/$/, "");
const TEXTS = JSON.parse(fs.readFileSync(`${ROOT}/messages/de/schulungVideos.json`, "utf8")).videos;
const LOGO = "data:image/png;base64," + fs.readFileSync(`${ROOT}/public/brand/logo-voll.png`).toString("base64");
const INIT = `(()=>{ if(window.__s58) return; window.__s58=1;
 const mk=()=>{ if(!document.body||document.getElementById('s58cur')) return;
  const st=document.createElement('style'); st.textContent='#s58cur{position:fixed;width:22px;height:22px;border-radius:50%;background:rgba(255,200,0,.9);border:2px solid #fff;z-index:2147483647;pointer-events:none;transform:translate(-50%,-50%);left:-50px;top:-50px;box-shadow:0 0 0 6px rgba(255,200,0,.25)}.s58hl{outline:3px solid #ffc800!important;outline-offset:3px;border-radius:8px}';
  document.head.append(st); const u=document.createElement('div'); u.id='s58cur'; document.body.append(u);
  addEventListener('mousemove',e=>{u.style.left=e.clientX+'px';u.style.top=e.clientY+'px'},true); };
 window.__mk=mk; window.__hl=sel=>{document.querySelectorAll('.s58hl').forEach(e=>e.classList.remove('s58hl')); if(sel){const e=document.querySelector(sel); if(e)e.classList.add('s58hl')}};
 window.__hlText=(tag,txt)=>{document.querySelectorAll('.s58hl').forEach(e=>e.classList.remove('s58hl')); const e=[...document.querySelectorAll(tag)].find(x=>x.textContent.trim().startsWith(txt)); if(e)e.classList.add('s58hl')};
})()`;
const INTRO = (c) => `<html><body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:22px;background:radial-gradient(circle at 30% 20%,#1b1650,#05070f 60%);font-family:system-ui,sans-serif"><img src="${LOGO}" style="height:260px;object-fit:contain"><div style="color:#a8b0d8;letter-spacing:.35em;font-size:20px">AI SOCIAL COMMAND CENTER</div></body></html>`;
export async function record(key, fn) {
  const cues = TEXTS[key].cues;
  const pw = fs.readFileSync(`${V}/pw-a.txt`, "utf8").trim();
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const dir = `${V}/raw-${key}`; fs.rmSync(dir, { recursive: true, force: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, baseURL: BASE, locale: "de-DE", recordVideo: { dir, size: { width: 1280, height: 720 } } });
  await ctx.addCookies([{ name: "s58_locale", value: "de", url: BASE }]);
  await ctx.addInitScript(INIT);
  const r = await ctx.request.post(`${BASE}/api/auth/login`, { data: { email: "kunde-a@example.test", password: pw }, headers: { origin: BASE, "x-forwarded-for": `10.${Math.floor(Math.random()*250)}.${Math.floor(Math.random()*250)}.${Math.floor(Math.random()*250)}` } });
  if (r.status() !== 200) throw new Error("login " + r.status());
  const p = await ctx.newPage();
  const t0 = Date.now(); const marks = [];
  const now = () => (Date.now() - t0) / 1000;
  await p.setContent(INTRO()); await p.waitForTimeout(2200);
  const h = {
    now,
    cue: async (n, actions) => {
      const id = `c${n}`; const text = cues[id]; if (!text) throw new Error("Cue fehlt: " + id);
      const start = now(); const hold = Math.max(3800, text.length * 80);
      if (actions) { try { await actions(); } catch (e) { console.log(`  [${key}] ${id}: ${e.message.split("\n")[0]}`); } }
      const rest = hold - (now() - start) * 1000; if (rest > 0) await p.waitForTimeout(rest);
      marks.push({ id, start: +start.toFixed(2), end: +now().toFixed(2) });
    },
    hl: (sel) => p.evaluate((s) => window.__hl(s), sel).catch(() => {}),
    hlText: (tag, txt) => p.evaluate(([a, b]) => window.__hlText(a, b), [tag, txt]).catch(() => {}),
    go: async (path) => { await p.goto(path); await p.waitForLoadState("networkidle").catch(() => {}); await p.waitForTimeout(900); await p.evaluate(() => window.__mk && window.__mk()).catch(() => {}); },
    glide: async (loc) => { await loc.scrollIntoViewIfNeeded().catch(() => {}); const b = await loc.boundingBox().catch(() => null); if (!b) return false; await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 30 }); await p.waitForTimeout(300); return true; },
    click: async (loc) => { await h.glide(loc); await loc.click(); },
    nav: async (href) => { const l = p.locator(`aside a[href="${href}"], nav a[href="${href}"]`).first(); if (!(await l.count()) || !p.url().startsWith(BASE)) { await h.go(href); return; } await h.click(l); await p.waitForURL(`**${href}`); await p.waitForLoadState("networkidle").catch(() => {}); await p.waitForTimeout(900); await p.evaluate(() => window.__mk && window.__mk()).catch(() => {}); },
    type: async (loc, text) => { await h.glide(loc); await loc.click(); await loc.pressSequentially(text, { delay: 50 }); },
    scroll: async (y, ms = 1500) => { await p.mouse.wheel(0, y); await p.waitForTimeout(ms); },
    btn: (name) => p.getByRole("button", { name }).first(),
  };
  await fn(p, h);
  await p.waitForTimeout(500);
  const duration = now();
  await ctx.close(); await browser.close();
  const file = fs.readdirSync(dir).find((f) => f.endsWith(".webm"));
  execFileSync("ffmpeg", ["-y", "-i", `${dir}/${file}`, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "30", "-preset", "veryfast", "-r", "15", "-movflags", "+faststart", `${V}/out/${key}.mp4`], { stdio: "ignore" });
  fs.writeFileSync(`${V}/out/${key}.json`, JSON.stringify({ key, duration: +duration.toFixed(1), cues: marks }, null, 1));
  const mb = (fs.statSync(`${V}/out/${key}.mp4`).size / 1e6).toFixed(1);
  console.log(`fertig ${key}: ${duration.toFixed(0)} s, ${mb} MB, ${marks.length} Cues`);
}
