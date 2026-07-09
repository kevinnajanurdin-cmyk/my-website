// ─── Footer year ───────────────────────────────────────
document.getElementById("year").textContent = new Date().getFullYear();

// ─── Mobile menu toggle ────────────────────────────────
const toggle = document.querySelector(".menu-toggle");
if (toggle) {
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    document.body.classList.toggle("nav-open", !open);
  });
  document.querySelectorAll(".primary-nav a").forEach((a) =>
    a.addEventListener("click", () => {
      document.body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
    })
  );
}

// ─── Founders data ─────────────────────────────────────
const founders = [
  {
    first: "Jensen", last: "Huang", company: "Nvidia",
    role: "Co-founder & CEO", founded: "1993", sector: "AI Hardware",
    geo: "United States", accent: "#76b900",
    thesis: "Three decades of compounding without selling a share. The accelerator-computing platform he willed into existence now underwrites the entire AI build-out."
  },
  {
    first: "Alex", last: "Karp", company: "Palantir",
    role: "Co-founder & CEO", founded: "2003", sector: "AI Platforms",
    geo: "United States", accent: "#0a1a2f",
    thesis: "Long-duration software for the institutions that matter most. Karp's intellectual independence and mission orientation produce a workforce — and a product — competitors can't replicate."
  },
  {
    first: "Brian", last: "Armstrong", company: "Coinbase",
    role: "Co-founder & CEO", founded: "2012", sector: "FinTech",
    geo: "United States", accent: "#0052ff",
    thesis: "The most regulated, most trusted on-ramp to digital assets. A founder who has earned the right to lead the category through every cycle."
  },
  {
    first: "Elon", last: "Musk", company: "Tesla",
    role: "Co-founder & CEO", founded: "2003", sector: "Robotics",
    geo: "United States", accent: "#cc1f2e",
    thesis: "The most consequential industrial founder of his generation — a vertical integrator who turned electric vehicles, energy storage and autonomy into a single compounding flywheel."
  },
  {
    first: "He", last: "Xiaopeng", company: "XPeng",
    role: "Co-founder & CEO", founded: "2014", sector: "Robotics",
    geo: "China", accent: "#0a8de8",
    thesis: "Software-first EV native with the highest-rated assisted-driving stack in China. Iteration speed and engineering culture set XPeng apart from the legacy auto cohort."
  },
  {
    first: "Dylan", last: "Field", company: "Figma",
    role: "Co-founder & CEO", founded: "2012", sector: "Digital Media",
    geo: "United States", accent: "#a259ff",
    thesis: "Collaborative design as default. A founder with an unusually long horizon who turned down the largest software deal ever to keep building."
  },
  {
    first: "Peter", last: "Beck", company: "Rocket Lab",
    role: "Founder & CEO", founded: "2006", sector: "Access to Space",
    geo: "New Zealand / USA", accent: "#e63312",
    thesis: "From garage tinkerer to the second most prolific Western launch provider. Now moving up-stack into spacecraft — a vertical integrator in the making."
  },
  {
    first: "Yosuke", last: "Tsuji", company: "Money Forward",
    role: "Founder & CEO", founded: "2012", sector: "FinTech",
    geo: "Japan", accent: "#0099a8",
    thesis: "Japan's leading household-finance and SaaS-for-SMB platform. A founder rebuilding the country's financial plumbing for a digital generation."
  },
  {
    first: "Rick", last: "Smith", company: "Axon",
    role: "Co-founder & CEO", founded: "1993", sector: "Internet of Things",
    geo: "United States", accent: "#fdb414",
    thesis: "From Taser to a category-defining public-safety software platform. Razor-and-blades hardware funds a recurring software business with extraordinary stickiness."
  },
  {
    first: "David", last: "Nyland", company: "Lumine",
    role: "President & CEO", founded: "2023", sector: "Vertical Market Software",
    geo: "Canada", accent: "#1d3e75",
    thesis: "The Constellation-Software playbook applied to communications & media software. Decentralised, founder-respecting M&A with a multi-decade reinvestment runway."
  },
  {
    first: "Ken", last: "Xie", company: "Fortinet",
    role: "Founder, Chair & CEO", founded: "2000", sector: "Cyber Security",
    geo: "United States", accent: "#ee3124",
    thesis: "Founder-built ASIC advantage in network security. Ken still owns a meaningful stake and runs the company with the discipline of an owner-operator."
  },
  {
    first: "Robin", last: "Zeng", company: "CATL",
    role: "Founder & Chair", founded: "2011", sector: "New Energy",
    geo: "China", accent: "#003a78",
    thesis: "The world's dominant battery maker. Scale, chemistry leadership and customer breadth that competitors will need a decade and a balance sheet to approach."
  },
  {
    first: "Sam", last: "Hupert", company: "Pro Medicus",
    role: "Co-founder & CEO", founded: "1983", sector: "Medical Imaging",
    geo: "Australia", accent: "#0a4f8a",
    thesis: "Four-decade founder still compounding. Pro Medicus's Visage platform is the gold standard in radiology and is winning the largest US health systems one by one."
  },
  {
    first: "Marcos", last: "Galperín", company: "Mercado Libre",
    role: "Co-founder & CEO", founded: "1999", sector: "Ecommerce",
    geo: "Latin America", accent: "#ffe600",
    thesis: "The Amazon-plus-PayPal of Latin America under a founder who has out-executed every regional and global challenger for 25 years."
  },
  {
    first: "David", last: "Baszucki", company: "Roblox",
    role: "Co-founder & CEO", founded: "2004", sector: "Gaming Platforms",
    geo: "United States", accent: "#e2241a",
    thesis: "The platform on which a generation creates, plays and increasingly earns. A 20-year founder still treating it like year one."
  },
  {
    first: "Mikheil", last: "Lomtadze", company: "Kaspi",
    role: "Co-founder & CEO", founded: "2006", sector: "Ecommerce",
    geo: "Kazakhstan", accent: "#f14635",
    thesis: "Kazakhstan's dominant e-commerce marketplace and consumer super-app. Lomtadze turned a regional bank into the daily-use platform for shopping and payments, with rare profitability and deep founder ownership."
  }
];

// Map company → portrait filename in assets/founders/ (null = no portrait)
const PORTRAIT_FILES = {
  "Tesla": "elon.jpg",
  "Nvidia": "jensen.jpg",
  "Palantir": "alex.jpg",
  "Coinbase": "brian.jpg",
  "XPeng": "xiaopeng.jpg",
  "Figma": "dylan.jpg",
  "Rocket Lab": "peter.jpg",
  "Money Forward": "yosuke.jpg",
  "Axon": "rick.jpg",
  "Lumine": "nyland.jpg",
  "Fortinet": "ken.jpg",
  "CATL": "robin.jpg",
  "Pro Medicus": "sam.jpg",
  "Mercado Libre": "marcos.jpg",
  "Roblox": "baszucki.jpg",
  "Kaspi": "mikheil.png",
};
const portraitUrl = (company) => {
  const f = PORTRAIT_FILES[company];
  return f ? `assets/founders/${f}` : null;
};

// Map company → actual logo filename in assets/companies/
const LOGO_FILES = {
  "Tesla": "Tesla_logo.png",
  "Nvidia": "Nvidia_logo.svg.png",
  "Palantir": "Palantir_Technologies_logo.svg.png",
  "Coinbase": "Coinbase.svg.png",
  "XPeng": "XPeng-Logo.png",
  "Figma": "Figma-Logo.png",
  "Rocket Lab": "Rocket_Lab_logo.svg.png",
  "Money Forward": "19376c0c-5919-4cc1-af04-097179e8140a.png",
  "Axon": "AXON_Company_logo.svg.png",
  "Lumine": "LMN.V_BIG-19c8956c.png",
  "Fortinet": "Fortinet_logo.svg",
  "CATL": "Contemporary_Amperex_Technology_logo.svg.png",
  "Pro Medicus": "PME.AX_BIG-541b1641.png",
  "Mercado Libre": "Mercado_Libre_logo_(Spanish_version).svg",
  "Roblox": "roblox.png",
  "Kaspi": "kaspi.png",
};
const logoUrl = (company) =>
  `assets/companies/${encodeURIComponent(LOGO_FILES[company] || "").replace(/%2F/g, "/")}`;

// Per-company render height (px). Tuned individually based on each source
// file's visible content (some PNGs have heavy transparent whitespace, so they
// need a larger height than aspect ratio alone would suggest).
const LOGO_HEIGHTS = {
  "Tesla":         70,   // T + TESLA stacked, narrow visible footprint
  "Mercado Libre": 58,   // square, fully filled
  "Money Forward": 74,   // icon + text, ~30% vertical whitespace
  "Nvidia":        52,   // compact icon, full fill
  "XPeng":         54,   // icon + wordmark
  "Figma":         66,   // F + text, ~50% vertical whitespace
  "Roblox":        78,   // wide wordmark + heavy whitespace (VFill 0.32)
  "Rocket Lab":    36,   // wordmark
  "Palantir":      30,   // wordmark
  "Axon":          30,   // wordmark
  "CATL":          28,   // wordmark
  "Pro Medicus":   26,   // wordmark
  "Coinbase":      26,   // wordmark
  "Lumine":        24,   // wide wordmark
  "Fortinet":      20,   // very wide wordmark
  "Kaspi":         56,   // square badge, fully filled
};

// Map company → scene/brand photo in assets/scenes/ (null = none yet)
const SCENE_FILES = {
  "Tesla": "tesla.webp",
  "Nvidia": "nvidia.jpg",
  "Palantir": "palantir.jpg",
  "Coinbase": "coinbase.jpg",
  "XPeng": "xpeng.jpg",
  "Figma": "figma.jpg",
  "Rocket Lab": "rocketlab.webp",
  "Money Forward": "moneyforward.webp",
  "Axon": "axon.webp",
  "Lumine": "lumine.jpg",
  "Fortinet": "fortinet.jpg",
  "CATL": "catl.jpg",
  "Pro Medicus": "promedicus.jpg",
  "Mercado Libre": "mercadolibre.webp",
  "Roblox": "roblox.jpg",
  "Kaspi": "kaspi.webp",
};
const sceneUrl = (company) => {
  const f = SCENE_FILES[company];
  return f ? `assets/scenes/${f}` : null;
};

// ─── Render founders into Coverflow stage ──────────────
const stage = document.getElementById("coverflow-stage");
const cards = [];
if (stage) {
  founders.forEach((f, i) => {
    const card = document.createElement("button");
    card.className = "cover-card";
    card.style.setProperty("--accent", f.accent);
    card.dataset.index = i;
    card.setAttribute("aria-label", `${f.first} ${f.last}, ${f.company}`);
    const url = portraitUrl(f.company);
    const initials = (f.first[0] + f.last[0]).toUpperCase();
    // Carousel is above the fold: eager-load the first cards (lead gets high
    // fetch priority); lazy-load the rest further along the arc.
    const imgAttrs = i < 6 ? (i === 0 ? ' fetchpriority="high"' : '') : ' loading="lazy"';
    const inner = url
      ? `<img src="${url}" alt="${f.first} ${f.last}"${imgAttrs} />`
      : `<span class="cover-card-fallback">${initials}</span>`;
    card.innerHTML = `
      ${inner}
      <span class="cover-card-tag">
        <span>${f.first} ${f.last}</span>
        <span>${f.company}</span>
      </span>
    `;
    stage.appendChild(card);
    cards.push(card);
  });
  // Cards exist now — let the stage fade in (prevents an empty-stage flash).
  stage.classList.add("cards-ready");
}

// ─── Founder detail panel ──────────────────────────────
const panel = document.getElementById("founder-panel");
const panelEls = {
  photo: document.getElementById("panel-photo"),
  scene: document.getElementById("panel-scene"),
  logo: document.getElementById("panel-logo"),
  name: document.getElementById("panel-name"),
  role: document.getElementById("panel-role"),
  founded: document.getElementById("panel-founded"),
  sector: document.getElementById("panel-sector"),
  geo: document.getElementById("panel-geo"),
  thesis: document.getElementById("panel-thesis"),
};
let activeIdx = null;

function openPanel(i) {
  const f = founders[i];
  if (!f) return;
  activeIdx = i;
  panelEls.name.textContent = `${f.first} ${f.last}`;
  panelEls.role.textContent = f.role;
  panelEls.founded.textContent = f.founded;
  panelEls.sector.textContent = f.sector;
  panelEls.geo.textContent = f.geo;
  panelEls.thesis.textContent = f.thesis;
  panelEls.photo.style.setProperty("--accent", f.accent);

  // Company logo now sits above the founder name (greyscale).
  panelEls.logo.src = logoUrl(f.company);
  panelEls.logo.alt = f.company;
  // Adjust height per-company so all logos look roughly the same visual size
  // (their source files have very different aspect ratios).
  panelEls.logo.style.height = (LOGO_HEIGHTS[f.company] || 44) + "px";

  // Photo: use the company scene shot if we have one, else the founder portrait.
  const photo = sceneUrl(f.company) || portraitUrl(f.company);
  if (photo) {
    panelEls.scene.src = photo;
    panelEls.scene.hidden = false;
  } else {
    panelEls.scene.removeAttribute("src");
    panelEls.scene.hidden = true;
  }

  panel.classList.add("open");
  panel.setAttribute("aria-hidden", "false");
  document.body.classList.add("panel-open");
}
function closePanel() {
  panel.classList.remove("open");
  panel.setAttribute("aria-hidden", "true");
  document.body.classList.remove("panel-open");
  activeIdx = null;
}
function navPanel(dir) {
  if (activeIdx === null) return;
  const n = founders.length;
  openPanel((activeIdx + dir + n) % n);
}

if (stage) {
  stage.addEventListener("click", (e) => {
    const card = e.target.closest(".cover-card");
    if (card) openPanel(Number(card.dataset.index));
  });
}
panel?.addEventListener("click", (e) => {
  if (e.target.matches("[data-close]")) closePanel();
  if (e.target.closest("[data-nav='prev']")) navPanel(-1);
  if (e.target.closest("[data-nav='next']")) navPanel(+1);
});
document.addEventListener("keydown", (e) => {
  if (!panel?.classList.contains("open")) return;
  if (e.key === "Escape") closePanel();
  if (e.key === "ArrowLeft") navPanel(-1);
  if (e.key === "ArrowRight") navPanel(+1);
});

// ─── Coverflow: scroll-driven 3D carousel ──────────────
const coverflow = document.querySelector(".coverflow");
const cfName = document.getElementById("cf-name");
const cfRole = document.getElementById("cf-role");
const cfIndex = document.getElementById("cf-index");
const cfProgress = document.getElementById("cf-progress");

if (coverflow && cards.length) {
  const total = cards.length;
  const pad2 = (n) => String(n).padStart(2, "0");
  let lastActiveInt = -1;
  let cfPos = 0;            // floating active index (0 … total-1), hover-driven

  // Tunables — feel free to adjust
  // Phones get a tighter arc so the (larger) mobile cards still show their
  // neighbours peeking in at the edges; desktop keeps the original 240.
  const SPREAD_X = matchMedia("(max-width: 560px)").matches ? 205 : 240;
  const DEPTH_Z = 160;      // px each card pushes back per step
  const ROTATE_Y = 32;      // deg rotation per step
  const FALLOFF = 0.26;     // opacity falloff per step (1 - x*FALLOFF)
  const MIN_OPACITY = 0.12;

  // Entrance: on load the cards fan out from behind the lead card. `entrance`
  // ramps 0 → 1; renderCoverflow scales each card's spread/depth/rotation and
  // the off-centre cards' opacity by it. Reduced motion jumps straight to 1.
  const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let entrance = prefersReduced ? 1 : 0;

  function renderCoverflow() {
    const active = cfPos;
    const activeInt = Math.round(active);

    for (let i = 0; i < total; i++) {
      const card = cards[i];
      const offset = i - active;
      const abs = Math.abs(offset);

      // Soft cap on far-away cards so they don't fly off-screen too aggressively
      const clamped = Math.sign(offset) * Math.min(abs, 6);

      const tx = clamped * SPREAD_X * entrance;
      const tz = -abs * DEPTH_Z * entrance;
      const ry = -clamped * ROTATE_Y * entrance;
      const base = abs > 4 ? 0 : Math.max(MIN_OPACITY, 1 - abs * FALLOFF);
      // Lead card is present from the first frame; the rest fade in as they fan out.
      const opacity = abs < 0.5 ? base : base * entrance;
      const zi = 100 - Math.round(abs * 10);

      card.style.transform =
        `translate3d(${tx.toFixed(2)}px, 0, ${tz.toFixed(2)}px) rotateY(${ry.toFixed(2)}deg)`;
      card.style.opacity = opacity.toFixed(3);
      card.style.zIndex = String(zi);
      card.style.pointerEvents = abs > 3 ? "none" : "auto";
    }

    if (activeInt !== lastActiveInt && founders[activeInt]) {
      const f = founders[activeInt];
      if (cfName) cfName.textContent = `${f.first} ${f.last}`;
      if (cfRole) cfRole.textContent = `${f.role} · ${f.company}`;
      if (cfIndex) cfIndex.textContent = `${pad2(activeInt + 1)} / ${pad2(total)}`;
      cards.forEach((c, idx) => c.classList.toggle("active", idx === activeInt));
      lastActiveInt = activeInt;
    }

    const progress = total > 1 ? active / (total - 1) : 0;
    if (cfProgress) cfProgress.style.transform = `scaleX(${progress.toFixed(4)})`;
  }

  // Set the floating position (clamped) and repaint only if it changed.
  const setPos = (p) => {
    const next = Math.max(0, Math.min(total - 1, p));
    if (next === cfPos) return;
    cfPos = next;
    renderCoverflow();
  };

  // Initial paint
  renderCoverflow();
  window.addEventListener("resize", renderCoverflow, { passive: true });

  // Play the fan-out entrance once, in step with the stage's CSS fade-in.
  if (!prefersReduced) {
    const ease = (p) => 1 - Math.pow(1 - p, 3); // easeOutCubic
    const DURATION = 900;
    const startEntrance = (t0) => {
      const step = (t) => {
        const p = Math.min(1, (t - t0) / DURATION);
        entrance = ease(p);
        renderCoverflow();
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    // Hold ~350ms so the fan-out begins with the stage fade-in (CSS delay).
    setTimeout(() => requestAnimationFrame(startEntrance), 350);
  }

  // ─── Hover-to-flick navigation ───────────────────────
  // The carousel no longer responds to page scroll. Instead the cursor's
  // horizontal distance from the centred card drives it: just past the card
  // edge it eases forward/back slowly; toward the screen edges it accelerates.
  // Direction follows the side the cursor is on (right = next, left = prev).
  const centerX = () => window.innerWidth / 2;
  const cardHalf = () => (cards[0] ? cards[0].offsetWidth : 280) / 2;

  if (!matchMedia("(prefers-reduced-motion: reduce)").matches &&
      matchMedia("(hover: hover)").matches) {
    const MIN_STEP = 0.013;  // founders/frame just past the card edge (~0.8/s)
    const MAX_STEP = 0.13;   // founders/frame at the screen edge (~8/s)
    const RAMP = 1.4;        // acceleration curve from MIN → MAX with distance
    const DEAD_PAD = 12;     // px of neutral space beyond the card edge
    let pointerX = null;
    let hoverRaf = null;

    // Run only while the carousel is on-screen and no modal is open.
    const onScreen = () => {
      const r = coverflow.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight &&
        !document.body.classList.contains("panel-open");
    };

    const tick = () => {
      if (pointerX == null || !onScreen()) { hoverRaf = null; return; }
      const cx = centerX();
      const dead = cardHalf() + DEAD_PAD;
      const dx = pointerX - cx;
      const adx = Math.abs(dx);
      if (adx > dead) {
        const reach = Math.max(1, cx - dead);
        const t = Math.min(1, (adx - dead) / reach);
        const speed = MIN_STEP + (MAX_STEP - MIN_STEP) * Math.pow(t, RAMP);
        setPos(cfPos + Math.sign(dx) * speed);
      }
      hoverRaf = requestAnimationFrame(tick);
    };

    const pin = coverflow.querySelector(".coverflow-pin") || coverflow;
    pin.addEventListener("mousemove", (e) => {
      pointerX = e.clientX;
      if (hoverRaf == null) hoverRaf = requestAnimationFrame(tick);
    }, { passive: true });
    pin.addEventListener("mouseleave", () => { pointerX = null; });
  }

  // ─── Touch: drag to flick (mobile, where hover is unavailable) ───
  if (matchMedia("(hover: none)").matches || "ontouchstart" in window) {
    const stageEl = document.getElementById("coverflow-stage") || coverflow;
    let touchX = null, touchStartPos = 0;
    stageEl.addEventListener("touchstart", (e) => {
      touchX = e.touches[0].clientX;
      touchStartPos = cfPos;
    }, { passive: true });
    stageEl.addEventListener("touchmove", (e) => {
      if (touchX == null) return;
      const dx = e.touches[0].clientX - touchX;
      const perCard = window.innerWidth / 3;   // drag this far → one founder
      setPos(touchStartPos - dx / perCard);
    }, { passive: true });
    stageEl.addEventListener("touchend", () => { touchX = null; });
  }
}

// ─── Animated counters ─────────────────────────────────
function animateCount(el) {
  const target = parseFloat(el.dataset.count);
  const decimals = parseInt(el.dataset.decimals || "0", 10);
  const unit = el.querySelector(".perf-unit, .stat-unit, .odd-unit");
  const unitHTML = unit ? unit.outerHTML : "";
  const duration = 1500;
  const start = performance.now();
  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const value = (target * eased).toFixed(decimals);
    el.innerHTML = value + unitHTML;
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const counterTargets = document.querySelectorAll("[data-count]");
const counterIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        animateCount(e.target);
        counterIO.unobserve(e.target);
      }
    });
  },
  { threshold: 0.4 }
);
counterTargets.forEach((el) => counterIO.observe(el));

// ─── Reveal on scroll ──────────────────────────────────
const reveals = document.querySelectorAll(
  ".hero-quote, .hero-attribution, .about-headline, .about-stat, .pillar, .advantage-intro, .advantage-card, .advantage-stats-text, .stat-box, .insights-text, .insights-list, .contact-headline, .contact-email, .coverflow-head"
);
reveals.forEach((el) => el.classList.add("reveal"));

const revealIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        revealIO.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12 }
);
reveals.forEach((el) => revealIO.observe(el));

// ─── Odds: single-row active (closest to viewport center) ──
const odds = Array.from(document.querySelectorAll(".odd"));
if (odds.length) {
  let lastActiveOdd = -1;
  let oddsTicking = false;

  function updateActiveOdd() {
    const vpCenter = window.innerHeight / 2;
    let closest = -1;
    let minDist = Infinity;
    for (let i = 0; i < odds.length; i++) {
      const r = odds[i].getBoundingClientRect();
      // Only consider rows visible in the viewport
      if (r.bottom < 0 || r.top > window.innerHeight) continue;
      const c = r.top + r.height / 2;
      const d = Math.abs(c - vpCenter);
      if (d < minDist) {
        minDist = d;
        closest = i;
      }
    }
    if (closest !== lastActiveOdd) {
      odds.forEach((el, i) => el.classList.toggle("active", i === closest));
      lastActiveOdd = closest;
    }
    oddsTicking = false;
  }

  const onOddsScroll = () => {
    if (!oddsTicking) {
      requestAnimationFrame(updateActiveOdd);
      oddsTicking = true;
    }
  };

  updateActiveOdd();
  window.addEventListener("scroll", onOddsScroll, { passive: true });
  window.addEventListener("resize", onOddsScroll, { passive: true });
}

// ─── Founder-led performance chart ────────────────────
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
      // Adjust padding for narrow screens
      PAD_L = W < 500 ? 48 : 64;
      PAD_R = W < 500 ? 90 : 130;
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
    for (var yr = 2006; yr <= 2026; yr += 2) {
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

      // "Founder-led Stocks*"
      ctx.font = "10px 'Formata Light', sans-serif";
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      var subY = fEndY + 8;
      ctx.fillText("Founder-led", endX, subY);
      ctx.fillText("Stocks", endX, subY + 14);

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

      // "All Stocks*"
      ctx.font = "10px 'Formata Light', sans-serif";
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

// ─── Hero glow + shape parallax ──────────────────────
const heroEl = document.querySelector("[data-hero-stage]") || document.querySelector(".hero");
const glow = document.querySelector(".hero-glow");
const shapes = document.querySelectorAll(".hero-shape");
if (heroEl && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  let raf = null;
  let introDone = false;
  setTimeout(() => { introDone = true; }, 3200);
  heroEl.addEventListener("mousemove", (e) => {
    if (!introDone) return;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      const r = heroEl.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      if (glow) glow.style.transform = "translate(" + (x * 12) + "px, " + (y * 8) + "px)";
      shapes.forEach((s, i) => {
        const d = i === 0 ? 18 : -22;
        s.style.transform = "rotate(45deg) translate(" + (x * d) + "px, " + (y * d) + "px)";
      });
      raf = null;
    });
  });
  heroEl.addEventListener("mouseleave", () => {
    if (glow) glow.style.transform = "";
    shapes.forEach((s) => (s.style.transform = "rotate(45deg)"));
  });
}

// ─── Hero ripple (interactive water surface) ───────────
(function initRipple() {
  const hero = document.querySelector("[data-hero-stage]") || document.querySelector(".hero");
  const canvas = document.getElementById("hero-ripple");
  if (!hero || !canvas) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const ctx = canvas.getContext("2d");
  const ripples = [];
  let dpr = window.devicePixelRatio || 1;
  let lastSpawn = 0;
  let lastInteraction = performance.now();
  let isVisible = true;

  // Brand accent #b8935a as RGB
  const R = 184, G = 147, B = 90;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    const rect = hero.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize, { passive: true });
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(hero);

  function spawn(x, y, opts) {
    opts = opts || {};
    const intensity = opts.intensity != null ? opts.intensity : 1;
    const rings = opts.rings != null ? opts.rings : 2;
    const baseRadius = 220 * intensity;
    const baseAlpha = (opts.alpha != null ? opts.alpha : 0.07) * intensity;
    for (let i = 0; i < rings; i++) {
      ripples.push({
        x: x,
        y: y,
        born: performance.now() + i * 180,
        duration: 2800 + i * 350,
        maxR: baseRadius + i * 70,
        alpha: Math.max(0.03, baseAlpha - i * 0.018),
        width: Math.max(0.6, 1.3 - i * 0.18),
      });
    }
  }

  hero.addEventListener("mousemove", (e) => {
    const now = performance.now();
    lastInteraction = now;
    if (now - lastSpawn < 320) return;
    lastSpawn = now;
    const rect = hero.getBoundingClientRect();
    spawn(e.clientX - rect.left, e.clientY - rect.top, { intensity: 1 });
  });

  hero.addEventListener("click", (e) => {
    const rect = hero.getBoundingClientRect();
    lastInteraction = performance.now();
    spawn(e.clientX - rect.left, e.clientY - rect.top, {
      intensity: 1.6,
      rings: 4,
      alpha: 0.11,
    });
  });

  // Ambient drops when cursor is idle so the surface stays alive
  setInterval(() => {
    if (!isVisible) return;
    if (performance.now() - lastInteraction < 2200) return;
    const rect = hero.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    spawn(
      Math.random() * rect.width,
      rect.height * 0.1 + Math.random() * rect.height * 0.8,
      { intensity: 0.5, rings: 2, alpha: 0.055 }
    );
  }, 4800);

  // Pause when the hero is off-screen
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) => entries.forEach((e) => (isVisible = e.isIntersecting))
    ).observe(hero);
  }

  function tick() {
    const now = performance.now();
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    ctx.clearRect(0, 0, w, h);

    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      const elapsed = now - r.born;
      if (elapsed < 0) continue;
      if (elapsed > r.duration) {
        ripples.splice(i, 1);
        continue;
      }
      const t = elapsed / r.duration;
      const eased = 1 - Math.pow(1 - t, 3);  // ease-out cubic
      const radius = r.maxR * eased;
      const alpha = r.alpha * (1 - t * t);   // ease-in fade
      ctx.beginPath();
      ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${R}, ${G}, ${B}, ${alpha.toFixed(3)})`;
      ctx.lineWidth = r.width;
      ctx.stroke();
    }
    requestAnimationFrame(tick);
  }
  tick();
})();

// ─── Header: transparent over hero, opaque elsewhere ───
// (The founders hero is light, so the header keeps its normal dark text.)
const heroForHeader = document.querySelector(".hero");
if (heroForHeader) {
  const headerIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        document.body.classList.toggle("over-hero", e.isIntersecting);
      });
    },
    {
      // Shrink the top of the viewport by ~header height so the swap happens
      // as the hero's bottom crosses just below the header.
      rootMargin: "-90px 0px 0px 0px",
      threshold: 0,
    }
  );
  headerIO.observe(heroForHeader);
  // Set initial state (hero is visible at top of page)
  document.body.classList.add("over-hero");
}

// ─── Hero video: diffuse → cinema → release ────────────
const video = document.querySelector(".hero-video");
const heroSection = document.querySelector(".hero");
const cinemaOverlay = document.getElementById("cinema-overlay");
if (video && heroSection) {
  let ticking = false;
  const smoothstep = (t) => t * t * (3 - 2 * t);

  const updateVideo = () => {
    const vh = window.innerHeight || 1;
    const vc = vh / 2;
    const heroRect = heroSection.getBoundingClientRect();
    const heroH = heroSection.offsetHeight || 1;
    const videoRect = video.getBoundingClientRect();
    const videoCenter = videoRect.top + videoRect.height / 2;
    const distFromCenter = videoCenter - vc;  // +ve = below centre, -ve = above
    const absDist = Math.abs(distFromCenter);

    // Entry progress: 0 at top of page (video hidden), ramps up only
    // once the user actually scrolls into the hero. Reaches 1 by ~35%
    // of the hero's scroll-out distance.
    const scrolled = Math.max(0, -heroRect.top);
    const entryT = Math.max(0, Math.min(1, (scrolled - 40) / (heroH * 0.35)));
    const entry = smoothstep(entryT);

    // Cinema progress: widened so dimming engages earlier as the video
    // climbs into view; still peaks at 1 when centred.
    const cinemaT = Math.max(0, 1 - absDist / (vh * 0.65));
    const cinema = smoothstep(cinemaT);

    // Blur clears well before the video reaches the middle.
    // Fully clear once the video centre is within ~18% of viewport centre.
    const BLUR_CLEAR  = vh * 0.18;  // distance at which blur reaches 0
    const BLUR_FULL   = vh * 0.55;  // distance at which blur is at max
    const blurT = distFromCenter > BLUR_CLEAR
      ? Math.min(1, (distFromCenter - BLUR_CLEAR) / (BLUR_FULL - BLUR_CLEAR))
      : 0;
    const blurAmount = blurT * 7;  // max blur reduced from 10 → 7

    // Scale: 0.96 base → 1.0 (entry) → 1.10 (cinema peak)
    const scale = 0.96 + 0.04 * entry + 0.10 * cinema;

    // Y offset eases up during entry
    const ty = (1 - entry) * 80;

    video.style.opacity = entry.toFixed(3);
    video.style.transform = `translateY(${ty.toFixed(2)}px) scale(${scale.toFixed(3)})`;
    video.style.filter = `blur(${blurAmount.toFixed(2)}px)`;

    if (cinemaOverlay) {
      cinemaOverlay.style.opacity = (cinema * 0.7).toFixed(3);
    }

    ticking = false;
  };
  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(updateVideo);
      ticking = true;
    }
  };
  updateVideo();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });

  const videoEl = video.querySelector(".hero-video-el");
  if (videoEl) {
    const start = () => {
      videoEl.controls = true;
      video.classList.add("is-playing");
      videoEl.play();
    };
    video.addEventListener("click", start, { once: true });
    video.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        video.click();
      }
    });

    const videoIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!video.classList.contains("is-playing")) return;
        if (e.isIntersecting) {
          videoEl.play();
        } else {
          videoEl.pause();
        }
      });
    }, { threshold: 0.1 });
    videoIO.observe(video);
  }
}
