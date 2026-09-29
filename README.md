# Staffora – GitHub Pages

1. Create a **public** GitHub repo (e.g. `staffora-pages`).
2. Upload **these files at the root** (not inside a subfolder):
   - index.html
   - dashboard.html
   - ingame.html
   - unban.html
   - .nojekyll
3. Settings → Pages → Deploy from **main** branch → **/ (root)**.
4. Bot API: `https://staffora.apps.bot-hosting.cloud`
5. In Discord Developer Portal → OAuth2 redirects add:
   `https://YOURUSER.github.io/REPONAME/dashboard.html`
   (and your bot callback URL as already configured)

Login uses the bot host for Discord OAuth, then returns to this GitHub Pages site.
