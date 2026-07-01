# Ziller site — build status & handoff

Migrating **zillerfm.com** off the old WordPress **Bridge** theme onto a bespoke
custom theme generated from this `ziller-site` source. The redesign runs *on*
WordPress (not Cloudflare) because the fund data (iNAV/NAV/MPI) is welded to the
WP server. User has **WP admin only** — no SFTP/hosting or DNS access (domain on
AWS Route 53). Everyone still sees the old Bridge site; the new theme has only
been tested in **Live Preview** (not activated yet).

## How to build & deploy
- Edit the **source** (`ziller-site/*.html`, `styles.css`, `script.js`, `assets/`)
  or the transforms in `build-theme.ps1`. Never hand-edit the generated theme.
- Build: run the **`/build-ziller-theme`** skill, or
  `powershell -NoProfile -ExecutionPolicy Bypass -File build-theme.ps1`.
  It self-verifies and outputs `../ziller-theme.zip` (~10.4 MB).
- Deploy: WP admin → Appearance → Themes → Add New Theme → Upload Theme →
  **Replace current with uploaded** (wait for OneDrive green check first).
- Backup: `git commit` + `git push` (remote `origin` = kevinnajanurdin-cmyk/my-website).
- Packaging gotchas: PHP written **no-BOM**; zip uses **forward-slash** entries
  (PowerShell `Compress-Archive` breaks WP with a bogus "missing style.css").

## Done
- Pages: home (`front-page.php` + shared `header/footer`), `/approach/`, `/team/`,
  `/invest/`, `/funds/` (slug "funds" — "fund" was taken), `/contact/` (Pardot
  subscribe iframe + team directory + Automic registry).
- **Insights = WP Posts**: `page-insights.php` lists posts in the **"Insights"**
  umbrella category; filter tabs = the real sub-categories (Articles / Media /
  Video & Webinars), "Insights" hidden. `single.php` = essay layout. Home teaser
  pulls the 3 latest. Content rule: tag each post **Insights + one real category**.
- **Fund page** data all server-side from existing plugins: NAV/entry/exit +
  historical + CSV download from `unitprices/A0ZFGF.csv`; MPI via `PDF_Manager`;
  monthly report auto-detected `MMYY_ZILR.pdf`; **iNAV via same-origin ice-api
  REST with a live per-second "As at" clock**. Distributions accordion added.
- **Article hero image**: ACF "Hero image" field (registered in `functions.php`)
  lets the essay hero differ from the card thumbnail (featured image), with
  fallback. Card always uses the featured image.
- No Cloudflare `/api/*` calls remain; live externals are intentional embeds
  (Miraqle, Vimeo, Google Fonts, Pardot, Automic link) + server-side ICE feed.

## Open next steps (priority order)
1. **Go-live cutover** (the big one):
   a. Audit live **published** pages (fetch zillerfm.com footer + sitemap) to list
      the compliance pages (Privacy/Terms/Disclaimer/FSG/AML/Active-ETF, etc.).
   b. Rebuild those compliance pages under the new theme (they're in WPBakery).
   c. **Activate** the Ziller theme, then deactivate Bridge + page builders
      (WPBakery, Revolution Slider, Qode). **Order matters** — builders last.
   d. **Keep active**: `Unit Price display` + `PDF Downloader` plugins (the fund
      data engine). Keep WordPress running as the iNAV proxy (ICE IP allow-list).
2. **Hero images**: the "Article Media → Hero image" field only shows in the post
   editor once the Ziller theme is active (or via a WPCode snippet now). Then set
   per-article heroes — Peter Beck → `assets/essays/peter-beck-hero.png` (upload
   to Media), etc.
3. **Distribution values** in `fund.html` are hardcoded — update each period.
4. **Push-to-deploy**: once SFTP/hosting access is obtained, wire git → server so
   the manual zip upload goes away.

## To continue in a new session
Say: *"Continue the Ziller WordPress theme migration — read ziller-site/STATUS.md."*
