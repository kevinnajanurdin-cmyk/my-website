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
  It self-verifies and outputs **`%USERPROFILE%\Downloads\ziller-theme.zip`** (~10.4 MB).
- Deploy: WP admin → Appearance → Themes → Add New Theme → Upload Theme →
  **Replace current with uploaded**. Upload the copy **from Downloads**.
- Backup: `git commit` + `git push` (remote `origin` = kevinnajanurdin-cmyk/my-website).
- Packaging gotchas: PHP written **no-BOM**; zip uses **forward-slash** entries
  (PowerShell `Compress-Archive` breaks WP with a bogus "missing style.css"). The zip
  is written to **Downloads (outside OneDrive) on purpose**: a OneDrive Files-On-Demand
  cloud placeholder on the synced Desktop uploads as a *truncated* file → the same bogus
  "missing style.css" (style.css sorts late in the archive, so it's the first file lost).
  The build deletes any stale Desktop copy. Don't move the output back under OneDrive.

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
- **Compliance/legal**: `/disclaimer/` rebuilt as a static `page-disclaimer.php`
  (iNAV + general disclaimer, verbatim from the live page; generated inline in
  `build-theme.ps1` from the approach.html shell, so WP auto-uses it for the
  existing "disclaimer" slug). Footer **Legal** column rewired to the Privacy
  Statement PDF + `/disclaimer/` (the dead `#` Privacy/Disclosures/Terms stubs are
  gone), and the footer copyright line now carries the real ABN/CAR/AFSL chain
  instead of the `00 000 000 000` placeholder — across all footer-bearing templates.
- **Editable in WP without a rebuild**: the 3 home-page performance figures (net
  return p.a. / outperformance / total return since inception) are now WP **Customizer**
  fields — Appearance > Customize > "Ziller - Home Figures". Update them at month-end
  there; no theme re-upload. Values persist across future theme uploads (stored in the
  DB per theme slug). Also: browser-tab titles render as "Page | Ziller FM" (pipe
  separator + Fund/Invest label fixes), and the essay read-time is de-duplicated
  (Reading Time WP plugin's in-body line hidden; header "N min read" kept, and dropped
  entirely on Videos & Webinars posts).
- **Careers**: `/careers/` rebuilt as `page-careers.php` (Investment Analyst +
  Investment Intern; two-minute founder-led-stock video pitch via filemail.com →
  careers@zillerfm.com, reviewed by the CIO). Static template, WP auto-serves it for
  the "careers" slug. Not linked in the main nav/footer — matches the live site,
  where /careers/ is a direct-URL page. Role copy is faithful to the live page but
  lean (the REST fetch only returned a summary); enrich the marketing prose if wanted.

## Open next steps (priority order)
1. **Go-live cutover** (the big one):
   a. ✅ DONE — audited live **published** pages via WP REST
      (`/wp-json/wp/v2/pages?per_page=100`; sitemap/robots blocked the fetcher).
      Only ONE compliance *page* exists (`/disclaimer/`); Privacy is a **PDF** (no
      rebuild). No separate Terms/FSG/TMD/AML/Active-ETF pages.
   b. ✅ DONE — Disclaimer rebuilt (`page-disclaimer.php`) + footer Legal links and
      identity line wired (see Done). **⚠ Compliance sign-off:** the ABN/CAR/AFSL
      footer line and the disclaimer body are copied verbatim from the live site —
      have compliance confirm both before activation.
   c. **Redirects (301)** for the old Bridge URLs the new theme re-slugs — the old
      pages are still live and indexed (Google has `/ziller-global-fund/`,
      `/people/`), so redirect: `/ziller-global-fund/` → `/funds/`,
      `/people/` → `/team/`, `/invest-with-us/` → `/invest/`,
      `/investment-philosophy-and-process/` → `/approach/`, `/subscribe/` →
      `/contact/`. `/careers/` ✅ rebuilt (`page-careers.php`, keeps the same slug —
      no redirect needed). `/quarterly-performance-update/` deferred (thin Q1 2026
      Vimeo + boilerplate — redirect to `/insights/` or re-publish as an Insights
      Video post later). Drop the junk `/potential-bot-page/`.
   d. **Activate** the Ziller theme, then deactivate Bridge + page builders
      (WPBakery, Revolution Slider, Qode). **Order matters** — builders last.
   e. **Keep active**: `Unit Price display` + `PDF Downloader` plugins (the fund
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
