/*
 * SECRET 58 Webseiten-Assistent — Einbindungsskript.
 * Enthält keine Schlüssel. Die öffentliche Kennung (data-secret58-key) ist
 * widerrufbar und funktioniert nur auf der bestätigten Domain.
 */
(function () {
  var script = document.currentScript;
  if (!script) return;
  var key = script.getAttribute("data-secret58-key");
  if (!key || document.getElementById("secret58-widget")) return;
  var base = new URL(script.src).origin;
  var endpoint = base + "/api/widget/" + encodeURIComponent(key) + "/chat";
  var history = [];

  var root = document.createElement("div");
  root.id = "secret58-widget";
  root.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2147483000;font:14px/1.4 system-ui,sans-serif";
  var button = document.createElement("button");
  button.type = "button";
  button.textContent = "Chat";
  button.setAttribute("aria-expanded", "false");
  button.style.cssText = "border:0;border-radius:999px;padding:12px 18px;background:#6D5BFF;color:#fff;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.25)";
  var panel = document.createElement("div");
  panel.style.cssText = "display:none;width:min(340px,calc(100vw - 32px));height:420px;max-height:70vh;background:#fff;color:#111;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.3);margin-bottom:8px;flex-direction:column;overflow:hidden";
  var log = document.createElement("div");
  log.setAttribute("role", "log");
  log.setAttribute("aria-live", "polite");
  log.style.cssText = "flex:1;overflow:auto;padding:12px";
  var note = document.createElement("div");
  note.textContent = "KI-Assistent — Antworten können Fehler enthalten.";
  note.style.cssText = "font-size:11px;color:#666;padding:6px 12px;border-bottom:1px solid #eee";
  var form = document.createElement("form");
  form.style.cssText = "display:flex;border-top:1px solid #eee";
  var input = document.createElement("input");
  input.maxLength = 1000;
  input.placeholder = "Ihre Frage …";
  input.setAttribute("aria-label", "Nachricht");
  input.style.cssText = "flex:1;border:0;padding:12px;font:inherit;outline:none";
  var send = document.createElement("button");
  send.type = "submit";
  send.textContent = "Senden";
  send.style.cssText = "border:0;background:#6D5BFF;color:#fff;padding:0 14px;cursor:pointer";
  form.appendChild(input);
  form.appendChild(send);
  panel.appendChild(note);
  panel.appendChild(log);
  panel.appendChild(form);
  root.appendChild(panel);
  root.appendChild(button);
  document.body.appendChild(root);

  function add(role, text) {
    var p = document.createElement("p");
    p.textContent = text;
    p.style.cssText = "margin:0 0 8px;padding:8px 10px;border-radius:8px;max-width:85%;white-space:pre-wrap;" +
      (role === "user" ? "background:#eef;margin-left:auto" : "background:#f4f4f5");
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
  }

  button.addEventListener("click", function () {
    var open = panel.style.display === "none";
    panel.style.display = open ? "flex" : "none";
    button.setAttribute("aria-expanded", String(open));
    if (open) input.focus();
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;
    input.value = "";
    add("user", text);
    history.push({ role: "user", content: text });
    history = history.slice(-10);
    send.disabled = true;
    fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: history }),
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        var reply = res.ok && res.d.reply ? res.d.reply : (res.d && res.d.error) || "Gerade nicht verfügbar.";
        add("assistant", reply);
        if (res.ok) history.push({ role: "assistant", content: reply });
      })
      .catch(function () { add("assistant", "Gerade nicht verfügbar."); })
      .then(function () { send.disabled = false; });
  });
})();
