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
$ziller_wpslug = @{ 'approach' = 'investment-philosophy-and-process'; 'team' = 'people'; 'invest' = 'invest-with-us'; 'contact' = 'contact'; 'disclaimer' = 'disclaimer'; 'careers' = 'careers'; 'subscribe' = 'subscribe' }
foreach ($slug in @('approach','team','invest','contact','disclaimer','careers','subscribe')) {
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

# ── Quarterly Performance Update -> page-quarterly-performance-update.php. Read from
#    quarterly-performance-update.html (static Vimeo embed) and rewire the video to the
#    Customizer field, same as the Fund page, so one paste in "Ziller - Quarterly
#    Update" updates both. ─────────────────────────────────────────────────────────
$qu = [System.IO.File]::ReadAllText((Join-Path $src "quarterly-performance-update.html"))
$qu = $qu.Replace('"assets/', '"' + $T + '/assets/')
$qu = $qu.Replace("'assets/", "'" + $T + '/assets/')
$qu = $qu.Replace('`assets/', '`' + $T + '/assets/')
$qu = $qu.Replace('index.html#contact', '/contact/')
$qu = $qu.Replace('index.html', '/')
$qu = $qu.Replace('"approach.html"','"/investment-philosophy-and-process/"')
$qu = $qu.Replace('"team.html"','"/people/"')
$qu = $qu.Replace('"insights.html"','"/insights/"')
$qu = $qu.Replace('"invest.html"','"/invest-with-us/"')
$qu = $qu.Replace('"fund.html"','"/ziller-global-fund/"')
$qu = $qu.Replace('player.vimeo.com/video/1181798546?', 'player.vimeo.com/video/<?php echo esc_attr( ziller_vimeo_id( ''1181798546'' ) ); ?>?')
$qu = $qu.Replace('<link rel="stylesheet" href="styles.css" />', '')
$qu = $qu.Replace('<script src="prefetch.js" defer></script>', '')
$qu = $qu.Replace('<body class="page-quarterly">', "<body <?php body_class('page-quarterly'); ?>>")
$qu = $qu.Replace('</head>', "<?php wp_head(); ?>`r`n</head>")
$qu = $qu.Replace('</body>', "<?php wp_footer(); ?>`r`n</body>")
$qu = $qu -replace '\s*<title>.*?</title>', ''
$qu = $qu -replace '\s*<meta name="description"[^>]*>', ''
[System.IO.File]::WriteAllText((Join-Path $theme "page-quarterly-performance-update.php"), $qu, $utf8)

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

# Fund-page video -> driven by the SAME Customizer field as the Quarterly Update page
# (Appearance > Customize > "Ziller - Quarterly Update"), so one paste updates both.
# Falls back to the current video ID if the field is left empty.
$f = $f.Replace('player.vimeo.com/video/1181798546?', 'player.vimeo.com/video/<?php echo esc_attr( ziller_vimeo_id( ''1181798546'' ) ); ?>?')

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

# Inline page script (footer year + mobile menu), reused by the sub-page loop and single.php.
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

# style.css (theme identity header - required by WP)
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

// Quarterly video ID from the Customizer field (accepts a bare ID or any Vimeo URL);
// returns $default when unset. Shared by the Fund page and the Quarterly Update page.
function ziller_vimeo_id( $default = '' ) {
	$v = trim( (string) get_theme_mod( 'ziller_quarterly_vimeo', '' ) );
	return ( $v !== '' && preg_match( '/(\d{6,})/', $v, $m ) ) ? $m[1] : $default;
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

# Pin the freshly built zip so OneDrive keeps it fully on this device (never a cloud
# placeholder). It is fully local right now; this stops OneDrive dehydrating it later.
# Run via cmd so attrib's output can't trip PowerShell's native-stderr handling.
& cmd /c "attrib -U +P ""$zip"" >nul 2>&1"

# Also drop a copy in Downloads (plain local disk, outside OneDrive -- no sync driver,
# no reparse point). If a Desktop upload ever hits the bogus "missing style.css" again
# (stale/partial bytes streamed mid-OneDrive-resync), upload this copy instead.
$deployDir = Join-Path $env:USERPROFILE 'Downloads'
if (-not (Test-Path $deployDir)) { $deployDir = $env:LOCALAPPDATA }
$deployZip = Join-Path $deployDir 'ziller-theme.zip'
Copy-Item $zip $deployZip -Force

Write-Host ""
Write-Host ("BUILD OK  ->  {0}" -f $zip)
Write-Host ("  size:      {0:N2} MB" -f ((Get-Item $zip).Length / 1MB))
Write-Host ("  templates: {0} .php files, style.css header present, forward-slash paths verified" -f $phpCount)
Write-Host ""
Write-Host "Upload: WP admin > Appearance > Themes > Add New Theme > Upload Theme > Replace current with uploaded."
Write-Host ("A plain local copy is also in {0} - if the Desktop upload ever hits the bogus" -f $deployZip)
Write-Host '"missing style.css" again (OneDrive mid-sync), upload the Downloads copy instead.'
