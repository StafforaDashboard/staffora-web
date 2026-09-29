# Staffora Blueprint UI (mit API)

## Dateien
- `index.html` — Landing
- `dashboard.html` — Admin-Dashboard (Login → Server → Settings / Panels / Stats)
- `ic-panel.html` — IC Panel (Login + Access-Rolle)
- `ban-appeal.html` — Öffentlicher Ban Appeal (Roblox-Name → Check → Formular)
- `styles.css` — Design
- `app.js` — **Echte** Anbindung an Staffora Bot-API

## API
Standard: `https://staffora.apps.bot-hosting.cloud`  
Ändern: `localStorage.setItem('staffora_api','https://dein-host')` oder `window.STAFFORA_API` im HTML.

## Ablauf Dashboard
1. Discord OAuth (`/auth/login`)
2. Server wählen
3. Config + Rollen/Kanäle laden
4. Kanäle/Rollen an Settings übernehmen (Dropdown + Übernehmen)
5. Panel senden / Activity starten / Team-Stats laden

## Bot muss laufen
`GET /api/health` muss erreichbar sein. OAuth Redirect & PUBLIC_URL müssen zur API passen.
