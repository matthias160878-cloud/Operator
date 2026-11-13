"""TradingView-Webhook-Empfänger (nur Standardbibliothek).

TradingView kann keine eigenen Header senden - das gemeinsame Geheimnis steht daher im JSON-Body
("secret") und wird zeitkonstant verglichen. Server lauscht standardmäßig nur auf 127.0.0.1;
für TradingView einen HTTPS-Reverse-Proxy oder Tunnel davorschalten.
"""
from __future__ import annotations

import hmac
import json
import logging
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from .pipeline import SignalPipeline

MAX_BODY = 10_000
log = logging.getLogger("algo_trading.webhook")


def handle(pipeline: SignalPipeline, secret: str, body: bytes) -> tuple[int, dict]:
    if not secret:
        return 503, {"error": "WEBHOOK_SECRET nicht gesetzt"}
    try:
        payload = json.loads(body)
        if not isinstance(payload, dict):
            raise ValueError
    except ValueError:
        return 400, {"error": "Ungültiges JSON"}
    if not hmac.compare_digest(str(payload.get("secret", "")).encode(), secret.encode()):
        return 401, {"error": "Nicht autorisiert"}
    try:
        out = pipeline.process(payload)
    except Exception:
        log.exception("Signal-Verarbeitung fehlgeschlagen")
        return 500, {"error": "Interner Fehler"}
    return (200 if out.status not in {"rejected"} else 422), out.to_dict()


def serve(pipeline: SignalPipeline, secret: str, host: str = "127.0.0.1", port: int = 8765) -> None:  # pragma: no cover
    if not secret:
        raise SystemExit("WEBHOOK_SECRET muss gesetzt sein, bevor der Webhook startet.")

    class Handler(BaseHTTPRequestHandler):
        def _send(self, code: int, data: dict) -> None:
            raw = json.dumps(data).encode()
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(raw)))
            self.end_headers()
            self.wfile.write(raw)

        def do_GET(self) -> None:
            self._send(200, {"ok": True, "mode": pipeline.broker.mode}) if self.path == "/health" else self._send(404, {"error": "not found"})

        def do_POST(self) -> None:
            if self.path != "/webhook":
                return self._send(404, {"error": "not found"})
            length = int(self.headers.get("Content-Length") or 0)
            if length <= 0 or length > MAX_BODY:
                return self._send(413, {"error": "Body fehlt oder zu groß"})
            code, data = handle(pipeline, secret, self.rfile.read(length))
            log.info("Webhook %s -> %s", code, data.get("status", data.get("error")))
            self._send(code, data)

        def log_message(self, *args) -> None:
            pass

    log.info("Webhook lauscht auf http://%s:%s/webhook (Modus: %s)", host, port, pipeline.broker.mode)
    ThreadingHTTPServer((host, port), Handler).serve_forever()
