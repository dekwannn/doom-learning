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

## Phones of friends (outside this computer)

`localhost` only works on this computer. To let other phones reach the server, expose port 8800
with a tunnel (for example ngrok or Cloudflare Tunnel) and put the tunnel's https URL in
`NEXT_PUBLIC_LINGO_VOICE_URL`. The server limits each address to 60 requests per 10 minutes.
