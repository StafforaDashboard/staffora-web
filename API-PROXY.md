# API Proxy (Avast / URL-Blacklist Fix)

Avast blocks `*.bot-hosting.cloud`. Fix: proxy API through **staffora.info**.

## Option A — Cloudflare Worker (recommended)

1. Put **staffora.info** DNS on Cloudflare (free).
2. Workers → Create → paste `assets/cloudflare-worker.js`.
3. Triggers / Routes:
   - `staffora.info/api/*`
   - `staffora.info/auth/*`
4. Website uses same-origin API automatically (empty STAFFORA_API).
5. Discord Developer Portal → OAuth2 Redirects **add**:
   - `https://staffora.info/auth/callback`
6. Bot `.env` (optional but better):
   - `PUBLIC_URL=https://staffora.info`
   - `OAUTH_REDIRECT_URI=https://staffora.info/auth/callback`
   - Keep bot process on bot-hosting; only public URL changes via proxy.

## Option B — Avast exception

Allow: `staffora.apps.bot-hosting.cloud`

## Option C — Manual API URL

Browser console on staffora.info:
```js
localStorage.setItem('staffora_api', 'https://YOUR-UNBLOCKED-API-HOST')
```
