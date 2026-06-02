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
    first: "Elon", last: "Musk", company: "Tesla",
    role: "Co-founder & CEO", founded: "2003", sector: "EVs & Energy",
    geo: "United States", accent: "#cc1f2e",
    thesis: "The most consequential industrial founder of his generation — a vertical integrator who turned electric vehicles, energy storage and autonomy into a single compounding flywheel."
  },
  {
    first: "Jensen", last: "Huang", company: "Nvidia",
    role: "Co-founder & CEO", founded: "1993", sector: "AI Compute",
    geo: "United States", accent: "#76b900",
    thesis: "Three decades of compounding without selling a share. The accelerator-computing platform he willed into existence now underwrites the entire AI build-out."
  },
  {
    first: "Alex", last: "Karp", company: "Palantir",
    role: "Co-founder & CEO", founded: "2003", sector: "Defense AI",
    geo: "United States", accent: "#0a1a2f",
    thesis: "Long-duration software for the institutions that matter most. Karp's intellectual independence and mission orientation produce a workforce — and a product — competitors can't replicate."
  },
  {
    first: "Brian", last: "Armstrong", company: "Coinbase",
    role: "Co-founder & CEO", founded: "2012", sector: "Crypto",
    geo: "United States", accent: "#0052ff",
    thesis: "The most regulated, most trusted on-ramp to digital assets. A founder who has earned the right to lead the category through every cycle."
  },
  {
    first: "He", last: "Xiaopeng", company: "XPeng",
    role: "Co-founder & CEO", founded: "2014", sector: "EVs & Autonomy",
    geo: "China", accent: "#0a8de8",
    thesis: "Software-first EV native with the highest-rated assisted-driving stack in China. Iteration speed and engineering culture set XPeng apart from the legacy auto cohort."
  },
  {
    first: "Dylan", last: "Field", company: "Figma",
    role: "Co-founder & CEO", founded: "2012", sector: "Design Software",
    geo: "United States", accent: "#a259ff",
    thesis: "Collaborative design as default. A founder with an unusually long horizon who turned down the largest software deal ever to keep building."
  },
  {
    first: "Peter", last: "Beck", company: "Rocket Lab",
    role: "Founder & CEO", founded: "2006", sector: "Space",
    geo: "New Zealand / USA", accent: "#e63312",
    thesis: "From garage tinkerer to the second most prolific Western launch provider. Now moving up-stack into spacecraft — a vertical integrator in the making."
  },
  {
    first: "Yosuke", last: "Tsuji", company: "Money Forward",
    role: "Founder & CEO", founded: "2012", sector: "Fintech",
    geo: "Japan", accent: "#0099a8",
    thesis: "Japan's leading household-finance and SaaS-for-SMB platform. A founder rebuilding the country's financial plumbing for a digital generation."
  },
  {
    first: "Rick", last: "Smith", company: "Axon",
    role: "Co-founder & CEO", founded: "1993", sector: "Public Safety",
    geo: "United States", accent: "#fdb414",
    thesis: "From Taser to a category-defining public-safety software platform. Razor-and-blades hardware funds a recurring software business with extraordinary stickiness."
  },
  {
    first: "David", last: "Nyland", company: "Lumine",
    role: "President & CEO", founded: "2023", sector: "Vertical Software",
    geo: "Canada", accent: "#1d3e75",
    thesis: "The Constellation-Software playbook applied to communications & media software. Decentralised, founder-respecting M&A with a multi-decade reinvestment runway."
  },
  {
    first: "Ken", last: "Xie", company: "Fortinet",
    role: "Founder, Chair & CEO", founded: "2000", sector: "Cybersecurity",
    geo: "United States", accent: "#ee3124",
    thesis: "Founder-built ASIC advantage in network security. Ken still owns a meaningful stake and runs the company with the discipline of an owner-operator."
  },
  {
    first: "Robin", last: "Zeng", company: "CATL",
    role: "Founder & Chair", founded: "2011", sector: "Batteries",
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
    role: "Co-founder & CEO", founded: "1999", sector: "E-commerce & Fintech",
    geo: "Latin America", accent: "#ffe600",
    thesis: "The Amazon-plus-PayPal of Latin America under a founder who has out-executed every regional and global challenger for 25 years."
  },
  {
    first: "David", last: "Baszucki", company: "Roblox",
    role: "Co-founder & CEO", founded: "2004", sector: "Gaming Platforms",
    geo: "United States", accent: "#e2241a",
    thesis: "The platform on which a generation creates, plays and increasingly earns. A 20-year founder still treating it like year one."
  }
];

// Map company → portrait filename in assets/founders/ (null = no portrait)
const PORTRAIT_FILES = {
  "Tesla": "elon.png",
  "Nvidia": "jensen.png",
  "Palantir": "alex.png",
  "Coinbase": "brian.png",
  "XPeng": "xiaopeng.png",
  "Figma": "dylan.png",
  "Rocket Lab": "peter.png",
  "Money Forward": "yosuke.png",
  "Axon": "rick.png",
  "Lumine": "nyland.png",
  "Fortinet": "ken.png",
  "CATL": "robin.png",
  "Pro Medicus": "sam.png",
  "Mercado Libre": "marcos.png",
  "Roblox": "baszucki.png",
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
};
const logoUrl = (company) =>
  `assets/companies/${encodeURIComponent(LOGO_FILES[company] || "").replace(/%2F/g, "/")}`;

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
    const inner = url
      ? `<img src="${url}" alt="${f.first} ${f.last}" loading="lazy" />`
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
}

// ─── Founder detail panel ──────────────────────────────
const panel = document.getElementById("founder-panel");
const panelEls = {
  photo: document.getElementById("panel-photo"),
  company: document.getElementById("panel-company"),
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
  panelEls.company.textContent = f.company;
  panelEls.name.textContent = `${f.first} ${f.last}`;
  panelEls.role.textContent = f.role;
  panelEls.founded.textContent = f.founded;
  panelEls.sector.textContent = f.sector;
  panelEls.geo.textContent = f.geo;
  panelEls.thesis.textContent = f.thesis;
  panelEls.photo.style.setProperty("--accent", f.accent);
  // Update logo image in panel
  let img = panelEls.photo.querySelector("img.panel-logo");
  if (!img) {
    img = document.createElement("img");
    img.className = "panel-logo";
    img.alt = "";
    panelEls.photo.appendChild(img);
  }
  img.src = logoUrl(f.company);
  img.alt = f.company;

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
  let cfTicking = false;
  let lastActiveInt = -1;

  // Tunables — feel free to adjust
  const SPREAD_X = 240;     // px between adjacent cards on the arc
  const DEPTH_Z = 160;      // px each card pushes back per step
  const ROTATE_Y = 32;      // deg rotation per step
  const FALLOFF = 0.26;     // opacity falloff per step (1 - x*FALLOFF)
  const MIN_OPACITY = 0.12;

  function updateCoverflow() {
    const rect = coverflow.getBoundingClientRect();
    const scrollable = coverflow.offsetHeight - window.innerHeight;
    const progress = scrollable > 0
      ? Math.max(0, Math.min(1, -rect.top / scrollable))
      : 0;

    const active = progress * (total - 1);
    const activeInt = Math.round(active);

    for (let i = 0; i < total; i++) {
      const card = cards[i];
      const offset = i - active;
      const abs = Math.abs(offset);

      // Soft cap on far-away cards so they don't fly off-screen too aggressively
      const clamped = Math.sign(offset) * Math.min(abs, 6);

      const tx = clamped * SPREAD_X;
      const tz = -abs * DEPTH_Z;
      const ry = -clamped * ROTATE_Y;
      const opacity = abs > 4 ? 0 : Math.max(MIN_OPACITY, 1 - abs * FALLOFF);
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

    if (cfProgress) cfProgress.style.transform = `scaleX(${progress.toFixed(4)})`;
    cfTicking = false;
  }

  const onCfScroll = () => {
    if (!cfTicking) {
      requestAnimationFrame(updateCoverflow);
      cfTicking = true;
    }
  };

  // Initial paint
  updateCoverflow();
  window.addEventListener("scroll", onCfScroll, { passive: true });
  window.addEventListener("resize", onCfScroll, { passive: true });
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

// ─── Hero shape parallax ───────────────────────────────
const heroEl = document.querySelector(".hero");
const shapes = document.querySelectorAll(".hero-shape");
if (heroEl && shapes.length && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  let raf = null;
  heroEl.addEventListener("mousemove", (e) => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      const r = heroEl.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      shapes.forEach((s, i) => {
        const depth = i === 0 ? 18 : -22;
        s.style.transform = `rotate(45deg) translate(${x * depth}px, ${y * depth}px)`;
      });
      raf = null;
    });
  });
  heroEl.addEventListener("mouseleave", () => {
    shapes.forEach((s) => (s.style.transform = "rotate(45deg)"));
  });
}

// ─── Hero ripple (interactive water surface) ───────────
(function initRipple() {
  const hero = document.querySelector(".hero");
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

  video.addEventListener("click", () => {
    const cap = video.querySelector(".hero-video-caption");
    if (cap) cap.textContent = "Drop an <iframe> in .hero-video-thumb when ready.";
  });
}
