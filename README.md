# Ukulele Engraving — Ukunili Music

Live engraving configurator for custom ukuleles. Static site (HTML + React via Babel standalone).

## Files
- `index.html` — main page
- `Ukunili-engrave.html` — engraving landing page
- `assets/js/engraving/configurator.jsx` — React configurator (live engraving preview)
- `assets/js/engraving/tweaks-panel.jsx` — configurator tweak controls
- `images/` — local image assets
- `fonts/` — local font assets

## Deploy
Hosted on Cloudflare Pages. Pushing to `main` triggers an automatic deploy.

## Local preview
Just open `index.html` in a browser, or run a tiny local server:

```bash
python3 -m http.server 8080
```

Then visit http://localhost:8080
