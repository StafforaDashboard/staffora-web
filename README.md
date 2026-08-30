# Staffora Dashboard (GitHub Pages)

**Live:** https://stafforadashboard.github.io/staffora-web/

Uses the **classic bot dashboard** (all tabs: Tickets, Büros, Duty, Dienstnummern, Ausweise, …).

## Requirements
1. Bot online on bot-hosting with the latest zip
2. Discord OAuth redirect: `https://staffora.apps.bot-hosting.cloud/auth/callback`

## Flow
Login → Bot OAuth → return to GitHub Pages with token → classic dashboard loads
