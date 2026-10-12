"""
Lingo's voice server: Kokoro-82M (Apache 2.0) running on your own computer.

The app sends the English text Lingo wants to say and gets a WAV back. If this server is off or
unreachable, the app simply uses the browser voice, so nothing breaks.

  GET  /health            -> {"ok": true, "voice": "af_heart"}
  POST /tts  {"text": ""}  -> audio/wav (24 kHz mono)

Settings (environment variables, all optional):
  LINGO_VOICE        Kokoro voice name             (default af_heart)
  LINGO_VOICE_SPEED  speaking speed                (default 1.05)
  LINGO_VOICE_PORT   port                          (default 8800)
  LINGO_VOICE_ORIGINS extra allowed origins, comma separated (e.g. a tunnel or preview URL)
"""

import io
import json
import os
import threading
import time
import wave
from collections import defaultdict, deque
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import numpy as np
from kokoro_onnx import Kokoro

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL = os.path.join(HERE, "models", "kokoro-v1.0.onnx")
VOICES = os.path.join(HERE, "models", "voices-v1.0.bin")

PORT = int(os.environ.get("LINGO_VOICE_PORT", "8800"))
VOICE = os.environ.get("LINGO_VOICE", "af_heart")
SPEED = float(os.environ.get("LINGO_VOICE_SPEED", "1.05"))
MAX_CHARS = 400  # one or two sentences per request; the app sends Lingo's reply sentence by sentence
RATE = (60, 600)  # at most 60 requests per 10 minutes per address (the server may be reachable through a tunnel)

# Browsers allowed to call this server (web app, local dev, Capacitor Android) plus any extra ones from the env
ALLOWED_ORIGINS = {
    "https://lingora-learn.vercel.app",
    "http://localhost:3000",
    "https://localhost",
    "http://localhost",
    "capacitor://localhost",
} | {o.strip().rstrip("/") for o in os.environ.get("LINGO_VOICE_ORIGINS", "").split(",") if o.strip()}

print(f"Loading Kokoro ({VOICE}) ...", flush=True)
kokoro = Kokoro(MODEL, VOICES)
kokoro.create("Ready.", voice=VOICE, speed=SPEED, lang="en-us")  # warm up, so the first real request is fast
synth_lock = threading.Lock()  # the CPU does one sentence at a time
recent = defaultdict(deque)


def to_wav(samples: np.ndarray, rate: int) -> bytes:
    pcm = (np.clip(samples, -1, 1) * 32767).astype(np.int16)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(pcm.tobytes())
    return buf.getvalue()


def allowed(addr: str) -> bool:
    now = time.time()
    q = recent[addr]
    while q and now - q[0] > RATE[1]:
        q.popleft()
    if len(q) >= RATE[0]:
        return False
    q.append(now)
    return True


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):  # keep the console readable
        pass

    def _cors(self):
        origin = (self.headers.get("Origin") or "").rstrip("/")
        if origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "content-type, ngrok-skip-browser-warning")

    def _send(self, status: int, body: bytes, ctype: str):
        self.send_response(status)
        self._cors()
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _json(self, status: int, data: dict):
        self._send(status, json.dumps(data).encode(), "application/json")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path.rstrip("/") == "/health":
            return self._json(200, {"ok": True, "voice": VOICE})
        self._json(404, {"error": "Not found"})

    def do_POST(self):
        if self.path.rstrip("/") != "/tts":
            return self._json(404, {"error": "Not found"})
        origin = (self.headers.get("Origin") or "").rstrip("/")
        if origin and origin not in ALLOWED_ORIGINS:
            return self._json(403, {"error": "Origin not allowed"})
        addr = self.headers.get("X-Forwarded-For", self.client_address[0]).split(",")[0].strip()
        if not allowed(addr):
            return self._json(429, {"error": "Too many requests"})
        try:
            length = min(int(self.headers.get("Content-Length", "0")), 8192)
            text = str(json.loads(self.rfile.read(length) or b"{}").get("text", "")).strip()
        except (ValueError, json.JSONDecodeError):
            text = ""
        if not text or len(text) > MAX_CHARS:
            return self._json(400, {"error": "Invalid text"})

        started = time.time()
        with synth_lock:
            samples, rate = kokoro.create(text, voice=VOICE, speed=SPEED, lang="en-us")
        print(f"{time.time() - started:4.1f}s  {text[:70]}", flush=True)
        self._send(200, to_wav(samples, rate), "audio/wav")


if __name__ == "__main__":
    print(f"Lingo voice server: http://localhost:{PORT}  (Ctrl+C to stop)", flush=True)
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
