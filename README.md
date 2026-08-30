# Staffora Dashboard (GitHub Pages ONLY)

**Live:** https://stafforadashboard.github.io/staffora-web/

This is the **only** dashboard UI. The bot host is API-only.

## Discord OAuth Redirect

Add exactly:

`https://stafforadashboard.github.io/staffora-web/oauth/callback.html`

## API (bot)

`https://staffora.apps.bot-hosting.cloud`

- `POST /api/oauth/exchange` — code → session token
- `/api/me`, `/api/guilds`, …

## Deploy bot zip

Upload latest `staffora-upload.zip` so `/api/oauth/exchange` exists.
