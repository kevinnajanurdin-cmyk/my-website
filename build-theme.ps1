#Requires -Version 5.1
# ============================================================================
#  build-theme.ps1  -  Ziller WordPress theme builder
#
#  Compiles the ziller-site static source into ../ziller-theme.zip, ready to
#  upload via WP admin (Appearance > Themes > Add New Theme > Upload Theme >
#  "Replace current with uploaded").
#
#  RUN:   powershell -ExecutionPolicy Bypass -File .\build-theme.ps1
#         (or invoke the /build-ziller-theme skill in Claude Code)
#
#  EDIT THE SOURCE ONLY: ziller-site/*.html, styles.css, script.js, assets/,
#  or the transforms further down this file. Never hand-edit the generated
#  theme. Content (posts, fund data, subscribe) is managed in WordPress and
#  needs no rebuild.
# ============================================================================
$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)   # no BOM (critical for generated PHP)

# Paths are relative to THIS script, so the build works in any session/machine.
$src       = $PSScriptRoot
$buildRoot = Join-Path ([System.IO.Path]::GetTempPath()) 'ziller-theme-build'
$theme     = Join-Path $buildRoot 'ziller'
# Output the zip to the OneDrive Desktop (per user preference). OneDrive Files On-Demand
# can otherwise turn an idle Desktop copy into a cloud PLACEHOLDER, and uploading a
# not-yet-hydrated placeholder sends WordPress a truncated archive -> bogus "missing
# style.css". To prevent that, the freshly built zip is PINNED ("always keep on this
# device") right after it is written (see below), so it stays fully local. See STATUS.md.
$zip       = Join-Path (Split-Path $src -Parent) 'ziller-theme.zip'
$oldZip    = Join-Path $env:USERPROFILE 'Downloads\ziller-theme.zip'   # remove the interim Downloads copy

# --- Validate the source before building ------------------------------------
$required = @('index.html','approach.html','team.html','invest.html','fund.html','insights.html','styles.css','script.js','assets')
$missing  = @($required | Where-Object { -not (Test-Path (Join-Path $src $_)) })
if ($missing.Count -gt 0) {
  Write-Host ("BUILD FAILED: missing source in '{0}': {1}" -f $src, ($missing -join ', '))
  Write-Host "Run this script from inside the ziller-site folder."
  exit 1
}

# Fresh build dir
if (Test-Path $buildRoot) { Remove-Item $buildRoot -Recurse -Force }
New-Item -ItemType Directory -Force $theme | Out-Null

$html = [System.IO.File]::ReadAllText((Join-Path $src "index.html"))
$T = '<?php echo get_template_directory_uri(); ?>'

# Rewrite HTML-referenced asset paths to the theme directory
$html = $html.Replace('"assets/', '"' + $T + '/assets/')

# styles.css is enqueued via functions.php; scripts too
$html = $html.Replace('<link rel="stylesheet" href="styles.css" />', '')
$html = $html.Replace('<script src="script.js" defer></script>', '')
$html = $html.Replace('<script src="prefetch.js" defer></script>', '')

# Dynamic body class (functions.php adds page-home on the front page)
$html = $html.Replace('<body class="page-home">', '<body <?php body_class(); ?>>')

# Internal links -> WordPress permalink form (these pages get created later)
$html = $html.Replace('"approach.html"','"/investment-philosophy-and-process/"')
$html = $html.Replace('"team.html"','"/people/"')
$html = $html.Replace('"insights.html"','"/insights/"')
$html = $html.Replace('"invest.html"','"/invest-with-us/"')
$html = $html.Replace('"fund.html"','"/ziller-global-fund/"')
$html = $html.Replace('href="#contact"','href="/contact/"')   # Contact nav/footer -> dedicated page
$html = $html.Replace('"peter-beck-rocket-lab.html"','"/peter-beck-rocket-lab/"')
$html = $html.Replace('"the-founders-advantage.html"','"/the-founders-advantage/"')
$html = $html.Replace('"catl.html"','"/catl/"')

# WP hooks
$html = $html.Replace('</head>', "<?php wp_head(); ?>`r`n</head>")
$html = $html.Replace('</body>', "<?php wp_footer(); ?>`r`n</body>")

# Let WP / Rank Math own the title + description
$html = $html -replace '\s*<title>.*?</title>', ''
$html = $html -replace '\s*<meta name="description"[^>]*>', ''

# Home Insights teaser: swap the 3 hardcoded rows for the 3 latest Insights posts.
$homeInsList = @'
<ul class="insights-list">
<?php
        $home_cat  = get_term_by( 'slug', 'articles', 'category' );   // home teaser = Articles only (not Media / Videos & Webinars)
        $home_args = array( 'post_type' => 'post', 'post_status' => 'publish', 'posts_per_page' => 3, 'ignore_sticky_posts' => true );
        if ( $home_cat ) { $home_args['cat'] = (int) $home_cat->term_id; }
        $home_q = new WP_Query( $home_args );
        if ( $home_q->have_posts() ) : while ( $home_q->have_posts() ) : $home_q->the_post(); ?>
          <li>
            <span class="insight-date"><?php echo esc_html( get_the_date( 'M Y' ) ); ?></span>
            <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
          </li>
        <?php endwhile; wp_reset_postdata(); endif; ?>
        </ul>
'@
$html = [regex]::Replace($html, '(?s)<ul class="insights-list">.*?</ul>', { param($m) $homeInsList.Trim() })

# Home performance figures -> Customizer-editable (Appearance > Customize >
# "Ziller - Home Figures"), so month-end updates need no theme rebuild. The current
# values become the defaults. 24.7 is the animated counter's data-count target;
# 39.5 / 120.5 are static text in the "odd" stat cards.
$figReturnPa = @'
data-count="<?php echo esc_attr( get_theme_mod( 'ziller_return_pa', '24.7' ) ); ?>"
'@
$figOutperf = @'
<span class="odd-figure"><?php echo esc_html( get_theme_mod( 'ziller_outperformance', '39.5' ) ); ?><span class="odd-unit">%</span></span>
'@
$figReturnIncep = @'
<span class="odd-figure"><?php echo esc_html( get_theme_mod( 'ziller_return_incep', '120.5' ) ); ?><span class="odd-unit">%</span></span>
'@
$html = $html.Replace('data-count="24.7"', $figReturnPa.Trim())
$html = $html.Replace('<span class="odd-figure">39.5<span class="odd-unit">%</span></span>', $figOutperf.Trim())
$html = $html.Replace('<span class="odd-figure">120.5<span class="odd-unit">%</span></span>', $figReturnIncep.Trim())

# ── Split into header / front-page / footer ─────────────────────────────
$hEnd   = $html.IndexOf('</header>') + '</header>'.Length
$fStart = $html.IndexOf('<footer class="site-footer">')
$header = $html.Substring(0, $hEnd)
$main   = $html.Substring($hEnd, $fStart - $hEnd)
$footer = $html.Substring($fStart)
$front  = "<?php get_header(); ?>`r`n" + $main + "`r`n<?php get_footer(); ?>`r`n"

[System.IO.File]::WriteAllText((Join-Path $theme "header.php"),     $header, $utf8)
[System.IO.File]::WriteAllText((Join-Path $theme "front-page.php"), $front,  $utf8)
[System.IO.File]::WriteAllText((Join-Path $theme "footer.php"),     $footer, $utf8)

# ── Sub-pages: each is a SELF-CONTAINED page-{slug}.php (own nav/footer/
#    inline animation script). WP auto-uses page-{slug}.php for a Page whose
#    slug matches. ──────────────────────────────────────────────────────
# Old-site slug map: the new design serves on the EXISTING (old) page slugs so the
# other admins keep their same pages/URLs. Body class stays page-{source} (CSS hook);
# only the output template filename uses the old WP slug.
$ziller_wpslug = @{ 'approach' = 'investment-philosophy-and-process'; 'team' = 'people'; 'invest' = 'invest-with-us' }
foreach ($slug in @('approach','team','invest')) {
	$p = [System.IO.File]::ReadAllText((Join-Path $src "$slug.html"))
	$cls = "page-$slug"

	# Asset paths — cover markup + inline-script quote styles
	$p = $p.Replace('"assets/', '"' + $T + '/assets/')
	$p = $p.Replace("'assets/", "'" + $T + '/assets/')
	$p = $p.Replace('`assets/', '`' + $T + '/assets/')

	# Internal links -> WordPress permalinks (index.html and index.html#anchor
	# both collapse correctly: "index.html" -> "/", "index.html#fund" -> "/#fund")
	$p = $p.Replace('index.html#contact', '/contact/')
	$p = $p.Replace('index.html', '/')
	$p = $p.Replace('"approach.html"','"/investment-philosophy-and-process/"')
	$p = $p.Replace('"team.html"','"/people/"')
	$p = $p.Replace('"insights.html"','"/insights/"')
	$p = $p.Replace('"invest.html"','"/invest-with-us/"')
	$p = $p.Replace('"fund.html"','"/ziller-global-fund/"')
	$p = $p.Replace('"peter-beck-rocket-lab.html"','"/peter-beck-rocket-lab/"')
	$p = $p.Replace('"the-founders-advantage.html"','"/the-founders-advantage/"')
	$p = $p.Replace('"catl.html"','"/catl/"')

	# styles.css enqueued globally; prefetch dropped
	$p = $p.Replace('<link rel="stylesheet" href="styles.css" />', '')
	$p = $p.Replace('<script src="prefetch.js" defer></script>', '')

	# Body class via WP (keeps admin bar working, preserves page-xxx)
	$p = $p.Replace("<body class=""$cls"">", "<body <?php body_class('$cls'); ?>>")

	# WP hooks
	$p = $p.Replace('</head>', "<?php wp_head(); ?>`r`n</head>")
	$p = $p.Replace('</body>', "<?php wp_footer(); ?>`r`n</body>")

	# Let WP / Rank Math own title + description
	$p = $p -replace '\s*<title>.*?</title>', ''
	$p = $p -replace '\s*<meta name="description"[^>]*>', ''

	[System.IO.File]::WriteAllText((Join-Path $theme "page-$($ziller_wpslug[$slug]).php"), $p, $utf8)
}

# ── Fund page -> page-ziller-global-fund.php (serves the existing "Fund Information" page; old slug /ziller-global-fund/). Live
#    figures render SERVER-SIDE into the design's own markup via the existing
#    plugins: getPrice() (entry/exit, DB), the unitprices CSV (current NAV +
#    history), PDF_Manager (MPI). iNAV stays client-side on the ice-api REST
#    route. ──────────────────────────────────────────────────────────────
$f = [System.IO.File]::ReadAllText((Join-Path $src "fund.html"))

# Latest monthly report -> live auto-detected URL (before the assets/ rewrite runs)
$reportHref = @'
href="<?php echo $ziller_report ? esc_url( $ziller_report ) : '#'; ?>"<?php if ( ! $ziller_report ) : ?> aria-disabled="true" onclick="return false;" style="opacity:.45;pointer-events:none;"<?php endif; ?>
'@
$f = $f.Replace('href="assets/docs/Ziller-Global-Fund-Active-ETF-May-2026-Report.pdf"', $reportHref.Trim())

$f = $f.Replace('"assets/', '"' + $T + '/assets/')
$f = $f.Replace("'assets/", "'" + $T + '/assets/')
$f = $f.Replace('`assets/', '`' + $T + '/assets/')
$f = $f.Replace('https://www.zillerfm.com/wp-json/', '/wp-json/')   # iNAV REST -> same-origin
$f = $f.Replace('index.html#contact', '/contact/')
$f = $f.Replace('index.html', '/')
$f = $f.Replace('"approach.html"','"/investment-philosophy-and-process/"')
$f = $f.Replace('"team.html"','"/people/"')
$f = $f.Replace('"insights.html"','"/insights/"')
$f = $f.Replace('"invest.html"','"/invest-with-us/"')
$f = $f.Replace('"fund.html"','"/ziller-global-fund/"')
$f = $f.Replace('<link rel="stylesheet" href="styles.css" />', '')
$f = $f.Replace('<script src="prefetch.js" defer></script>', '')
$f = $f.Replace('<body class="page-fund">', "<body <?php body_class('page-fund'); ?>>")
$f = $f.Replace('</head>', "<?php wp_head(); ?>`r`n</head>")
$f = $f.Replace('</body>', "<?php wp_footer(); ?>`r`n</body>")
$f = $f -replace '\s*<title>.*?</title>', ''
$f = $f -replace '\s*<meta name="description"[^>]*>', ''

# Live-figure markup (single-quoted here-strings so PHP $vars/quotes stay literal).
# Every figure comes from the unitprices CSV, matching the plugin's ajax.php:
#   col 1 = entry/buy, col 2 = exit/sell, col 3 = date, col 4 = NAV.
$navVal = @'
<p class="fund-data-value" aria-live="polite"><?php echo ( $ziller_row && is_numeric( $ziller_row[4] ) ) ? '$' . number_format( (float) $ziller_row[4], 4 ) : 'Data feed required'; ?></p>
'@
$navAsof = @'
<p class="fund-muted-small"><?php echo $ziller_date ? 'As at ' . esc_html( $ziller_date ) : ''; ?></p>
'@
$entryVal = @'
<p class="fund-data-value" aria-live="polite"><?php echo ( $ziller_row && is_numeric( $ziller_row[1] ) ) ? '$' . number_format( (float) $ziller_row[1], 4 ) : 'Data feed required'; ?></p>
'@
$exitVal = @'
<p class="fund-data-value" aria-live="polite"><?php echo ( $ziller_row && is_numeric( $ziller_row[2] ) && (float) $ziller_row[2] > 0 ) ? '$' . number_format( (float) $ziller_row[2], 4 ) : '&mdash;'; ?></p>
'@
$upAsof = @'
<p class="fund-muted-small"><?php echo $ziller_date ? 'As at ' . esc_html( $ziller_date ) : ''; ?></p>
'@
$mpiLink = @'
<?php if ( $ziller_mpi && ! empty( $ziller_mpi['url'] ) ) : ?><a class="btn btn-outline" href="<?php echo esc_url( $ziller_mpi['url'] ); ?>" download target="_blank" rel="noopener noreferrer">Download PDF</a><?php else : ?><a class="btn btn-outline fund-disabled" href="#" aria-disabled="true" onclick="return false;">Download PDF</a><?php endif; ?>
'@
$mpiDate = @'
<p class="fund-muted-small"><?php echo ( $ziller_mpi && $ziller_mgr && ! empty( $ziller_mpi['date'] ) ) ? esc_html( $ziller_mgr->format_date( $ziller_mpi['date'] ) ) : 'Latest holdings disclosure (PDF).'; ?></p>
'@

$f = $f.Replace('<p class="fund-data-value fund-placeholder" id="nav-value" aria-live="polite">Data feed required</p>', $navVal.Trim())
$f = $f.Replace('<p class="fund-muted-small" id="nav-asof"></p>', $navAsof.Trim())
$f = $f.Replace('<p class="fund-data-value fund-placeholder" id="nav-entry" aria-live="polite">Data feed required</p>', $entryVal.Trim())
$f = $f.Replace('<p class="fund-muted-small" id="nav-entry-asof"></p>', $upAsof.Trim())
$f = $f.Replace('<p class="fund-data-value fund-placeholder" id="nav-exit" aria-live="polite">Data feed required</p>', $exitVal.Trim())
$f = $f.Replace('<p class="fund-muted-small" id="nav-exit-asof"></p>', $upAsof.Trim())
$f = $f.Replace('<a class="btn btn-outline fund-disabled" id="mpi-link" href="#" aria-disabled="true" onclick="return false;" target="_blank" rel="noopener noreferrer">Download PDF</a>', $mpiLink.Trim())
$f = $f.Replace('<p class="fund-muted-small" id="mpi-date">Latest disclosure loads automatically.</p>', $mpiDate.Trim())
# CSV download: self-contained data URI built from the CSV (immune to file-access rules)
$f = $f.Replace('/api/nav?format=csv&amp;code=A0ZFGF', '<?php echo $ziller_csv_uri; ?>')

# Replace the whole Cloudflare data-fetch IIFE (iNAV + dead /api/nav + /api/mpi
# blocks) with a clean iNAV-only version. Everything else is now server-rendered,
# so the page's only live fetch is the same-origin ice-api REST route.
$inavClean = @'
(function () {
      var valueEl = document.getElementById('inav-value');
      var asOfEl  = document.getElementById('inav-asof');
      if (!valueEl) return;

      // Live "As at" clock: ticks every second in Australia/Sydney time
      // (mirrors the old Unit Price plugin). Price refreshes every 60s below.
      function tick() {
        if (!asOfEl) return;
        var parts = {};
        new Intl.DateTimeFormat('en-AU', {
          timeZone: 'Australia/Sydney', hour12: true,
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        }).formatToParts(new Date()).forEach(function (x) { parts[x.type] = x.value; });
        asOfEl.textContent = 'As at ' + parts.hour + ':' + parts.minute + ':' + parts.second +
          ' ' + String(parts.dayPeriod || '').toUpperCase() +
          ' ' + parts.day + '/' + parts.month + '/' + parts.year;
      }

      function refresh() {
        fetch('/wp-json/ice-api/v1/pricing?code=ZILR', { cache: 'no-store' })
          .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
          .then(function (data) {
            if (!data || !data.content) return;
            var doc = new DOMParser().parseFromString(data.content, 'text/html');
            var p = doc.querySelector('.inav_price_container h3');
            var price = p ? p.textContent.trim() : '';
            if (!/\d/.test(price)) return;
            valueEl.textContent = price;
            valueEl.classList.remove('fund-placeholder');
          })
          .catch(function () {});
      }

      tick();    setInterval(tick, 1000);
      refresh(); setInterval(refresh, 60000);
    })();
'@
$f = [regex]::Replace($f, '(?s)\(function \(\) \{\s+var REFRESH_MS = 60000;.*?\r?\n    \}\)\(\);', { param($m) $inavClean.Trim() })

# Historical NAV rows from the plugin CSV (regex; scriptblock keeps replacement literal)
$histRepl = @'
<tbody>
<?php if ( ! empty( $ziller_rows ) ) : foreach ( array_slice( $ziller_rows, 0, 12 ) as $r ) : ?>
<tr><td><?php echo esc_html( $r[3] ); ?></td><td>$<?php echo esc_html( number_format( (float) $r[4], 4 ) ); ?></td></tr>
<?php endforeach; else : ?>
<tr><td colspan="2">Data feed required</td></tr>
<?php endif; ?>
</tbody>
'@
$f = [regex]::Replace($f, '(?s)<tbody id="hist-nav-body">.*?</tbody>', { param($m) $histRepl })

# Prelude: read the unitprices CSV once; derive current figures + history + a
# downloadable data URI from it (matches the plugin's ajax.php column layout).
$fundPrelude = @'
<?php
/* Ziller Fund page - live figures from the unitprices CSV (matches plugin ajax.php + [hist_apinav]). */
$ziller_mgr  = class_exists( 'PDF_Manager' ) ? new PDF_Manager() : null;      // MPI (PDF Downloader)
$ziller_mpi  = $ziller_mgr ? $ziller_mgr->get_latest_pdf() : null;
$ziller_rows = array();                                                       // unitprices CSV data rows
$ziller_csv  = WP_CONTENT_DIR . '/plugins/unitprices/A0ZFGF.csv';
if ( file_exists( $ziller_csv ) ) {
	$all = array_map( 'str_getcsv', file( $ziller_csv ) );
	if ( $all ) { array_shift( $all ); }
	foreach ( $all as $r ) {
		if ( is_array( $r ) && count( $r ) >= 5 && trim( (string) $r[3] ) !== '' ) {
			$ziller_rows[] = $r;
		}
	}
	usort( $ziller_rows, function ( $a, $b ) { return strtotime( $b[3] ) - strtotime( $a[3] ); } );
}
$ziller_row  = ! empty( $ziller_rows ) ? $ziller_rows[0] : null;              // newest row: [1]=entry, [2]=exit, [3]=date, [4]=NAV
$ziller_date = $ziller_row ? date( 'd M Y', strtotime( $ziller_row[3] ) ) : '';
$ziller_csv_data = "Date,NAV Price\r\n";
foreach ( $ziller_rows as $r ) { $ziller_csv_data .= $r[3] . ',' . $r[4] . "\r\n"; }
$ziller_csv_uri = 'data:text/csv;charset=utf-8,' . rawurlencode( $ziller_csv_data );
$ziller_report = get_transient( 'ziller_monthly_report' );                    // latest monthly report (MMYY_ZILR.pdf)
if ( false === $ziller_report ) {
	$ziller_report = '';
	$base = strtotime( date( 'Y-m-01' ) );
	for ( $i = 0; $i <= 3; $i++ ) {
		$url  = 'https://www.zillerfm.com/wp-content/uploads/' . date( 'my', strtotime( "-$i month", $base ) ) . '_ZILR.pdf';
		$head = wp_remote_head( $url, array( 'timeout' => 4, 'redirection' => 2 ) );
		if ( ! is_wp_error( $head ) && (int) wp_remote_retrieve_response_code( $head ) === 200 ) { $ziller_report = $url; break; }
	}
	set_transient( 'ziller_monthly_report', $ziller_report, $ziller_report ? 12 * HOUR_IN_SECONDS : HOUR_IN_SECONDS );
}
/* No bundled fallback PDF (keeps the theme upload small); the report button below disables itself when no live MMYY_ZILR.pdf is found. */
?>

'@
$f = $fundPrelude + $f

[System.IO.File]::WriteAllText((Join-Path $theme "page-ziller-global-fund.php"), $f, $utf8)

# ── Contact page -> page-contact.php (NEW page in the Ziller design: Pardot
#    subscribe form + distribution/media directory + Automic registry).
#    Reuses a sub-page shell (approach.html) for the head/header/footer. ──
$shell = [System.IO.File]::ReadAllText((Join-Path $src "approach.html"))
$cHead = $shell.Substring(0, $shell.IndexOf('<main'))
$cfs   = $shell.IndexOf('<footer class="site-footer">')
$cfe   = $shell.IndexOf('</footer>') + '</footer>'.Length
$cFoot = $shell.Substring($cfs, $cfe - $cfs)

$contactMain = @'
<style>
  .contact-hero { padding: clamp(110px, 15vh, 170px) 0 clamp(24px, 5vh, 44px); }
  .contact-hero .section-title { margin: .3rem 0 0; }
  .contact-hero-intro { max-width: 46ch; margin: 1.2rem 0 0; color: var(--ink-mute); font-size: 1.05rem; line-height: 1.6; }
  .contact-body { padding: 0 0 clamp(64px, 10vh, 120px); }
  .contact-grid { display: grid; grid-template-columns: 1.35fr 1fr; gap: clamp(36px, 5vw, 80px); align-items: start; }
  @media (max-width: 900px) { .contact-grid { grid-template-columns: 1fr; } }
  .contact-directory h2 { font-family: var(--serif); font-weight: 400; color: var(--ink); font-size: 1.5rem; margin: 2.75rem 0 1.4rem; padding-bottom: .6rem; border-bottom: 1px solid var(--line); }
  .contact-directory h2:first-child { margin-top: 0; }
  .contact-people { display: grid; grid-template-columns: 1fr 1fr; gap: 1.8rem 2.2rem; }
  @media (max-width: 560px) { .contact-people { grid-template-columns: 1fr; } }
  .contact-person { display: flex; gap: 1rem; align-items: flex-start; }
  .contact-photo { flex: 0 0 60px; width: 60px; height: 60px; border-radius: 50%; object-fit: cover; background: var(--bg-elev); }
  .contact-person-body { min-width: 0; }
  .contact-name { font-family: var(--serif); font-size: 1.12rem; color: var(--ink); margin: 0; }
  .contact-role { color: var(--ink-mute); font-size: .82rem; margin: .15rem 0 .45rem; }
  .contact-phone { margin: 0 0 .55rem; }
  .contact-phone a { font-size: .85rem; color: var(--accent-deep); }
  .contact-phone a:hover { color: var(--ink); }
  .contact-icons { display: flex; align-items: center; gap: .5rem; }
  .contact-icon { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: 1px solid var(--line); border-radius: 50%; color: var(--accent-deep); transition: color .18s ease, border-color .18s ease; }
  .contact-icon:hover { color: var(--ink); border-color: var(--ink); }
  .contact-registry p { margin: .3rem 0; color: var(--ink-soft); font-size: .92rem; }
  .contact-registry a { color: var(--accent-deep); }
  .contact-subscribe { position: sticky; top: 116px; background: var(--bg-elev); border: 1px solid var(--line); border-radius: 4px; padding: clamp(22px, 3vw, 32px); }
  .contact-subscribe h2 { font-family: var(--serif); font-weight: 400; font-size: 1.5rem; color: var(--ink); margin: 0; }
  .contact-subscribe > p { color: var(--ink-mute); font-size: .9rem; margin: .4rem 0 1rem; }
  .contact-subscribe iframe { width: 100%; min-height: 560px; border: 0; display: block; }
  @media (max-width: 900px) { .contact-subscribe { position: static; } }
</style>
<main class="contact-page">
  <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
    <symbol id="ico-mail" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/></symbol>
    <symbol id="ico-li" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56z"/></symbol>
  </svg>
  <section class="contact-hero">
    <div class="container">
      <p class="section-eyebrow">Contact</p>
      <h1 class="section-title">Speak with the team.</h1>
      <p class="contact-hero-intro">For wholesale, institutional and adviser enquiries &mdash; or to receive our monthly insights from the desk.</p>
    </div>
  </section>
  <section class="contact-body">
    <div class="container contact-grid">
      <div class="contact-directory">
        <h2>Distribution Team</h2>
        <div class="contact-people">
          <div class="contact-person">
            <img class="contact-photo" src="assets/team/Cesar-Farfan-400x400px-300x300.png" alt="Cesar Farfan" width="60" height="60" loading="lazy" />
            <div class="contact-person-body">
              <p class="contact-name">Cesar Farfan</p>
              <p class="contact-role">Head of Distribution</p>
              <p class="contact-phone"><a href="tel:+61405964960">+61 405 964 960</a></p>
              <div class="contact-icons">
                <a class="contact-icon" href="mailto:CFarfan@perennial.net.au" aria-label="Email Cesar Farfan" title="Email Cesar Farfan"><svg width="16" height="16" aria-hidden="true"><use href="#ico-mail"></use></svg></a>
                <a class="contact-icon" href="https://www.linkedin.com/in/cesar-farfan-6ab44044/" target="_blank" rel="noopener" aria-label="Cesar Farfan on LinkedIn" title="Cesar Farfan on LinkedIn"><svg width="16" height="16" aria-hidden="true"><use href="#ico-li"></use></svg></a>
              </div>
            </div>
          </div>
          <div class="contact-person">
            <img class="contact-photo" src="assets/team/Abdul-Elhage-400x400px-300x300.png" alt="Abdul Elhage" width="60" height="60" loading="lazy" />
            <div class="contact-person-body">
              <p class="contact-name">Abdul Elhage</p>
              <p class="contact-role">Director, Institutional Sales</p>
              <p class="contact-phone"><a href="tel:+61430604274">+61 430 604 274</a></p>
              <div class="contact-icons">
                <a class="contact-icon" href="mailto:aelhage@perennial.net.au" aria-label="Email Abdul Elhage" title="Email Abdul Elhage"><svg width="16" height="16" aria-hidden="true"><use href="#ico-mail"></use></svg></a>
                <a class="contact-icon" href="https://www.linkedin.com/in/abdulelhage/" target="_blank" rel="noopener" aria-label="Abdul Elhage on LinkedIn" title="Abdul Elhage on LinkedIn"><svg width="16" height="16" aria-hidden="true"><use href="#ico-li"></use></svg></a>
              </div>
            </div>
          </div>
          <div class="contact-person">
            <img class="contact-photo" src="assets/team/Marjon-Crandall-400x400px-300x300.png" alt="Marjon Crandall" width="60" height="60" loading="lazy" />
            <div class="contact-person-body">
              <p class="contact-name">Marjon Crandall</p>
              <p class="contact-role">Head of Researcher &amp; Consultant Relationships</p>
              <p class="contact-phone"><a href="tel:+61426947407">+61 426 947 407</a></p>
              <div class="contact-icons">
                <a class="contact-icon" href="mailto:mCrandall@perennial.net.au" aria-label="Email Marjon Crandall" title="Email Marjon Crandall"><svg width="16" height="16" aria-hidden="true"><use href="#ico-mail"></use></svg></a>
                <a class="contact-icon" href="https://www.linkedin.com/in/marjoncrandall/" target="_blank" rel="noopener" aria-label="Marjon Crandall on LinkedIn" title="Marjon Crandall on LinkedIn"><svg width="16" height="16" aria-hidden="true"><use href="#ico-li"></use></svg></a>
              </div>
            </div>
          </div>
          <div class="contact-person">
            <img class="contact-photo" src="assets/team/Scott-Curtis-400x400px.png" alt="Scott Curtis" width="60" height="60" loading="lazy" />
            <div class="contact-person-body">
              <p class="contact-name">Scott Curtis</p>
              <p class="contact-role">Director, Private Wealth &amp; Family Office</p>
              <p class="contact-phone"><a href="tel:+61422993458">+61 422 993 458</a></p>
              <div class="contact-icons">
                <a class="contact-icon" href="mailto:scurtis@perennial.net.au" aria-label="Email Scott Curtis" title="Email Scott Curtis"><svg width="16" height="16" aria-hidden="true"><use href="#ico-mail"></use></svg></a>
                <a class="contact-icon" href="https://www.linkedin.com/in/sacurtis/" target="_blank" rel="noopener" aria-label="Scott Curtis on LinkedIn" title="Scott Curtis on LinkedIn"><svg width="16" height="16" aria-hidden="true"><use href="#ico-li"></use></svg></a>
              </div>
            </div>
          </div>
          <div class="contact-person">
            <img class="contact-photo" src="assets/team/Karl-Linder-200x200px.png" alt="Karl Linder" width="60" height="60" loading="lazy" />
            <div class="contact-person-body">
              <p class="contact-name">Karl Linder</p>
              <p class="contact-role">Regional Manager, Southern States</p>
              <p class="contact-phone"><a href="tel:+61418311605">+61 418 311 605</a></p>
              <div class="contact-icons">
                <a class="contact-icon" href="mailto:KLinder@perennial.net.au" aria-label="Email Karl Linder" title="Email Karl Linder"><svg width="16" height="16" aria-hidden="true"><use href="#ico-mail"></use></svg></a>
                <a class="contact-icon" href="https://www.linkedin.com/in/karl-linder-693a8629/" target="_blank" rel="noopener" aria-label="Karl Linder on LinkedIn" title="Karl Linder on LinkedIn"><svg width="16" height="16" aria-hidden="true"><use href="#ico-li"></use></svg></a>
              </div>
            </div>
          </div>
          <div class="contact-person">
            <img class="contact-photo" src="assets/team/David-Whitby-400x400px.png" alt="David Whitby" width="60" height="60" loading="lazy" />
            <div class="contact-person-body">
              <p class="contact-name">David Whitby</p>
              <p class="contact-role">Senior Investment Specialist</p>
              <p class="contact-phone"><a href="tel:+61438790233">+61 438 790 233</a></p>
              <div class="contact-icons">
                <a class="contact-icon" href="mailto:DWhitby@perennial.net.au" aria-label="Email David Whitby" title="Email David Whitby"><svg width="16" height="16" aria-hidden="true"><use href="#ico-mail"></use></svg></a>
                <a class="contact-icon" href="https://www.linkedin.com/in/david-whitby-309452b/" target="_blank" rel="noopener" aria-label="David Whitby on LinkedIn" title="David Whitby on LinkedIn"><svg width="16" height="16" aria-hidden="true"><use href="#ico-li"></use></svg></a>
              </div>
            </div>
          </div>
          <div class="contact-person">
            <img class="contact-photo" src="assets/team/Sam-Harris-400x400px-zoomed.png" alt="Sam Harris" width="60" height="60" loading="lazy" />
            <div class="contact-person-body">
              <p class="contact-name">Sam Harris</p>
              <p class="contact-role">Investment Specialist (NSW)</p>
              <p class="contact-phone"><a href="tel:+61487449927">+61 487 449 927</a></p>
              <div class="contact-icons">
                <a class="contact-icon" href="mailto:sharris@perennial.net.au" aria-label="Email Sam Harris" title="Email Sam Harris"><svg width="16" height="16" aria-hidden="true"><use href="#ico-mail"></use></svg></a>
                <a class="contact-icon" href="https://www.linkedin.com/in/sam-harris-387869165/" target="_blank" rel="noopener" aria-label="Sam Harris on LinkedIn" title="Sam Harris on LinkedIn"><svg width="16" height="16" aria-hidden="true"><use href="#ico-li"></use></svg></a>
              </div>
            </div>
          </div>
          <div class="contact-person">
            <img class="contact-photo" src="assets/team/Vlad-Laevsky-400x400px.png" alt="Vlad Laevsky" width="60" height="60" loading="lazy" />
            <div class="contact-person-body">
              <p class="contact-name">Vlad Laevsky</p>
              <p class="contact-role">Investment Specialist (QLD)</p>
              <p class="contact-phone"><a href="tel:+61423400304">+61 423 400 304</a></p>
              <div class="contact-icons">
                <a class="contact-icon" href="mailto:vlaevsky@perennial.net.au" aria-label="Email Vlad Laevsky" title="Email Vlad Laevsky"><svg width="16" height="16" aria-hidden="true"><use href="#ico-mail"></use></svg></a>
                <a class="contact-icon" href="https://www.linkedin.com/in/vladlaevsky/" target="_blank" rel="noopener" aria-label="Vlad Laevsky on LinkedIn" title="Vlad Laevsky on LinkedIn"><svg width="16" height="16" aria-hidden="true"><use href="#ico-li"></use></svg></a>
              </div>
            </div>
          </div>
        </div>

        <h2>Media &amp; Marketing</h2>
        <div class="contact-people">
          <div class="contact-person">
            <img class="contact-photo" src="assets/team/Pyke-Gunning-e1657863878974.png" alt="Pyke Gunning" width="60" height="60" loading="lazy" />
            <div class="contact-person-body">
              <p class="contact-name">Pyke Gunning</p>
              <p class="contact-role">Marketing Manager</p>
              <p class="contact-phone"><a href="tel:+61282742743">+61 2 8274 2743</a></p>
              <div class="contact-icons">
                <a class="contact-icon" href="mailto:pGunning@perennial.net.au" aria-label="Email Pyke Gunning" title="Email Pyke Gunning"><svg width="16" height="16" aria-hidden="true"><use href="#ico-mail"></use></svg></a>
                <a class="contact-icon" href="https://www.linkedin.com/in/pykegunning/" target="_blank" rel="noopener" aria-label="Pyke Gunning on LinkedIn" title="Pyke Gunning on LinkedIn"><svg width="16" height="16" aria-hidden="true"><use href="#ico-li"></use></svg></a>
              </div>
            </div>
          </div>
          <div class="contact-person">
            <img class="contact-photo" src="assets/team/Chloe-Jakins-400x400px.png" alt="Chloe Jakins" width="60" height="60" loading="lazy" />
            <div class="contact-person-body">
              <p class="contact-name">Chloe Jakins</p>
              <p class="contact-role">Events Manager</p>
              <p class="contact-phone"><a href="tel:+61282742742">+61 2 8274 2742</a></p>
              <div class="contact-icons">
                <a class="contact-icon" href="mailto:CJakins@perennial.net.au" aria-label="Email Chloe Jakins" title="Email Chloe Jakins"><svg width="16" height="16" aria-hidden="true"><use href="#ico-mail"></use></svg></a>
                <a class="contact-icon" href="https://www.linkedin.com/in/chloe-jakins-ab423825a/" target="_blank" rel="noopener" aria-label="Chloe Jakins on LinkedIn" title="Chloe Jakins on LinkedIn"><svg width="16" height="16" aria-hidden="true"><use href="#ico-li"></use></svg></a>
              </div>
            </div>
          </div>
        </div>

        <h2>Client Services &amp; Unit Registry</h2>
        <div class="contact-registry">
          <p><strong>Automic Group</strong></p>
          <p><a href="tel:1300288664">1300 288 664</a> &middot; international <a href="tel:+61296985414">+61 2 9698 5414</a> (outside Australia)</p>
          <p><a href="mailto:ziller@automic.com.au">ziller@automic.com.au</a></p>
          <p>Ziller Unit Registry Services, GPO Box 5193, Sydney NSW 2001</p>
        </div>
      </div>

      <aside class="contact-subscribe">
        <h2>Subscribe</h2>
        <p>Monthly insights from the desk, straight to your inbox.</p>
        <iframe src="https://pages.zillerfm.com/l/210472/2025-10-05/dkcxvf" width="100%" height="600" type="text/html" frameborder="0" allowtransparency="true" title="Subscribe to Ziller insights"></iframe>
      </aside>
    </div>
  </section>
</main>
'@

$contactScript = @'
<script>
  (function () {
    var y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
    var t = document.querySelector('.menu-toggle');
    if (!t) return;
    t.addEventListener('click', function () {
      var open = t.getAttribute('aria-expanded') === 'true';
      t.setAttribute('aria-expanded', String(!open));
      document.body.classList.toggle('nav-open', !open);
    });
    document.querySelectorAll('.primary-nav a').forEach(function (a) {
      a.addEventListener('click', function () { document.body.classList.remove('nav-open'); t.setAttribute('aria-expanded', 'false'); });
    });
  })();
</script>
'@

$c = $cHead + "`r`n" + $contactMain + "`r`n" + $cFoot + "`r`n" + $contactScript + "`r`n</body>`r`n</html>`r`n"

$c = $c.Replace('"assets/', '"' + $T + '/assets/')
$c = $c.Replace("'assets/", "'" + $T + '/assets/')
$c = $c.Replace('index.html#contact', '/contact/')
$c = $c.Replace('index.html', '/')
$c = $c.Replace('"approach.html"','"/investment-philosophy-and-process/"')
$c = $c.Replace('"team.html"','"/people/"')
$c = $c.Replace('"insights.html"','"/insights/"')
$c = $c.Replace('"invest.html"','"/invest-with-us/"')
$c = $c.Replace('"fund.html"','"/ziller-global-fund/"')
$c = $c.Replace(' aria-current="page"','')
$c = $c.Replace('<link rel="stylesheet" href="styles.css" />', '')
$c = $c.Replace('<body class="page-approach">', "<body <?php body_class('page-contact'); ?>>")
$c = $c.Replace('</head>', "<?php wp_head(); ?>`r`n</head>")
$c = $c.Replace('</body>', "<?php wp_footer(); ?>`r`n</body>")
$c = $c -replace '\s*<title>.*?</title>', ''
$c = $c -replace '\s*<meta name="description"[^>]*>', ''

[System.IO.File]::WriteAllText((Join-Path $theme "page-contact.php"), $c, $utf8)

# ── Disclaimer -> page-disclaimer.php: static compliance page (iNAV disclaimer +
#    general disclaimer, verbatim from the live /disclaimer/ WP page). Rendered in
#    the Ziller editorial layout. WP auto-uses page-disclaimer.php for the existing
#    Page whose slug is "disclaimer" — its old WPBakery content is ignored, exactly
#    like the other static page templates. Reuses the approach.html shell (head/
#    header/footer via $cHead/$cFoot and the shared $contactScript). ──
$dMain = @'
<style>
  .legal-hero { padding: clamp(120px, 16vh, 180px) 0 clamp(6px, 1.5vh, 16px); }
  .legal-hero .section-title { margin: .3rem 0 0; }
  .legal-hero-intro { max-width: 60ch; margin: 1.1rem 0 0; color: var(--ink-mute); font-size: 1.02rem; line-height: 1.6; }
  .legal-body { padding: clamp(28px, 5vh, 52px) 0 clamp(64px, 10vh, 120px); }
  .legal-prose { max-width: 76ch; }
  .legal-prose h2 { font-family: var(--serif); font-weight: 400; color: var(--ink); font-size: clamp(1.35rem, 2.4vw, 1.6rem); margin: 2.75rem 0 1.1rem; padding-bottom: .55rem; border-bottom: 1px solid var(--line); }
  .legal-prose h2:first-child { margin-top: 0; }
  .legal-prose p { color: var(--ink-soft); font-size: .95rem; line-height: 1.8; margin: 0 0 1.15rem; }
  .legal-prose p:last-child { margin-bottom: 0; }
  .legal-prose a { color: var(--accent-deep); }
  .legal-prose a:hover { color: var(--ink); }
  .legal-prose strong { color: var(--ink); font-weight: 600; }
</style>
<main class="legal-page">
  <section class="legal-hero">
    <div class="container">
      <p class="section-eyebrow">Legal</p>
      <h1 class="section-title">Disclaimer</h1>
      <p class="legal-hero-intro">Important information about the indicative NAV (iNAV) shown on this website and the general nature of the information provided here.</p>
    </div>
  </section>
  <section class="legal-body">
    <div class="container legal-prose">
      <h2>iNAV disclaimer</h2>
      <p>The iNAV is calculated on a minute-by-minute basis by a third-party vendor (ICE) and is based on the market prices of the individual holdings included in the relevant index being tracked. The iNAV per unit does not constitute a bid-offer price. It is an indicative estimate only based on delayed indicative market prices obtained from the relevant exchange or market on which the relevant Fund's assets are traded and are subject to change. The actual bid-offer prices for units in the fund are determined by market forces current at the time of any trade via the exchanges.</p>
      <p>Any iNAV should not be relied upon as being the price at which units may be bought or sold on the ASX or Cboe, and may not reflect the true value of a unit. No assurance can be given that any iNAV will be published continuously, will be up to date or free from error.</p>
      <p>The ICE information is provided to the users "as is." Neither ICE nor Ziller Funds Management (Ziller) nor any of their affiliates make any express or implied warranties of any kind regarding the iNAV data, including, without limitation, any warranty of merchantability or fitness for a particular purpose or use. Neither ICE nor Daintree nor any of their affiliates guarantee the adequacy, accuracy, timeliness or completeness of the ICE iNAV data and to the extent permitted by law accept no liability to any person for any interruption, inaccuracy, error or omission, regardless of cause, in the iNAV data or for any damages (whether direct or indirect, consequential, punitive or exemplary) resulting from any use or reliance on the data. Prior to the execution of a security trade, you are advised to consult with your broker or other financial representative to verify pricing information.</p>
      <p>iNAV calculations as shown on <a href="/">www.zillerfm.com</a> (the "data") provided by <a href="https://www.theice.com/market-data/indices" target="_blank" rel="noopener">ICE Data Indices</a>, see <a href="https://www.intercontinentalexchange.com/terms-of-use" target="_blank" rel="noopener">ICE Terms of Use</a>, and is updated during exchange trading hours. Powered by <a href="https://www.factset.com/" target="_blank" rel="noopener">Factset</a>. iNAV is indicative and for reference purposes only. The Fund is not sponsored, endorsed, sold or marketed by ICE Data Indices, LLC, its affiliates ("ICE Data") and ICE Data or its respective third party suppliers MAKE NO EXPRESS OR IMPLIED WARRANTIES, AND HEREBY EXPRESSLY DISCLAIM ALL WARRANTIES OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE WITH RESPECT TO THE iNAV, IOPV, FUND OR ANY FUND DATA INCLUDED THEREIN. IN NO EVENT SHALL ICE DATA HAVE ANY LIABILITY FOR ANY SPECIAL, PUNITIVE, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES (INCLUDING LOST PROFITS), EVEN IF NOTIFIED OF THE POSSIBILITY OF SUCH DAMAGES. You acknowledge that the data is provided for information only and should not be relied upon for any purpose.</p>
      <h2>Disclaimer</h2>
      <p>This website has been prepared and issued by Perennial Investment Management Limited (ABN 13 108 747 637, AFSL No. 275101) (<strong>PIML</strong>) as Responsible Entity and Ziller Funds Management Pty Limited (ABN 88 688 720 578) (<strong>Ziller</strong>) as the Investment Manager, a Corporate Authorised Representative (CAR 1317129) of Perennial Value Management Limited (ABN 22 090 879 904, AFSL No. 247293) (<strong>PVM</strong>). Ziller, PIML and PVM are part of Perennial Partners Limited (ABN 90 612 829 160, CAR 1293138 of PVM) (<strong>Perennial Partners</strong>).</p>
      <p>This website is general advice and does not take account of your objectives, financial situation or needs. Before acting on this general advice you should consider the appropriateness of the advice having regard to your objectives, financial situation and needs. You should obtain and consider the Product Disclosure Statement and Target Market Determination relating to any product described in this website before deciding whether to acquire, continue to hold or dispose of that product.</p>
      <p>This website is based on information obtained from sources believed to be reliable and accurate at time of publication but we do not make any representation or warranty that it is accurate, complete or up to date. We accept no ongoing obligation to correct or update the information or opinions in it. Opinions expressed are subject to change without notice. There are risks involved in investing. The value of investments can and does fluctuate and an individual investment may even become valueless. Past performance is not a reliable indicator of future performance. Any forecasts included in this website are predictive in character and therefore you should not place undue reliance on the forecast information. The forecasts may be affected by incorrect assumptions or by known or unknown risks and uncertainties. The actual results may differ substantially from the forecasts and some facts and opinions may change without notice. Nothing in this website shall be construed as a solicitation to buy or sell any security or product, or to engage in or refrain from engaging in any transaction. To the extent permitted by law, neither Ziller nor any of its related entities accepts any responsibility for errors, omissions or misstatements of any nature, irrespective of how these may arise, nor will it be liable for any loss or damage suffered as a result of any reliance on the information included in this website.</p>
    </div>
  </section>
</main>
'@

$d = $cHead + "`r`n" + $dMain + "`r`n" + $cFoot + "`r`n" + $contactScript + "`r`n</body>`r`n</html>`r`n"
$d = $d.Replace('"assets/', '"' + $T + '/assets/')
$d = $d.Replace("'assets/", "'" + $T + '/assets/')
$d = $d.Replace('index.html#contact', '/contact/')
$d = $d.Replace('index.html', '/')
$d = $d.Replace('"approach.html"','"/investment-philosophy-and-process/"')
$d = $d.Replace('"team.html"','"/people/"')
$d = $d.Replace('"insights.html"','"/insights/"')
$d = $d.Replace('"invest.html"','"/invest-with-us/"')
$d = $d.Replace('"fund.html"','"/ziller-global-fund/"')
$d = $d.Replace(' aria-current="page"','')
$d = $d.Replace('<link rel="stylesheet" href="styles.css" />', '')
$d = $d.Replace('<body class="page-approach">', "<body <?php body_class('page-disclaimer'); ?>>")
$d = $d.Replace('</head>', "<?php wp_head(); ?>`r`n</head>")
$d = $d.Replace('</body>', "<?php wp_footer(); ?>`r`n</body>")
$d = $d -replace '\s*<title>.*?</title>', ''
$d = $d -replace '\s*<meta name="description"[^>]*>', ''

[System.IO.File]::WriteAllText((Join-Path $theme "page-disclaimer.php"), $d, $utf8)

# ── Careers -> page-careers.php: static recruiting page rebuilt in the Ziller
#    editorial layout from the live /careers/ content (Investment Analyst +
#    Investment Intern; two-minute founder-led-stock video pitch, sent via
#    filemail.com to careers@zillerfm.com, reviewed by the CIO). WP auto-uses this
#    for the existing "careers" slug. Not linked in the main nav/footer — matches
#    the live site, where /careers/ is a direct-URL page. ──
$caMain = @'
<style>
  .careers-hero { padding: clamp(120px, 16vh, 180px) 0 clamp(8px, 2vh, 20px); }
  .careers-hero .section-title { margin: .3rem 0 0; }
  .careers-hero-intro { max-width: 52ch; margin: 1.1rem 0 0; color: var(--ink-mute); font-size: 1.05rem; line-height: 1.6; }
  .careers-body { padding: clamp(28px, 5vh, 52px) 0 clamp(64px, 10vh, 120px); }
  .careers-grid { display: grid; grid-template-columns: 1.45fr 1fr; gap: clamp(36px, 5vw, 76px); align-items: start; }
  @media (max-width: 900px) { .careers-grid { grid-template-columns: 1fr; } }
  .careers-roles h2, .careers-apply h2 { font-family: var(--serif); font-weight: 400; color: var(--ink); font-size: 1.5rem; margin: 0 0 1.4rem; }
  .role { padding: 1.5rem 0; border-top: 1px solid var(--line); }
  .role:first-of-type { border-top: 0; padding-top: 0; }
  .role h3 { font-family: var(--serif); font-weight: 400; color: var(--ink); font-size: 1.25rem; margin: 0 0 .5rem; }
  .role p { color: var(--ink-soft); font-size: .95rem; line-height: 1.7; margin: 0; }
  .careers-apply { position: sticky; top: 116px; background: var(--bg-elev); border: 1px solid var(--line); border-radius: 4px; padding: clamp(22px, 3vw, 32px); }
  .careers-apply > p { color: var(--ink-mute); font-size: .92rem; line-height: 1.6; margin: 0 0 1rem; }
  .careers-apply ol { margin: 0 0 1rem; padding-left: 1.15rem; color: var(--ink-soft); font-size: .92rem; line-height: 1.7; }
  .careers-apply ol li { margin: 0 0 .5rem; }
  .careers-apply a { color: var(--accent-deep); }
  .careers-apply a:hover { color: var(--ink); }
  .careers-note { color: var(--ink-mute); font-size: .82rem; line-height: 1.6; margin: 0; }
  @media (max-width: 900px) { .careers-apply { position: static; } }
</style>
<main class="careers-page">
  <section class="careers-hero">
    <div class="container">
      <p class="section-eyebrow">Careers</p>
      <h1 class="section-title">Join the team.</h1>
      <p class="careers-hero-intro">We hire the way we invest &mdash; for original thinking and conviction, not credentials. Show us how you think about a business.</p>
    </div>
  </section>
  <section class="careers-body">
    <div class="container careers-grid">
      <div class="careers-roles">
        <h2>Open roles</h2>
        <div class="role">
          <h3>Investment Analyst</h3>
          <p>For candidates with 0&ndash;3 years of commercial experience and a natural aptitude for investing.</p>
        </div>
        <div class="role">
          <h3>Investment Intern</h3>
          <p>For candidates with a natural aptitude for investing.</p>
        </div>
      </div>
      <aside class="careers-apply">
        <h2>How to apply</h2>
        <p>We don't want a r&eacute;sum&eacute; first &mdash; we want to see how you think about a company.</p>
        <ol>
          <li>Record a <strong>two-minute video</strong> pitching a founder-led stock.</li>
          <li>Send it via <a href="https://www.filemail.com/" target="_blank" rel="noopener">filemail.com</a> to <a href="mailto:careers@zillerfm.com">careers@zillerfm.com</a>.</li>
        </ol>
        <p class="careers-note">Your pitch is reviewed by the Chief Investment Officer. Production quality will not be assessed &mdash; only your thinking. Due to the volume of applications, only successful submissions will receive a response.</p>
      </aside>
    </div>
  </section>
</main>
'@

$ca = $cHead + "`r`n" + $caMain + "`r`n" + $cFoot + "`r`n" + $contactScript + "`r`n</body>`r`n</html>`r`n"
$ca = $ca.Replace('"assets/', '"' + $T + '/assets/')
$ca = $ca.Replace("'assets/", "'" + $T + '/assets/')
$ca = $ca.Replace('index.html#contact', '/contact/')
$ca = $ca.Replace('index.html', '/')
$ca = $ca.Replace('"approach.html"','"/investment-philosophy-and-process/"')
$ca = $ca.Replace('"team.html"','"/people/"')
$ca = $ca.Replace('"insights.html"','"/insights/"')
$ca = $ca.Replace('"invest.html"','"/invest-with-us/"')
$ca = $ca.Replace('"fund.html"','"/ziller-global-fund/"')
$ca = $ca.Replace(' aria-current="page"','')
$ca = $ca.Replace('<link rel="stylesheet" href="styles.css" />', '')
$ca = $ca.Replace('<body class="page-approach">', "<body <?php body_class('page-careers'); ?>>")
$ca = $ca.Replace('</head>', "<?php wp_head(); ?>`r`n</head>")
$ca = $ca.Replace('</body>', "<?php wp_footer(); ?>`r`n</body>")
$ca = $ca -replace '\s*<title>.*?</title>', ''
$ca = $ca -replace '\s*<meta name="description"[^>]*>', ''

[System.IO.File]::WriteAllText((Join-Path $theme "page-careers.php"), $ca, $utf8)

# ── Subscribe -> page-subscribe.php: the Pardot signup form (same embed the Contact
#    page uses), on the existing /subscribe/ page. ──
$subMain = @'
<style>
  .sub-hero { padding: clamp(120px, 16vh, 180px) 0 clamp(8px, 2vh, 20px); }
  .sub-hero .section-title { margin: .3rem 0 0; }
  .sub-body { padding: clamp(28px, 5vh, 52px) 0 clamp(64px, 10vh, 120px); }
  .sub-card { max-width: 560px; background: var(--bg-elev); border: 1px solid var(--line); border-radius: 4px; padding: clamp(22px, 3vw, 36px); }
  .sub-card > p { color: var(--ink-mute); font-size: 1rem; line-height: 1.6; margin: 0 0 1.2rem; }
  .sub-card iframe { width: 100%; min-height: 560px; border: 0; display: block; }
</style>
<main class="subscribe-page">
  <section class="sub-hero">
    <div class="container">
      <p class="section-eyebrow">Subscribe</p>
      <h1 class="section-title">The latest from the desk.</h1>
    </div>
  </section>
  <section class="sub-body">
    <div class="container">
      <div class="sub-card">
        <p>Subscribe to get Ziller Funds Management&rsquo;s latest investment news and insights straight to your inbox.</p>
        <iframe src="https://pages.zillerfm.com/l/210472/2025-10-05/dkcxvf" width="100%" height="600" type="text/html" frameborder="0" allowtransparency="true" title="Subscribe to Ziller insights"></iframe>
      </div>
    </div>
  </section>
</main>
'@

$sub = $cHead + "`r`n" + $subMain + "`r`n" + $cFoot + "`r`n" + $contactScript + "`r`n</body>`r`n</html>`r`n"
$sub = $sub.Replace('"assets/', '"' + $T + '/assets/')
$sub = $sub.Replace("'assets/", "'" + $T + '/assets/')
$sub = $sub.Replace('index.html#contact', '/contact/')
$sub = $sub.Replace('index.html', '/')
$sub = $sub.Replace('"approach.html"','"/investment-philosophy-and-process/"')
$sub = $sub.Replace('"team.html"','"/people/"')
$sub = $sub.Replace('"insights.html"','"/insights/"')
$sub = $sub.Replace('"invest.html"','"/invest-with-us/"')
$sub = $sub.Replace('"fund.html"','"/ziller-global-fund/"')
$sub = $sub.Replace(' aria-current="page"','')
$sub = $sub.Replace('<link rel="stylesheet" href="styles.css" />', '')
$sub = $sub.Replace('<body class="page-approach">', "<body <?php body_class('page-subscribe'); ?>>")
$sub = $sub.Replace('</head>', "<?php wp_head(); ?>`r`n</head>")
$sub = $sub.Replace('</body>', "<?php wp_footer(); ?>`r`n</body>")
$sub = $sub -replace '\s*<title>.*?</title>', ''
$sub = $sub -replace '\s*<meta name="description"[^>]*>', ''
[System.IO.File]::WriteAllText((Join-Path $theme "page-subscribe.php"), $sub, $utf8)

# ── Quarterly Performance Update -> page-quarterly-performance-update.php: intro +
#    Vimeo embed (Customizer field, editable each quarter) + short disclaimer that
#    links to the full /disclaimer/ page. ──
$quMain = @'
<style>
  .qu-hero { padding: clamp(120px, 16vh, 180px) 0 clamp(8px, 2vh, 20px); }
  .qu-hero .section-title { margin: .3rem 0 0; }
  .qu-hero-intro { max-width: 60ch; margin: 1.1rem 0 0; color: var(--ink-mute); font-size: 1.05rem; line-height: 1.6; }
  .qu-body { padding: clamp(28px, 5vh, 52px) 0 clamp(64px, 10vh, 120px); }
  .qu-video { position: relative; width: 100%; max-width: 900px; aspect-ratio: 16 / 9; background: var(--bg-elev); border: 1px solid var(--line); border-radius: 4px; overflow: hidden; }
  .qu-video iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
  .qu-video-empty { display: flex; align-items: center; justify-content: center; height: 100%; padding: 2rem; text-align: center; color: var(--ink-mute); font-size: .95rem; }
  .qu-disclaimer { max-width: 76ch; margin: clamp(28px, 4vh, 48px) 0 0; }
  .qu-disclaimer p { color: var(--ink-soft); font-size: .88rem; line-height: 1.7; margin: 0; }
  .qu-disclaimer a { color: var(--accent-deep); }
  .qu-disclaimer a:hover { color: var(--ink); }
</style>
<main class="quarterly-page">
  <section class="qu-hero">
    <div class="container">
      <p class="section-eyebrow">Quarterly Update</p>
      <h1 class="section-title">Quarterly Performance Update</h1>
      <p class="qu-hero-intro">Chief Investment Officer, Joseph Ziller, provides a portfolio update for the Ziller Global Fund Active ETF.</p>
    </div>
  </section>
  <section class="qu-body">
    <div class="container">
      <?php
      $qu_vid = trim( (string) get_theme_mod( 'ziller_quarterly_vimeo', '' ) );
      if ( $qu_vid !== '' && preg_match( '/(\d{6,})/', $qu_vid, $qm ) ) : ?>
      <div class="qu-video"><iframe src="https://player.vimeo.com/video/<?php echo esc_attr( $qm[1] ); ?>" title="Ziller Global Fund Active ETF quarterly update" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>
      <?php else : ?>
      <div class="qu-video"><div class="qu-video-empty">The latest update video will appear here once set in Appearance &rarr; Customize &rarr; &ldquo;Ziller - Quarterly Update&rdquo;.</div></div>
      <?php endif; ?>
      <div class="qu-disclaimer">
        <p><strong>Important information.</strong> This communication is general advice only and does not take account of your objectives, financial situation or needs. Past performance is not a reliable indicator of future performance. Before investing you should consider the Product Disclosure Statement and Target Market Determination (available at <a href="/">www.zillerfm.com</a>) and our full <a href="/disclaimer/">Disclaimer</a>.</p>
      </div>
    </div>
  </section>
</main>
'@

$qu = $cHead + "`r`n" + $quMain + "`r`n" + $cFoot + "`r`n" + $contactScript + "`r`n</body>`r`n</html>`r`n"
$qu = $qu.Replace('"assets/', '"' + $T + '/assets/')
$qu = $qu.Replace("'assets/", "'" + $T + '/assets/')
$qu = $qu.Replace('index.html#contact', '/contact/')
$qu = $qu.Replace('index.html', '/')
$qu = $qu.Replace('"approach.html"','"/investment-philosophy-and-process/"')
$qu = $qu.Replace('"team.html"','"/people/"')
$qu = $qu.Replace('"insights.html"','"/insights/"')
$qu = $qu.Replace('"invest.html"','"/invest-with-us/"')
$qu = $qu.Replace('"fund.html"','"/ziller-global-fund/"')
$qu = $qu.Replace(' aria-current="page"','')
$qu = $qu.Replace('<link rel="stylesheet" href="styles.css" />', '')
$qu = $qu.Replace('<body class="page-approach">', "<body <?php body_class('page-quarterly'); ?>>")
$qu = $qu.Replace('</head>', "<?php wp_head(); ?>`r`n</head>")
$qu = $qu.Replace('</body>', "<?php wp_footer(); ?>`r`n</body>")
$qu = $qu -replace '\s*<title>.*?</title>', ''
$qu = $qu -replace '\s*<meta name="description"[^>]*>', ''
[System.IO.File]::WriteAllText((Join-Path $theme "page-quarterly-performance-update.php"), $qu, $utf8)

# ── Insights -> page-insights.php: DYNAMIC listing that queries WP Posts and
#    renders them in the existing card design. Filter tabs come from the post
#    categories. All the page's own scripts (curtain, reveal, filter, photo
#    fade-in) are kept and work on the generated cards. ──
$i = [System.IO.File]::ReadAllText((Join-Path $src "insights.html"))
$i = $i.Replace('"assets/', '"' + $T + '/assets/')
$i = $i.Replace("'assets/", "'" + $T + '/assets/')
$i = $i.Replace('`assets/', '`' + $T + '/assets/')
$i = $i.Replace('index.html#contact', '/contact/')
$i = $i.Replace('index.html', '/')
$i = $i.Replace('"approach.html"','"/investment-philosophy-and-process/"')
$i = $i.Replace('"team.html"','"/people/"')
$i = $i.Replace('"insights.html"','"/insights/"')
$i = $i.Replace('"invest.html"','"/invest-with-us/"')
$i = $i.Replace('"fund.html"','"/ziller-global-fund/"')
$i = $i.Replace('<link rel="stylesheet" href="styles.css" />', '')
$i = $i.Replace('<script src="prefetch.js" defer></script>', '')
$i = $i.Replace('<body class="page-insights">', "<body <?php body_class('page-insights'); ?>>")
$i = $i.Replace('</head>', "<?php wp_head(); ?>`r`n</head>")
$i = $i.Replace('</body>', "<?php wp_footer(); ?>`r`n</body>")
$i = $i -replace '\s*<title>.*?</title>', ''
$i = $i -replace '\s*<meta name="description"[^>]*>', ''

$insTabs = @'
<nav class="ins-tabs" aria-label="Filter essays">
<?php
        $ins_umbrella    = get_term_by( 'name', 'Insights', 'category' );
        $ins_umbrella_id = $ins_umbrella ? (int) $ins_umbrella->term_id : 0;
        $ins_first       = true;
        foreach ( get_categories( array( 'hide_empty' => true, 'exclude' => $ins_umbrella_id ? array( $ins_umbrella_id ) : array() ) ) as $ins_term ) :
?>
          <button class="ins-filter<?php echo $ins_first ? ' is-active' : ''; ?>" data-filter="<?php echo esc_attr( $ins_term->slug ); ?>"><?php echo esc_html( $ins_term->name ); ?></button>
<?php $ins_first = false; endforeach; ?>
        </nav>
'@
$i = [regex]::Replace($i, '(?s)<nav class="ins-tabs" aria-label="Filter essays">.*?</nav>', { param($m) $insTabs.Trim() })

$insGrid = @'
<?php
        $ins_umbrella    = get_term_by( 'name', 'Insights', 'category' );
        $ins_umbrella_id = $ins_umbrella ? (int) $ins_umbrella->term_id : 0;
        $ins_args = array( 'post_type' => 'post', 'post_status' => 'publish', 'posts_per_page' => 30, 'ignore_sticky_posts' => true );
        if ( $ins_umbrella_id ) { $ins_args['cat'] = $ins_umbrella_id; }
        $ins_q = new WP_Query( $ins_args );
        if ( $ins_q->have_posts() ) : while ( $ins_q->have_posts() ) : $ins_q->the_post();
          $ins_cat = null;
          foreach ( get_the_category() as $ins_cc ) { if ( $ins_umbrella_id && (int) $ins_cc->term_id === $ins_umbrella_id ) { continue; } $ins_cat = $ins_cc; break; }
          $ins_img = get_the_post_thumbnail_url( get_the_ID(), 'large' );
        ?>
          <article class="ins-card" data-category="<?php echo esc_attr( $ins_cat ? $ins_cat->slug : 'insight' ); ?>" data-reveal>
            <a class="ins-card-link" href="<?php the_permalink(); ?>">
              <div class="ins-card-media ins-card-media--photo"<?php if ( $ins_img ) echo " style=\"--ins-img:url('" . esc_url( $ins_img ) . "')\""; ?>>
                <span class="ins-card-kicker"><span class="ins-card-dot"></span><?php echo esc_html( $ins_cat ? $ins_cat->name : 'Insight' ); ?></span>
                <div class="ins-card-cap">
                  <h3 class="ins-card-title"><?php the_title(); ?></h3>
                  <p class="ins-card-byline">by <?php the_author(); ?></p>
                </div>
              </div>
            </a>
          </article>
        <?php endwhile; wp_reset_postdata(); else : ?>
          <p style="grid-column:1/-1;color:var(--ink-mute);">No insights published yet.</p>
        <?php endif; ?>
'@
$i = [regex]::Replace($i, '(?s)<article class="ins-card".*</article>', { param($m) $insGrid.Trim() })

$insSub = 'href="/contact/"'
$i = $i.Replace('onsubmit="return false;"', '')
$i = [regex]::Replace($i, '(?s)<form class="ins-subscribe-form"[^>]*>.*?</form>', { param($m) '<a class="btn btn-primary" href="/contact/">Subscribe</a>' })

[System.IO.File]::WriteAllText((Join-Path $theme "page-insights.php"), $i, $utf8)

# ── single.php: essay/article template for WP Posts (matches the essay layout;
#    featured image = portrait, excerpt = epigraph, the_content = body). ──
$sShell = [System.IO.File]::ReadAllText((Join-Path $src "approach.html"))
$sHead  = $sShell.Substring(0, $sShell.IndexOf('<main'))
$sfs    = $sShell.IndexOf('<footer class="site-footer">')
$sfe    = $sShell.IndexOf('</footer>') + '</footer>'.Length
$sFoot  = $sShell.Substring($sfs, $sfe - $sfs)

$essayStyle = @'
<style>
  .essay-body blockquote:not(.essay-inline-quote):not(.essay-epigraph) { font-family: var(--serif); font-style: italic; font-size: clamp(1.25rem, 2.4vw, 1.6rem); line-height: 1.5; color: var(--ink); text-align: center; max-width: 32ch; margin: 2.5rem auto; }
  .essay-body blockquote p { margin: 0; }
  /* Hide the Reading Time WP plugin's injected "Reading Time: N minutes" span
     (overrides its inline display:block); the essay header shows a computed
     "N min read" instead. */
  .essay-body .rt-reading-time, .essay-body .span-reading-time { display: none !important; }
</style>
'@

$essayMain = @'
<?php if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>
  <main class="essay-page">
    <article class="essay">
      <nav class="essay-back-wrap">
        <div class="container essay-container">
          <a href="/insights/" class="essay-back">&larr; Insights</a>
        </div>
      </nav>
      <?php
      $ziller_hero = function_exists( 'get_field' ) ? get_field( 'hero_image' ) : 0;
      if ( $ziller_hero ) : ?>
      <figure class="essay-portrait"><?php echo wp_get_attachment_image( (int) $ziller_hero, 'full', false, array( 'alt' => esc_attr( get_the_title() ) ) ); ?></figure>
      <?php elseif ( has_post_thumbnail() ) : ?>
      <figure class="essay-portrait"><?php the_post_thumbnail( 'large' ); ?></figure>
      <?php endif; ?>
      <header class="essay-header">
        <div class="container essay-container">
          <hr class="essay-rule" />
          <div class="essay-meta">
            <?php $ecat = null; foreach ( get_the_category() as $ecc ) { if ( strcasecmp( $ecc->name, 'Insights' ) === 0 ) { continue; } $ecat = $ecc; break; } if ( $ecat ) : ?><span><?php echo esc_html( $ecat->name ); ?></span><span class="essay-meta-dot">&middot;</span><?php endif; ?>
            <time datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( get_the_date( 'F Y' ) ); ?></time>
            <?php if ( ! has_category( 'videos-webinars' ) ) : // "N min read" is meaningless on video posts ?>
            <span class="essay-meta-dot">&middot;</span>
            <span><?php echo (int) max( 1, round( str_word_count( wp_strip_all_tags( strip_shortcodes( get_the_content() ) ) ) / 200 ) ); ?> min read</span>
            <?php endif; ?>
          </div>
          <h1 class="essay-title"><?php the_title(); ?></h1>
          <?php if ( has_excerpt() ) : ?>
          <blockquote class="essay-epigraph"><p><?php echo esc_html( get_the_excerpt() ); ?></p></blockquote>
          <?php endif; ?>
          <hr class="essay-rule" />
        </div>
      </header>
      <div class="essay-body">
        <div class="container essay-container">
          <?php the_content(); ?>
          <p class="essay-disclaimer">Please note that these are the views of the writer and not necessarily the views of Ziller. This article does not take into account your investment objectives, particular needs, or financial situation.</p>
        </div>
      </div>
      <footer class="essay-foot">
        <div class="container essay-container">
          <div class="essay-author">
            <span class="essay-author-label">Written by</span>
            <span class="essay-author-name"><?php the_author(); ?></span>
          </div>
          <div class="essay-nav">
            <a href="/insights/" class="btn btn-outline">&larr; Back to Insights</a>
          </div>
        </div>
      </footer>
    </article>
  </main>
<?php endwhile; endif; ?>
'@

$s = $sHead + "`r`n" + $essayStyle + "`r`n" + $essayMain + "`r`n" + $sFoot + "`r`n" + $contactScript + "`r`n</body>`r`n</html>`r`n"
$s = $s.Replace('"assets/', '"' + $T + '/assets/')
$s = $s.Replace("'assets/", "'" + $T + '/assets/')
$s = $s.Replace('index.html#contact', '/contact/')
$s = $s.Replace('index.html', '/')
$s = $s.Replace('"approach.html"','"/investment-philosophy-and-process/"')
$s = $s.Replace('"team.html"','"/people/"')
$s = $s.Replace('"insights.html"','"/insights/"')
$s = $s.Replace('"invest.html"','"/invest-with-us/"')
$s = $s.Replace('"fund.html"','"/ziller-global-fund/"')
$s = $s.Replace(' aria-current="page"','')
$s = $s.Replace('<link rel="stylesheet" href="styles.css" />', '')
$s = $s.Replace('<body class="page-approach">', "<body <?php body_class('single-essay'); ?>>")
$s = $s.Replace('</head>', "<?php wp_head(); ?>`r`n</head>")
$s = $s.Replace('</body>', "<?php wp_footer(); ?>`r`n</body>")
$s = $s -replace '\s*<title>.*?</title>', ''
$s = $s -replace '\s*<meta name="description"[^>]*>', ''
[System.IO.File]::WriteAllText((Join-Path $theme "single.php"), $s, $utf8)

# ── style.css (theme identity header — required by WP) ──────────────────
$styleHead = @'
/*
Theme Name: Ziller
Theme URI: https://www.zillerfm.com/
Author: Ziller Funds Management
Description: Bespoke front-end for Ziller Funds Management (Riccione / Formata typography, founder carousel, editorial layout). Replaces the Bridge theme. The design lives in styles.css, enqueued by functions.php.
Version: 0.1.0
Requires at least: 6.0
Requires PHP: 7.4
Text Domain: ziller
*/
'@
[System.IO.File]::WriteAllText((Join-Path $theme "style.css"), $styleHead, $utf8)

# ── functions.php ───────────────────────────────────────────────────────
$functions = @'
<?php
/**
 * Ziller theme — serves the bespoke static design as a WordPress theme.
 */

if ( ! function_exists( 'ziller_setup' ) ) {
	function ziller_setup() {
		add_theme_support( 'title-tag' );
		add_theme_support( 'post-thumbnails' );
		add_theme_support( 'html5', array( 'search-form', 'gallery', 'caption', 'style', 'script' ) );
		add_theme_support( 'automatic-feed-links' );
		register_nav_menus( array( 'primary' => 'Primary Menu' ) );
	}
	add_action( 'after_setup_theme', 'ziller_setup' );
}

function ziller_assets() {
	$uri = get_template_directory_uri();
	$ver = wp_get_theme()->get( 'Version' );

	// Bespoke stylesheet. Its url("assets/...") refs resolve relative to this
	// file, i.e. the theme directory, so no path rewriting is needed there.
	wp_enqueue_style( 'ziller-main', $uri . '/styles.css', array(), $ver );

	// script.js powers the HOME page only (carousel, counters, chart). Sub-pages
	// ship their own inline scripts, so it is kept off them. It reads
	// window.ZILLER_ASSETS to build image URLs from the theme directory.
	if ( is_front_page() ) {
		wp_enqueue_script( 'ziller-main', $uri . '/script.js', array(), $ver, true );
		wp_add_inline_script(
			'ziller-main',
			'window.ZILLER_ASSETS=' . wp_json_encode( trailingslashit( $uri ) ) . ';',
			'before'
		);
	}
}
add_action( 'wp_enqueue_scripts', 'ziller_assets' );

// Preserve the design's per-page body classes (CSS targets .page-home etc.).
function ziller_body_class( $classes ) {
	if ( is_front_page() ) {
		$classes[] = 'page-home';
	}
	return $classes;
}
add_filter( 'body_class', 'ziller_body_class' );

// Browser-tab / <title>: render as "Page | Ziller FM" (pipe separator) and give the
// two lower-cased Pages nicer labels. Uses WordPress core's title-tag hooks. NOTE:
// if an SEO plugin (Rank Math / Yoast) is active and takes over the document title,
// set the separator + page titles in that plugin's "Titles & Meta" settings instead.
add_filter( 'document_title_separator', 'ziller_title_separator' );
function ziller_title_separator( $sep ) {
	return '|';
}

add_filter( 'document_title_parts', 'ziller_title_parts' );
function ziller_title_parts( $parts ) {
	if ( is_page() ) {
		$nice = array(
			'funds'  => 'Fund',
			'invest' => 'Invest',
		);
		$slug = get_post_field( 'post_name', get_queried_object_id() );
		if ( isset( $nice[ $slug ] ) ) {
			$parts['title'] = $nice[ $slug ];
		}
	}
	return $parts;
}

// Home-page performance figures -- editable at Appearance > Customize > "Ziller -
// Home Figures", so month-end updates need no theme rebuild/re-upload. front-page.php
// reads these via get_theme_mod() with the current values as defaults.
add_action( 'customize_register', 'ziller_customize_figures' );
function ziller_customize_figures( $wp_customize ) {
	$wp_customize->add_section( 'ziller_figures', array(
		'title'       => 'Ziller - Home Figures',
		'priority'    => 30,
		'description' => 'Performance figures on the home page. Enter the number only, no % sign (e.g. 24.7).',
	) );
	$ziller_fig = array(
		'ziller_return_pa'      => array( 'Net return p.a. since inception (%)', '24.7' ),
		'ziller_outperformance' => array( 'Outperformance since inception (%)', '39.5' ),
		'ziller_return_incep'   => array( 'Total return since inception (%)', '120.5' ),
	);
	foreach ( $ziller_fig as $id => $f ) {
		$wp_customize->add_setting( $id, array(
			'default'           => $f[1],
			'sanitize_callback' => 'ziller_sanitize_figure',
			'transport'         => 'refresh',
		) );
		$wp_customize->add_control( $id, array(
			'label'   => $f[0],
			'section' => 'ziller_figures',
			'type'    => 'text',
		) );
	}

	// Quarterly Performance Update video (page-quarterly-performance-update.php).
	// Paste a Vimeo ID or URL each quarter -- no rebuild needed.
	$wp_customize->add_section( 'ziller_quarterly', array(
		'title'       => 'Ziller - Quarterly Update',
		'priority'    => 31,
		'description' => 'Vimeo video ID or URL for the Quarterly Performance Update page. Update it each quarter.',
	) );
	$wp_customize->add_setting( 'ziller_quarterly_vimeo', array(
		'default'           => '',
		'sanitize_callback' => 'sanitize_text_field',
		'transport'         => 'refresh',
	) );
	$wp_customize->add_control( 'ziller_quarterly_vimeo', array(
		'label'   => 'Vimeo ID or URL',
		'section' => 'ziller_quarterly',
		'type'    => 'text',
	) );
}

// Keep a figure numeric: strip any %/comma/space, then require optional minus, digits,
// optional one decimal group; revert to the field default if invalid so the home page
// never shows a blank.
function ziller_sanitize_figure( $value, $setting ) {
	$value = str_replace( array( '%', ',', ' ' ), '', trim( (string) $value ) );
	return preg_match( '/^-?\d+(\.\d+)?$/', $value ) ? $value : $setting->default;
}

// Optional per-article "Hero image" (ACF Pro). Lets the article hero differ from
// the listing-card thumbnail (the featured image); falls back to the featured
// image when unset. No-op if ACF is not active.
add_action( 'acf/init', 'ziller_acf_fields' );
function ziller_acf_fields() {
	if ( ! function_exists( 'acf_add_local_field_group' ) ) { return; }
	acf_add_local_field_group( array(
		'key'      => 'group_ziller_article',
		'title'    => 'Article Media',
		'fields'   => array(
			array(
				'key'           => 'field_ziller_hero',
				'label'         => 'Hero image',
				'name'          => 'hero_image',
				'type'          => 'image',
				'return_format' => 'id',
				'preview_size'  => 'medium',
				'instructions'  => 'Optional. Shown large at the top of the article. If empty, the featured image is used. (The Insights listing card always uses the featured image.)',
			),
		),
		'location' => array(
			array(
				array( 'param' => 'post_type', 'operator' => '==', 'value' => 'post' ),
			),
		),
	) );
}
'@
[System.IO.File]::WriteAllText((Join-Path $theme "functions.php"), $functions, $utf8)

# ── index.php (required fallback template) ──────────────────────────────
$index = @'
<?php get_header(); ?>
<main id="top">
	<section class="container" style="padding:140px 0 100px;">
		<?php if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>
			<article>
				<h1 class="section-title"><?php the_title(); ?></h1>
				<div><?php the_content(); ?></div>
			</article>
		<?php endwhile; endif; ?>
	</section>
</main>
<?php get_footer(); ?>
'@
[System.IO.File]::WriteAllText((Join-Path $theme "index.php"), $index, $utf8)

# ── script.js (prepend asset-base shim + point relative paths at theme) ──
$js = [System.IO.File]::ReadAllText((Join-Path $src "script.js"))
$js = $js.Replace('`assets/', '`${A}assets/')
$js = "var A=(typeof window!=='undefined'&&window.ZILLER_ASSETS)?window.ZILLER_ASSETS:'';`r`n" + $js
[System.IO.File]::WriteAllText((Join-Path $theme "script.js"), $js, $utf8)

# ── styles.css (verbatim) + assets the home page needs ──────────────────
Copy-Item (Join-Path $src "styles.css") (Join-Path $theme "styles.css")
# Bundle the assets folder, minus the essay hero images: with Insights now driven
# by WP Posts, those images live in the media library, so dropping them keeps the
# theme zip small and the upload reliable.
Copy-Item (Join-Path $src "assets") (Join-Path $theme "assets") -Recurse
$essayImgDir = Join-Path $theme "assets\essays"
if (Test-Path $essayImgDir) { Remove-Item $essayImgDir -Recurse -Force }
# Drop the ~3.9 MB bundled monthly-report PDF: the fund page auto-detects the LIVE
# MMYY_ZILR.pdf, so this copy is only a fallback and it bloats the upload past the
# server's size limit -> WordPress then reports the bogus "missing style.css" on the
# truncated upload. The report button disables itself if no live report is found.
$reportPdf = Join-Path $theme "assets\docs\Ziller-Global-Fund-Active-ETF-May-2026-Report.pdf"
if (Test-Path $reportPdf) { Remove-Item $reportPdf -Force }

# ── Zip it — entries MUST use forward slashes. Compress-Archive on PS 5.1
#    writes backslashes (ziller\style.css), which Linux/WordPress unzip can't
#    read -> bogus "missing style.css". Build the archive by hand instead. ──
if (Test-Path $zip) { Remove-Item $zip -Force }
Add-Type -AssemblyName System.IO.Compression | Out-Null
Add-Type -AssemblyName System.IO.Compression.FileSystem | Out-Null
$base = (Split-Path $theme -Parent).TrimEnd('\') + '\'
$fs = [System.IO.File]::Open($zip, [System.IO.FileMode]::Create)
$arch = New-Object System.IO.Compression.ZipArchive($fs, [System.IO.Compression.ZipArchiveMode]::Create)
# Write explicit DIRECTORY entries before their files. A bare .NET ZipArchive writes
# only file entries (no folder entries); some WordPress unpackers then can't resolve
# the theme folder and reject the upload with the bogus "missing style.css". This makes
# the archive look like a normal zip tool's output (ziller/, ziller/assets/, ...).
$dirsSeen = @{}
foreach ($f in Get-ChildItem $theme -Recurse -File) {
	$rel = $f.FullName.Substring($base.Length).Replace('\','/')
	$segs = $rel.Split('/')
	$acc = ''
	for ($k = 0; $k -lt $segs.Length - 1; $k++) {
		$acc += $segs[$k] + '/'
		if (-not $dirsSeen.ContainsKey($acc)) {
			$dirsSeen[$acc] = $true
			$arch.CreateEntry($acc) | Out-Null      # directory entry (name ends in '/')
		}
	}
	$entry = $arch.CreateEntry($rel, [System.IO.Compression.CompressionLevel]::Optimal)
	$in = [System.IO.File]::ReadAllBytes($f.FullName)
	$out = $entry.Open()
	$out.Write($in, 0, $in.Length)
	$out.Dispose()
}
$arch.Dispose()
$fs.Dispose()

# --- Verify the zip (catches the WordPress "missing style.css" class of bugs) --
Add-Type -AssemblyName System.IO.Compression.FileSystem | Out-Null
$errs = @()
$expect = @('style.css','functions.php','header.php','footer.php','front-page.php','index.php','single.php',
            'page-investment-philosophy-and-process.php','page-people.php','page-invest-with-us.php',
            'page-ziller-global-fund.php','page-contact.php','page-insights.php',
            'page-disclaimer.php','page-careers.php','page-subscribe.php','page-quarterly-performance-update.php')
$z = [System.IO.Compression.ZipFile]::OpenRead($zip)
try {
  $names = @($z.Entries | ForEach-Object { $_.FullName })
  foreach ($e in $expect) { if ($names -notcontains "ziller/$e") { $errs += "missing template: $e" } }
  if (@($names | Where-Object { $_ -like '*\*' }).Count -gt 0) { $errs += 'backslash paths present (WordPress will reject the zip)' }
  $se = $z.Entries | Where-Object { $_.FullName -eq 'ziller/style.css' } | Select-Object -First 1
  if ($se) {
    $rdr = New-Object System.IO.StreamReader($se.Open())
    $hasHeader = $rdr.ReadToEnd().Contains('Theme Name:')
    $rdr.Close()
    if (-not $hasHeader) { $errs += 'style.css has no "Theme Name:" header' }
  }
  $phpCount = @($names | Where-Object { $_ -like 'ziller/*.php' }).Count
} finally { $z.Dispose() }

if ($errs.Count -gt 0) {
  Write-Host ""
  Write-Host "BUILD FAILED verification - do NOT upload:"
  $errs | ForEach-Object { Write-Host ("  - {0}" -f $_) }
  exit 1
}

# Remove the interim Downloads copy so there is a single zip to upload (from the Desktop).
if ( ($oldZip -ne $zip) -and (Test-Path $oldZip) ) { Remove-Item $oldZip -Force -ErrorAction SilentlyContinue }

# Pin the freshly built zip so OneDrive keeps it fully on this device (never a cloud
# placeholder). It is fully local right now; this stops OneDrive dehydrating it later.
# Run via cmd so attrib's output can't trip PowerShell's native-stderr handling.
& cmd /c "attrib -U +P ""$zip"" >nul 2>&1"

Write-Host ""
Write-Host ("BUILD OK  ->  {0}" -f $zip)
Write-Host ("  size:      {0:N2} MB" -f ((Get-Item $zip).Length / 1MB))
Write-Host ("  templates: {0} .php files, style.css header present, forward-slash paths verified" -f $phpCount)
Write-Host ""
Write-Host "Upload: WP admin > Appearance > Themes > Add New Theme > Upload Theme > Replace current with uploaded."
Write-Host "The zip is on your Desktop, pinned to stay fully on-device. If it ever shows a OneDrive cloud icon,"
Write-Host "right-click > Always keep on this device (or just rebuild) before uploading."
