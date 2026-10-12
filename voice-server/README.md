# Lingo voice server

Lingo's natural English voice for **Bicara dengan Lingo**, running on your own computer with
[Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) (Apache 2.0, free, no account or API key).
If the server is off or unreachable, the app uses the browser voice instead, so nothing breaks.

## Start

Double-click `start.bat` (Windows). The first run creates a Python environment and downloads the
voice model (~350 MB, into `models/`). Then it prints:

```
Lingo voice server: http://localhost:8800
```

Keep that window open while using Lingo. Needs Python 3.10+.

## Connect the app

In the app's `.env.local` (local dev) or the hosting's environment variables:

```
NEXT_PUBLIC_LINGO_VOICE_URL=http://localhost:8800
```

Check that it works: open http://localhost:8800/health in the browser.

## Settings (optional environment variables)

| Variable | Default | Meaning |
|---|---|---|
| `LINGO_VOICE` | `af_heart` | Kokoro voice, e.g. `af_bella`, `af_sky`, `af_nicole` |
| `LINGO_VOICE_SPEED` | `1.05` | Speaking speed |
| `LINGO_VOICE_PORT` | `8800` | Port |
| `LINGO_VOICE_ORIGINS` | – | Extra allowed web origins, comma separated (e.g. a preview URL) |

## Pronunciation check (optional)

Lets Lingo hear which sounds were said wrong (e.g. "th" said as "t", "v" as "f") and give a tip.
Uses Whisper base.en (what was said) and a wav2vec2 phoneme model (which sounds were made), all on this computer.

1. Run `start.bat` once (so the Python environment exists), close it.
2. Run `install-pronunciation.bat` (~1.5 GB of downloads).
3. Run `start.bat` again. The models (~1.4 GB) download on the first start, then load in seconds.
   `/health` shows `"pronunciation": "ready"` when it is on.

`POST /assess?target=<sentence>` with the learner's audio (16-bit PCM WAV) returns what was said, the
sounds that were heard, a score and, per word, the mistakes with a tip. With `target` (the sentence the learner
tried to say) the check is exact; without it, what Whisper heard is used, which can hide a mistake
("three" said as "tree" is written as "tree").

## Phones of friends (outside this computer)

`localhost` only works on this computer. To let other phones reach the server, expose port 8800
with a tunnel (for example ngrok or Cloudflare Tunnel) and put the tunnel's https URL in
`NEXT_PUBLIC_LINGO_VOICE_URL`. The server limits each address to 60 requests per 10 minutes.
