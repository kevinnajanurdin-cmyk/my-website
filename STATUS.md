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
  It self-verifies and outputs **`Desktop\ziller-theme.zip`** (~12.7 MB), then **pins it**
  (always keep on this device).
- Deploy: WP admin → Appearance → Themes → Add New Theme → Upload Theme →
  **Replace current with uploaded**. Upload the Desktop zip; a plain-local twin is
  also written to **`%USERPROFILE%\Downloads\ziller-theme.zip`** — switch to that copy
  if the upload ever hits the bogus "missing style.css" (OneDrive mid-sync).
- Backup: `git commit` + `git push` (remote `origin` = kevinnajanurdin-cmyk/my-website).
- Packaging gotchas — the **"missing style.css" saga** (recurred even after each "fix"):
  1) Structure: zip needs **forward-slash entries** (never `Compress-Archive`) **+ explicit
  directory entries** (`ziller/`, `ziller/assets/`, …) — a bare .NET `ZipArchive` writes
  only file entries. PHP written **no-BOM**. 2) Upload size ruled out (server allows 512 MB).
  3) **Transport**: the error recurred with a zip that verified PERFECT on disk (integrity,
  dir entries, strict extraction sim finds style.css) — so the bytes get corrupted between
  disk and server. The Desktop copy stays a **OneDrive reparse point** even when pinned;
  uploading while OneDrive re-syncs a freshly rebuilt zip can stream stale/partial bytes.
  Hence the build ALSO writes a twin to **`Downloads\ziller-theme.zip`** (plain disk, no
  sync driver) as the fallback upload. If a failure recurs: hard-refresh the upload page,
  re-pick the file fresh (upload the Downloads copy), and test transport by uploading the
  zip to Media Library and comparing its byte size to the on-disk size.

## Done
- Pages: home (`front-page.php` + shared `header/footer`), and the design is served on
  the **existing OLD page slugs** so the other admins keep their same pages/URLs:
  Fund Information (`page-ziller-global-fund.php`), Investment Principles and Process
  (`page-investment-philosophy-and-process.php`), Invest with us (`page-invest-with-us.php`),
  Team (`page-people.php`, incl. the Careers accordion), `/contact/` (Pardot form + team
  directory w/ photos + email/LinkedIn icons + Automic registry), `/insights/`,
  `/disclaimer/`, `/subscribe/` (Pardot form), `/quarterly-performance-update/` (Vimeo via
  Customizer + disclaimer). Nav labels stay Fund/Approach/Team/Invest; all internal links
  point to the old slugs. **Delete at cutover: the 4 preview pages (Kevin: /funds/
  /approach/ /invest/ /team/), the Potential Bot page, and the old WP "Careers" page
  (careers now lives on the Team page — no standalone template).**
- **Insights = WP Posts**: `page-insights.php` lists posts in the **"Insights"**
  umbrella category; filter tabs = the real sub-categories (Articles / Media /
  Video & Webinars), "Insights" hidden. `single.php` = essay layout. Home teaser
  pulls the 3 latest **Articles**. Content rule: tag each post **Insights + one real category**.
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
- **Careers**: lives as the **dropdown accordion at the bottom of the Team page**
  (above "Work with us") — Investment Analyst + Investment Intern; two-minute
  founder-led-stock video pitch via filemail.com → careers@zillerfm.com, reviewed by
  the CIO. The standalone `/careers/` template was removed at the user's request
  ("move careers into the Team page"); **trash the old WP "Careers" page at cutover**
  so /careers/ doesn't fall back to index.php with the stale WPBakery content.

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
   c. **Page mapping ✅ DONE** — the theme serves the design on the **existing OLD page
      slugs**, so existing URLs are preserved and **no redirects are needed**: Fund
      Information → `ziller-global-fund`, Investment Principles and Process →
      `investment-philosophy-and-process`, Invest with us → `invest-with-us`, Team →
      `people` (Contact/Insights/Disclaimer/Careers/Subscribe/Quarterly already match).
      At cutover, **delete the 4 preview pages** (Kevin: Funds/Approach/Invest/Team) and
      the **Potential Bot page** so they don't shadow anything, and set the Quarterly
      video in Appearance → Customize → "Ziller - Quarterly Update".
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
