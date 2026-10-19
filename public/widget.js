/*!
 * SECRET 58 Website-Widget — Kontakt/Chat für die eigene Website.
 *
 * Einbinden (vor </body>):
 *   <script src="https://DEINE-APP/widget.js" data-key="WIDGET-ID" async></script>
 *
 * Optionale Attribute: data-title, data-greeting, data-color (#hex),
 * data-position (right|left), data-lang (de|en), data-privacy-url.
 * Steuerung per JS: window.Secret58Widget.open() / .close()
 *
 * Nachrichten landen im Posteingang der App, Antworten erscheinen hier.
 * Ohne Abhängigkeiten, Styles im Shadow DOM (keine Konflikte mit der Seite).
 */
(function () {
  "use strict";
  if (window.Secret58Widget) return;

  var script = document.currentScript;
  if (!script) return;
  var data = script.dataset;
  var widgetKey = (data.key || "").trim();
  if (!widgetKey) {
    console.warn("[SECRET 58 Widget] data-key fehlt — Widget wird nicht angezeigt.");
    return;
  }
  var apiBase = new URL(script.src, location.href).origin;
  var endpoint = apiBase + "/api/v1/widget/messages";

  var lang = (data.lang || document.documentElement.lang || navigator.language || "de").slice(0, 2).toLowerCase();
  var TEXT = {
    de: {
      title: "Schreib uns",
      greeting: "Hallo! Wie können wir helfen? Wir antworten hier im Chat.",
      open: "Chat öffnen",
      close: "Chat schließen",
      name: "Name",
      email: "E-Mail (optional, für die Antwort per Mail)",
      message: "Deine Nachricht …",
      send: "Senden",
      sending: "Sende …",
      privacy: "Mit dem Senden stimmst du der Verarbeitung deiner Angaben zur Beantwortung zu.",
      privacyLink: "Datenschutz",
      error: "Senden fehlgeschlagen — bitte später erneut versuchen.",
      team: "Team",
      you: "Du",
      newConversation: "Neue Unterhaltung",
    },
    en: {
      title: "Message us",
      greeting: "Hi! How can we help? We reply right here in the chat.",
      open: "Open chat",
      close: "Close chat",
      name: "Name",
      email: "Email (optional, to get the reply by mail)",
      message: "Your message …",
      send: "Send",
      sending: "Sending …",
      privacy: "By sending, you agree that we process your details to reply.",
      privacyLink: "Privacy",
      error: "Sending failed — please try again later.",
      team: "Team",
      you: "You",
      newConversation: "New conversation",
    },
  };
  var t = TEXT[lang] || TEXT.en;
  var title = data.title || t.title;
  var greeting = data.greeting || t.greeting;
  var color = /^#[0-9a-f]{3,8}$/i.test(data.color || "") ? data.color : "#6d5dfc";
  var position = data.position === "left" ? "left" : "right";
  var privacyUrl = /^https?:\/\//i.test(data.privacyUrl || "") ? data.privacyUrl : "";

  var storageKey = "s58-widget:" + widgetKey;
  function loadToken() {
    try {
      return localStorage.getItem(storageKey) || "";
    } catch {
      return "";
    }
  }
  function saveToken(value) {
    try {
      if (value) localStorage.setItem(storageKey, value);
      else localStorage.removeItem(storageKey);
    } catch {
      /* Speicher gesperrt (privater Modus) — Unterhaltung gilt dann nur für diesen Seitenaufruf. */
    }
  }

  var token = loadToken();
  var messages = [];
  var seen = {};
  var isOpen = false;
  var unread = 0;
  var pollTimer = null;

  var host = document.createElement("div");
  host.setAttribute("data-secret58-widget", "");
  var root = host.attachShadow({ mode: "open" });
  root.innerHTML =
    "<style>" +
    ":host{all:initial}" +
    "*{box-sizing:border-box;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}" +
    ".launcher{position:fixed;bottom:20px;" + position + ":20px;z-index:2147483000;width:56px;height:56px;border-radius:50%;border:0;cursor:pointer;background:var(--c);color:#fff;box-shadow:0 6px 20px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center}" +
    ".launcher:focus-visible,button:focus-visible,textarea:focus-visible,input:focus-visible{outline:3px solid #ffbf47;outline-offset:2px}" +
    ".badge{position:absolute;top:-2px;right:-2px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:#e5484d;color:#fff;font-size:12px;line-height:20px;text-align:center}" +
    ".panel{position:fixed;bottom:88px;" + position + ":20px;z-index:2147483000;width:min(360px,calc(100vw - 32px));height:min(520px,calc(100vh - 120px));display:flex;flex-direction:column;background:#fff;color:#1a1a1a;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.25);overflow:hidden}" +
    ".panel[hidden]{display:none}" +
    ".head{background:var(--c);color:#fff;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:8px}" +
    ".head h2{margin:0;font-size:16px;font-weight:600}" +
    ".x{background:transparent;border:0;color:#fff;font-size:22px;line-height:1;cursor:pointer;padding:2px 6px}" +
    ".list{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;background:#f6f6f8}" +
    ".msg{max-width:85%;padding:8px 11px;border-radius:12px;font-size:14px;line-height:1.4;white-space:pre-wrap;word-wrap:break-word}" +
    ".msg small{display:block;font-size:11px;opacity:.7;margin-bottom:2px}" +
    ".team{align-self:flex-start;background:#fff;border:1px solid #e3e3e8}" +
    ".visitor{align-self:flex-end;background:var(--c);color:#fff}" +
    "form{padding:10px;border-top:1px solid #e3e3e8;display:flex;flex-direction:column;gap:6px;background:#fff}" +
    "input,textarea{width:100%;font-size:14px;padding:8px 10px;border:1px solid #cfcfd6;border-radius:8px;color:#1a1a1a;background:#fff}" +
    "textarea{resize:none;height:64px}" +
    ".hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}" +
    ".row{display:flex;gap:6px;align-items:center;justify-content:space-between}" +
    ".send{background:var(--c);color:#fff;border:0;border-radius:8px;padding:8px 16px;font-size:14px;cursor:pointer}" +
    ".send[disabled]{opacity:.6;cursor:default}" +
    ".note{font-size:11px;color:#666;margin:0}.note a{color:inherit}" +
    ".err{font-size:12px;color:#c62828;margin:0}" +
    ".reset{background:none;border:0;color:#666;font-size:11px;text-decoration:underline;cursor:pointer;padding:0}" +
    "</style>" +
    '<button class="launcher" type="button" aria-expanded="false">' +
    '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5h16v11H8l-4 4V5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>' +
    '<span class="badge" hidden></span></button>' +
    '<section class="panel" role="dialog" aria-modal="false" hidden>' +
    '<div class="head"><h2></h2><button class="x" type="button">×</button></div>' +
    '<div class="list" aria-live="polite"></div>' +
    "<form novalidate>" +
    '<div class="intro"><input name="name" maxlength="80" autocomplete="name"><input name="email" type="email" maxlength="200" autocomplete="email" style="margin-top:6px"></div>' +
    '<div class="hp" aria-hidden="true"><input name="website" tabindex="-1" autocomplete="off"></div>' +
    '<textarea name="message" maxlength="2000" required></textarea>' +
    '<p class="err" hidden></p>' +
    '<div class="row"><p class="note"></p><button class="send" type="submit"></button></div>' +
    '<button class="reset" type="button" hidden></button>' +
    "</form></section>";

  host.style.setProperty("--c", color);
  var launcher = root.querySelector(".launcher");
  var badge = root.querySelector(".badge");
  var panel = root.querySelector(".panel");
  var list = root.querySelector(".list");
  var form = root.querySelector("form");
  var intro = root.querySelector(".intro");
  var errorBox = root.querySelector(".err");
  var sendButton = root.querySelector(".send");
  var resetButton = root.querySelector(".reset");
  var closeButton = root.querySelector(".x");

  root.querySelector("h2").textContent = title;
  panel.setAttribute("aria-label", title);
  launcher.setAttribute("aria-label", t.open);
  closeButton.setAttribute("aria-label", t.close);
  form.elements.name.placeholder = t.name;
  form.elements.name.setAttribute("aria-label", t.name);
  form.elements.email.placeholder = t.email;
  form.elements.email.setAttribute("aria-label", t.email);
  form.elements.message.placeholder = t.message;
  form.elements.message.setAttribute("aria-label", t.message);
  sendButton.textContent = t.send;
  resetButton.textContent = t.newConversation;
  var note = root.querySelector(".note");
  note.textContent = t.privacy + " ";
  if (privacyUrl) {
    var link = document.createElement("a");
    link.href = privacyUrl;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = t.privacyLink;
    note.appendChild(link);
  }

  function bubble(from, body) {
    var el = document.createElement("div");
    el.className = "msg " + (from === "visitor" ? "visitor" : "team");
    var label = document.createElement("small");
    label.textContent = from === "visitor" ? t.you : t.team;
    el.appendChild(label);
    el.appendChild(document.createTextNode(body));
    return el;
  }

  function render() {
    list.textContent = "";
    list.appendChild(bubble("team", greeting));
    messages.forEach(function (m) {
      list.appendChild(bubble(m.from, m.body));
    });
    list.scrollTop = list.scrollHeight;
    intro.hidden = Boolean(token);
    resetButton.hidden = !token;
    badge.hidden = unread === 0;
    badge.textContent = String(unread);
  }

  function addMessages(incoming, countUnread) {
    incoming.forEach(function (m) {
      if (seen[m.id]) return;
      seen[m.id] = true;
      messages.push(m);
      if (countUnread && !isOpen && m.from === "team") unread++;
    });
    render();
  }

  function lastAt() {
    var latest = "";
    messages.forEach(function (m) {
      if (m.at > latest) latest = m.at;
    });
    return latest;
  }

  function poll() {
    if (!token || document.hidden) return;
    var url = endpoint + "?key=" + encodeURIComponent(widgetKey) + "&token=" + encodeURIComponent(token);
    var after = lastAt();
    if (after) url += "&after=" + encodeURIComponent(after);
    fetch(url, { credentials: "omit" })
      .then(function (res) {
        if (res.status === 404) {
          token = "";
          saveToken("");
          messages = [];
          seen = {};
          render();
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then(function (body) {
        if (body && body.messages) addMessages(body.messages, true);
      })
      .catch(function () {
        /* offline — nächster Versuch beim nächsten Intervall */
      });
  }

  function schedulePoll() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = token ? setInterval(poll, isOpen ? 5000 : 60000) : null;
  }

  function setOpen(next) {
    isOpen = next;
    panel.hidden = !next;
    launcher.setAttribute("aria-expanded", String(next));
    launcher.setAttribute("aria-label", next ? t.close : t.open);
    if (next) {
      unread = 0;
      render();
      poll();
      (token ? form.elements.message : form.elements.name).focus();
    }
    schedulePoll();
  }

  launcher.addEventListener("click", function () {
    setOpen(!isOpen);
  });
  closeButton.addEventListener("click", function () {
    setOpen(false);
    launcher.focus();
  });
  panel.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      setOpen(false);
      launcher.focus();
    }
  });
  form.elements.message.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });
  resetButton.addEventListener("click", function () {
    token = "";
    saveToken("");
    messages = [];
    seen = {};
    schedulePoll();
    render();
    form.elements.name.focus();
  });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) poll();
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = form.elements.message.value.trim();
    if (!text) return;
    errorBox.hidden = true;
    sendButton.disabled = true;
    sendButton.textContent = t.sending;
    var payload = {
      key: widgetKey,
      message: text,
      page: location.href.split("#")[0].slice(0, 500),
      website: form.elements.website.value,
    };
    if (token) payload.token = token;
    else {
      payload.name = form.elements.name.value.trim();
      payload.email = form.elements.email.value.trim();
    }
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "omit",
    })
      .then(function (res) {
        return res.json().then(function (body) {
          if (!res.ok) throw new Error(body && body.error ? body.error : t.error);
          return body;
        });
      })
      .then(function (body) {
        if (body.token) {
          token = body.token;
          saveToken(token);
          messages = [];
          seen = {};
        }
        form.elements.message.value = "";
        addMessages(body.messages || [], false);
        schedulePoll();
      })
      .catch(function (err) {
        errorBox.textContent = err && err.message ? err.message : t.error;
        errorBox.hidden = false;
      })
      .then(function () {
        sendButton.disabled = false;
        sendButton.textContent = t.send;
      });
  });

  render();
  (document.body || document.documentElement).appendChild(host);
  if (token) {
    poll();
    schedulePoll();
  }

  window.Secret58Widget = {
    open: function () {
      setOpen(true);
    },
    close: function () {
      setOpen(false);
    },
  };
})();
