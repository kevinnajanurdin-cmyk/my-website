// ─── Founder-led performance chart ────────────────────
// Shared by the home page (.odds band) and the Founder-led Advantage landing
// page. Self-contained: it only needs a .founder-chart-wrap containing a
// #founder-chart canvas, and no-ops when neither is present. Extracted from
// script.js so the landing page can use it without pulling in the whole
// home-page bundle (carousel, founder panel, insights stack).
(function initFounderChart() {
  var wrap = document.querySelector(".founder-chart-wrap");
  var canvas = document.getElementById("founder-chart");
  if (!wrap || !canvas) return;
  var ctx = canvas.getContext("2d");
  var reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 123 bi-monthly data points, Dec 2005 – Apr 2026 (raw dollar values, $100k start)
  var F = [100000,105135,109730,102664,101564,106538,112494,115593,116727,120596,123627,123257,121689,108204,109193,96741,104098,84642,82683,78735,95476,102188,111578,110394,119382,117142,124121,123085,122613,129317,131599,131108,130723,129401,118582,116594,111101,125860,126723,121311,122054,128817,136296,142923,143613,153795,162480,168798,179700,183414,179594,187529,193588,194436,203071,223410,233959,230598,221706,231347,218270,211134,224510,227570,240414,236673,244230,252001,269134,269564,276583,297013,308667,319720,322501,317067,323915,296918,297638,340329,360731,355647,354567,366068,386531,403607,399247,431175,458615,473234,526835,552014,571035,622357,639236,617134,631564,573502,520557,524990,526524,504574,525964,567975,589852,599749,617879,581026,618838,664756,668186,659228,673146,760530,815501,855657,830669,919313,1005577,1055904,1007298,944731,967732];
  var M = [100000,103548,107151,105153,105583,109345,112760,113441,114642,115204,117420,112759,113445,98212,100976,92611,98528,88846,81190,74050,79069,77714,83679,80913,86168,83718,86396,83422,82100,84410,85371,89412,86346,85083,77699,79131,78929,83600,85636,83326,85576,87235,90178,95989,99014,108794,114638,117954,129129,129762,126520,129592,132206,136717,146769,159529,159813,159752,162632,168402,160889,153027,156613,159041,165036,161190,174985,174144,183160,183114,182769,197399,200637,204100,207796,210537,225034,212536,201137,221410,233277,234741,239535,245546,255650,250686,240036,243799,254932,252671,271208,275835,295164,312537,330635,324032,340702,315515,304903,286090,297472,304936,296384,312423,332668,345130,357585,340204,362347,398547,398910,411946,423065,434943,468583,479842,451016,484875,506743,536523,531582,520007,525411];
  var YR = [2005.92,2006.08,2006.25,2006.42,2006.58,2006.75,2006.92,2007.08,2007.25,2007.42,2007.58,2007.75,2007.92,2008.08,2008.25,2008.42,2008.58,2008.75,2008.92,2009.08,2009.25,2009.42,2009.58,2009.75,2009.92,2010.08,2010.25,2010.42,2010.58,2010.75,2010.92,2011.08,2011.25,2011.42,2011.58,2011.75,2011.92,2012.08,2012.25,2012.42,2012.58,2012.75,2012.92,2013.08,2013.25,2013.42,2013.58,2013.75,2013.92,2014.08,2014.25,2014.42,2014.58,2014.75,2014.92,2015.08,2015.25,2015.42,2015.58,2015.75,2015.92,2016.08,2016.25,2016.42,2016.58,2016.75,2016.92,2017.08,2017.25,2017.42,2017.58,2017.75,2017.92,2018.08,2018.25,2018.42,2018.58,2018.75,2018.92,2019.08,2019.25,2019.42,2019.58,2019.75,2019.92,2020.08,2020.25,2020.42,2020.58,2020.75,2020.92,2021.08,2021.25,2021.42,2021.58,2021.75,2021.92,2022.08,2022.25,2022.42,2022.58,2022.75,2022.92,2023.08,2023.25,2023.42,2023.58,2023.75,2023.92,2024.08,2024.25,2024.42,2024.58,2024.75,2024.92,2025.08,2025.25,2025.42,2025.58,2025.75,2025.92,2026.08,2026.25];
  var N = F.length;
  var Y_MIN = 2006, Y_MAX = 2026;
  var V_MAX = 1200000;
  var GRID_STEPS = [100000, 300000, 500000, 700000, 900000, 1100000];

  var PAD_L = 64, PAD_R = 130, PAD_T = 24, PAD_B = 36;
  // Optional per-instance right gutter (see resize()). 0 / absent = use defaults.
  var PAD_R_OVERRIDE = parseInt(wrap.getAttribute("data-pad-right"), 10) || 0;
  var W = 0, H = 0;
  var drawProgress = reduceMotion ? 1 : 0;
  var animStart = 0;
  var revealed = false;

  function resize() {
    var rect = wrap.getBoundingClientRect();
    var w = Math.max(1, rect.width);
    var h = Math.max(1, canvas.clientHeight || 380);
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    if (Math.round(w) !== W || Math.round(h) !== H) {
      W = Math.round(w); H = Math.round(h);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Adjust padding for narrow screens. PAD_R is the gutter the end labels
      // ("10x / Founder-led Stocks") are drawn into; the default leaves the home
      // page's chart room to breathe, but a caller can tighten it with
      // data-pad-right on the wrap so the ink runs out to its own right margin.
      PAD_L = W < 500 ? 48 : 64;
      PAD_R = PAD_R_OVERRIDE || (W < 500 ? 90 : 130);
      return true;
    }
    return false;
  }

  function xAt(yr) { return PAD_L + ((yr - Y_MIN) / (Y_MAX - Y_MIN)) * (W - PAD_L - PAD_R); }
  function yAt(v) { return PAD_T + (1 - v / V_MAX) * (H - PAD_T - PAD_B); }

  function drawLine(data) {
    ctx.beginPath();
    for (var i = 0; i < N; i++) {
      var x = xAt(YR[i]), y = yAt(data[i]);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function fmtDollar(v) {
    if (v === 0) return "$0";
    if (v >= 1000000) return "$" + (v / 1000000).toFixed(1) + "M";
    return "$" + (v / 1000).toFixed(0) + "k";
  }

  function render(p) {
    ctx.clearRect(0, 0, W, H);
    var chartL = PAD_L, chartR = W - PAD_R;
    var chartT = PAD_T, chartB = H - PAD_B;

    // Clip-x for progressive reveal
    var clipX = chartL + (chartR - chartL) * p;

    // ── Horizontal grid lines + Y-axis labels ──
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.font = "11px 'Formata Light', sans-serif";
    for (var gi = 0; gi < GRID_STEPS.length; gi++) {
      var gy = yAt(GRID_STEPS[gi]);
      // Grid line
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(chartL, gy);
      ctx.lineTo(chartR, gy);
      ctx.stroke();
      // Label
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.fillText(fmtDollar(GRID_STEPS[gi]), chartL - 10, gy);
    }

    // ── X-axis year labels ──
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = "11px 'Formata Light', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    // Tick density adapts to the plot width: every 2 years when each of the
    // 11 labels gets a comfortable ~46px slot, otherwise every 4 (6 labels,
    // endpoints preserved) — on phones the biennial labels collide into
    // "200620082010…".
    var yrStep = (chartR - chartL) / 11 >= 46 ? 2 : 4;
    for (var yr = 2006; yr <= 2026; yr += yrStep) {
      var yx = xAt(yr);
      if (yx <= clipX + 2) {
        ctx.fillText(yr, yx, chartB + 10);
        // Subtle tick
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(yx, chartB);
        ctx.lineTo(yx, chartB + 5);
        ctx.stroke();
      }
    }

    // ── Fill area between curves (clipped) ──
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, clipX + 1, H);
    ctx.clip();

    ctx.beginPath();
    for (var i = 0; i < N; i++) {
      var fx = xAt(YR[i]), fy = yAt(F[i]);
      if (i === 0) ctx.moveTo(fx, fy); else ctx.lineTo(fx, fy);
    }
    for (var k = N - 1; k >= 0; k--) {
      ctx.lineTo(xAt(YR[k]), yAt(M[k]));
    }
    ctx.closePath();
    var grad = ctx.createLinearGradient(0, chartT, 0, chartB);
    grad.addColorStop(0, "rgba(255,255,255,0.07)");
    grad.addColorStop(1, "rgba(255,255,255,0.01)");
    ctx.fillStyle = grad;
    ctx.fill();

    // ── MSCI line ──
    ctx.strokeStyle = "rgba(168,178,194,0.68)";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    drawLine(M);

    // ── Founder line ──
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 2.5;
    drawLine(F);

    ctx.restore();

    // ── End labels (fade in near completion) ──
    var labelAlpha = p >= 0.88 ? Math.min(1, (p - 0.88) / 0.12) : 0;
    if (labelAlpha > 0) {
      ctx.globalAlpha = labelAlpha;
      var endX = chartR + 14;
      var fEndY = yAt(F[N - 1]);
      var mEndY = yAt(M[N - 1]);

      // "10x" — number italic serif, "x" upright
      var bigSize = W < 500 ? 36 : 52;
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.font = "italic " + bigSize + "px 'Riccione Serial', Georgia, serif";
      ctx.fillText("10", endX, fEndY + 4);
      var numW = ctx.measureText("10").width;
      var xSize = Math.round(bigSize * 0.5);
      ctx.font = xSize + "px 'Riccione Serial', Georgia, serif";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.textBaseline = "middle";
      ctx.fillText("x", endX + numW + 2, fEndY + 4 - bigSize * 0.36);
      ctx.textBaseline = "bottom";

      // "Founder-led Stocks*" — series label under the end value. Shared size
      // with "All Stocks" below; line gap tracks the size so the two-line
      // label keeps its spacing if the size is tuned.
      var subSize = W < 500 ? 11 : 12;
      var subLead = Math.round(subSize * 1.4);
      ctx.font = subSize + "px 'Formata Light', sans-serif";
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      var subY = fEndY + 8;
      ctx.fillText("Founder-led", endX, subY);
      ctx.fillText("Stocks", endX, subY + subLead);

      // "5x" — number italic serif, "x" upright, muted
      var midSize = W < 500 ? 28 : 40;
      ctx.textBaseline = "bottom";
      ctx.fillStyle = "rgba(168,178,194,0.72)";
      ctx.font = "italic " + midSize + "px 'Riccione Serial', Georgia, serif";
      ctx.fillText("5", endX, mEndY + 2);
      var numW5 = ctx.measureText("5").width;
      var xSize5 = Math.round(midSize * 0.5);
      ctx.font = xSize5 + "px 'Riccione Serial', Georgia, serif";
      ctx.fillStyle = "rgba(168,178,194,0.58)";
      ctx.textBaseline = "middle";
      ctx.fillText("x", endX + numW5 + 1, mEndY + 2 - midSize * 0.36);
      ctx.textBaseline = "bottom";

      // "All Stocks*" — same series-label size as "Founder-led Stocks" above
      ctx.font = subSize + "px 'Formata Light', sans-serif";
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(168,178,194,0.54)";
      ctx.fillText("All Stocks", endX, mEndY + 6);

      ctx.globalAlpha = 1;
    }
  }

  // Scroll-triggered reveal + draw animation
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting && !revealed) {
        revealed = true;
        wrap.classList.add("is-visible");
        if (reduceMotion) { drawProgress = 1; resize(); render(1); return; }
        animStart = performance.now();
        requestAnimationFrame(animate);
      }
    });
  }, { threshold: 0.15 });
  io.observe(wrap);

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function animate(now) {
    var elapsed = now - animStart;
    var duration = 2400;
    drawProgress = easeOutCubic(Math.min(1, elapsed / duration));
    resize();
    render(drawProgress);
    if (drawProgress < 1) requestAnimationFrame(animate);
  }

  function onResize() { if (revealed) { resize(); render(drawProgress); } }
  window.addEventListener("resize", onResize, { passive: true });

  resize();
  if (reduceMotion) { revealed = true; wrap.classList.add("is-visible"); render(1); }
})();
