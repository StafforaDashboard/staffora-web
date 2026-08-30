# Staffora Dashboard — GitHub Pages ONLY

**Live:** https://stafforadashboard.github.io/staffora-web/

The **complete classic dashboard** (Leveo black/grey UI, all tabs) runs only here.

The bot host is **API-only** (no dashboard UI).

## Discord Developer Portal — OAuth2 Redirect

Add **exactly**:

```
https://stafforadashboard.github.io/staffora-web/oauth/callback.html
```

Remove old bot-hosting dashboard redirects if you want (optional).

## Bot env

```
OAUTH_REDIRECT_URI=https://stafforadashboard.github.io/staffora-web/oauth/callback.html
DASHBOARD_URL=https://stafforadashboard.github.io/staffora-web/
PUBLIC_URL=https://staffora.apps.bot-hosting.cloud
```

Upload latest `staffora-upload.zip` so `POST /api/oauth/exchange` exists.

## Files needed on this repo

- `index.html` (classic shell)
- `dash-loader.js`
- `zb0.txt` + `zb1.txt` (compressed app)
- `oauth/callback.html`

If missing, upload `staffora-gh-pages-full.zip` contents into this repo root.
