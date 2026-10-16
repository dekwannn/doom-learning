"""
Lingo's voice server: Kokoro-82M (Apache 2.0) running on your own computer.

The app sends the English text Lingo wants to say and gets a WAV back. If this server is off or
unreachable, the app simply uses the browser voice, so nothing breaks.

  GET  /health                  -> {"ok": true, "voice": "af_heart", "pronunciation": "ready" | "loading" | "off"}
  POST /tts  {"text": "", "speed": 0.7}  -> audio/wav (24 kHz mono); speed is optional (0.5-1.3, default below)
  POST /assess?target=<text>     body: audio/wav of the learner (16-bit PCM)  -> pronunciation check (JSON)
       target is optional: the sentence the learner tried to say; without it, what Whisper heard is used

The pronunciation check is optional: it needs the extra packages in requirements-pronunciation.txt
(install-pronunciation.bat). Without them the server still speaks; /assess answers 501.

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
from urllib.parse import parse_qs, urlparse

import numpy as np
from kokoro_onnx import Kokoro

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL = os.path.join(HERE, "models", "kokoro-v1.0.onnx")
VOICES = os.path.join(HERE, "models", "voices-v1.0.bin")

PORT = int(os.environ.get("LINGO_VOICE_PORT", "8800"))
VOICE = os.environ.get("LINGO_VOICE", "af_heart")
SPEED = float(os.environ.get("LINGO_VOICE_SPEED", "1.05"))
MAX_CHARS = 400  # one or two sentences per request; the app sends Lingo's reply sentence by sentence
# At most 150 requests per 10 minutes per address (the server may be reachable through a tunnel).
# One spoken turn is about 1 pronunciation check plus 3-5 sentences of Lingo's voice.
RATE = (150, 600)

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

# Pronunciation check: loaded in the background so Lingo can already speak while it loads (~1 minute)
checker = None
checker_state = "loading"
check_lock = threading.Lock()


def load_checker():
    global checker, checker_state
    try:
        from pronunciation import Checker
    except ImportError:
        checker_state = "off"
        print("Pronunciation check off (run install-pronunciation.bat to turn it on)", flush=True)
        return
    started = time.time()
    try:
        checker = Checker()
        checker_state = "ready"
        print(f"Pronunciation check ready ({time.time() - started:.0f}s)", flush=True)
    except Exception as exc:  # e.g. a model could not be downloaded
        checker_state = "off"
        print(f"Pronunciation check failed to load: {exc}", flush=True)


def read_wav_16k(data: bytes) -> np.ndarray:
    """16-bit PCM WAV (any rate, mono or stereo) -> mono float32 at 16 kHz"""
    with wave.open(io.BytesIO(data)) as w:
        if w.getsampwidth() != 2:
            raise ValueError("expected 16-bit PCM")
        rate, channels = w.getframerate(), w.getnchannels()
        pcm = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    if channels > 1:
        pcm = pcm.reshape(-1, channels).mean(axis=1)
    if rate != 16000:
        n = int(len(pcm) * 16000 / rate)
        pcm = np.interp(np.linspace(0, len(pcm), n, endpoint=False), np.arange(len(pcm)), pcm).astype(np.float32)
    return pcm


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
        # Chrome asks before a public site (lingora-learn.vercel.app) may call this computer (Private Network Access)
        if self.headers.get("Access-Control-Request-Private-Network") == "true" and origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Private-Network", "true")

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
            return self._json(200, {"ok": True, "voice": VOICE, "pronunciation": checker_state})
        self._json(404, {"error": "Not found"})

    def do_POST(self):
        url = urlparse(self.path)
        route = url.path.rstrip("/")
        if route not in ("/tts", "/assess"):
            return self._json(404, {"error": "Not found"})
        origin = (self.headers.get("Origin") or "").rstrip("/")
        if origin and origin not in ALLOWED_ORIGINS:
            return self._json(403, {"error": "Origin not allowed"})
        addr = self.headers.get("X-Forwarded-For", self.client_address[0]).split(",")[0].strip()
        if not allowed(addr):
            return self._json(429, {"error": "Too many requests"})
        if route == "/assess":
            return self.assess(parse_qs(url.query).get("target", [""])[0].strip()[:MAX_CHARS] or None)
        try:
            length = min(int(self.headers.get("Content-Length", "0")), 8192)
            body = json.loads(self.rfile.read(length) or b"{}")
            text = str(body.get("text", "")).strip()
            # A slower voice for the "Pelan" buttons; anything odd falls back to the normal speed
            speed = min(1.3, max(0.5, float(body.get("speed", SPEED))))
        except (ValueError, TypeError, AttributeError, json.JSONDecodeError):
            text, speed = "", SPEED
        if not text or len(text) > MAX_CHARS:
            return self._json(400, {"error": "Invalid text"})

        started = time.time()
        with synth_lock:
            samples, rate = kokoro.create(text, voice=VOICE, speed=speed, lang="en-us")
        print(f"{time.time() - started:4.1f}s  {text[:70]}" + (f"  (speed {speed:.2f})" if speed != SPEED else ""), flush=True)
        self._send(200, to_wav(samples, rate), "audio/wav")

    def assess(self, target):
        if checker_state != "ready":
            status = 503 if checker_state == "loading" else 501
            return self._json(status, {"error": f"Pronunciation check {checker_state}"})
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 44 or length > 3_000_000:  # up to ~90 s of 16 kHz audio
            return self._json(400, {"error": "Invalid audio"})
        try:
            audio = read_wav_16k(self.rfile.read(length))
        except (ValueError, wave.Error, EOFError):
            return self._json(400, {"error": "Invalid audio"})
        started = time.time()
        with check_lock:
            result = checker.check(audio, target)
        flagged = [w["word"] for w in result["words"] if not w["ok"]]
        print(f"{time.time() - started:4.1f}s  check {result['score']:3d}  {len(audio) / 16000:4.1f}s audio  "
              f"{result['said'][:50]!r}  {flagged}", flush=True)
        self._json(200, result)


if __name__ == "__main__":
    threading.Thread(target=load_checker, daemon=True).start()
    print(f"Lingo voice server: http://localhost:{PORT}  (Ctrl+C to stop)", flush=True)
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
