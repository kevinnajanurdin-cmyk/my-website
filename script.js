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
// Deck order: the carousel opens on the MIDDLE card so the fan is symmetric —
// cards spread evenly left and right instead of trailing off to one side (see
// `cfPos` in the coverflow block). Jensen Huang, the founder we lead with, is
// therefore placed at the centre index rather than first; everyone else keeps
// their relative order. Move a founder here and the opening card moves with it.
const founders = [
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
    thesis: "Zeng combined chemistry innovation, simpler battery packs and enormous manufacturing scale to cut the cost of energy storage, helping electric vehicles compete with petrol cars on price and performance."
  },
  {
    first: "Sam", last: "Hupert", company: "Pro Medicus",
    role: "Co-founder & CEO", founded: "1983", sector: "MedTech",
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
    role: "Co-founder & CEO", founded: "2004", sector: "Digital Media",
    geo: "United States", accent: "#e2241a",
    thesis: "Baszucki built Roblox as a platform rather than a collection of games, giving users the tools to create experiences, attract audiences and earn from the worlds they build."
  },
  {
    // ── Centre of the deck: the card the carousel opens on ──
    first: "Jensen", last: "Huang", company: "Nvidia",
    role: "Co-founder & CEO", founded: "1993", sector: "AI Hardware",
    geo: "United States", accent: "#76b900",
    thesis: "Three decades of compounding without selling a share. The accelerated-computing platform he willed into existence now underwrites the entire AI build-out."
  },
  {
    first: "Alex", last: "Karp", company: "Palantir",
    role: "Co-founder & CEO", founded: "2003", sector: "AI Platforms",
    geo: "United States", accent: "#0a1a2f",
    thesis: "Karp built Palantir to turn a company’s scattered data into a working model of its operations, allowing employees to understand what is happening, decide what to do and act through one system."
  },
  {
    first: "Brian", last: "Armstrong", company: "Coinbase",
    role: "Co-founder & CEO", founded: "2012", sector: "FinTech",
    geo: "United States", accent: "#0052ff",
    thesis: "Armstrong chose regulation when much of crypto ran offshore, giving institutions the custody, compliance and infrastructure needed to bring blockchain assets into mainstream finance."
  },
  {
    first: "Elon", last: "Musk", company: "Tesla", company2: "SpaceX",
    role: "Co-founder & CEO", founded: "2003 · 2002", sector: "Robotics · Space",
    geo: "United States", accent: "#cc1f2e",
    thesis: "Musk made electric cars desirable and rockets reusable by rebuilding both industries around first-principles engineering, vertical integration and relentless reductions in cost."
  },
  {
    first: "He", last: "Xiaopeng", company: "XPeng",
    role: "Co-founder & CEO", founded: "2014", sector: "Robotics",
    geo: "China", accent: "#0a8de8",
    thesis: "He Xiaopeng built XPeng like a technology company rather than a traditional carmaker, using software, AI and rapid iteration to improve the vehicle long after it leaves the factory."
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
    thesis: "Beck turned a rocket built in a garage into a reliable launch service, then expanded into the satellites and systems needed to run complete space missions."
  },
  {
    first: "Yosuke", last: "Tsuji", company: "Money Forward",
    role: "Founder & CEO", founded: "2012", sector: "FinTech",
    geo: "Japan", accent: "#0099a8",
    thesis: "Japan's leading household-finance and SaaS-for-SMB platform. A founder rebuilding the country's financial plumbing for a digital generation."
  },
  {
    first: "Mikheil", last: "Lomtadze", company: "Kaspi",
    role: "Co-founder & CEO", founded: "2006", sector: "Ecommerce",
    geo: "Kazakhstan", accent: "#f14635",
    thesis: "Lomtadze turned a regional bank into Kazakhstan’s dominant everyday app by combining payments, shopping and personal finance in one place, making Kaspi part of how millions live and transact."
  }
];

// Map company → portrait filename in assets/founders/ (null = no portrait)
const PORTRAIT_FILES = {
  "Tesla": "elon.webp",  // transparent cutout (from elon.png master) — keep alpha, never JPG
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
  "SpaceX": "spacex.svg",
};
const logoUrl = (company) =>
  `assets/companies/${encodeURIComponent(LOGO_FILES[company] || "").replace(/%2F/g, "/")}`;

// Per-company override of the panel logo's default CSS filter
// (grayscale(1) brightness(0) opacity(.7), see .panel-logo). brightness(0)
// flattens solid-shape logos into blobs — Mercado Libre's oval loses its
// handshake — so such logos get a luminance-preserving grayscale instead.
const LOGO_FILTERS = {
  "Mercado Libre": "grayscale(1) contrast(1.05) opacity(0.85)",
};

// Per-company render height (px). All logo files are trimmed to their content
// bounds (no baked-in whitespace — keep it that way when replacing a file), so
// these heights size the visible mark directly. Values follow an equal-area
// rule (height ≈ √(3800 / aspect-ratio)) so every logo carries the same
// optical mass, with small nudges for ink density (dense filled marks read
// heavier, so they sit slightly below the formula).
const LOGO_HEIGHTS = {
  "Tesla":         58,   // T + TESLA stacked (tall, dense mark)
  "Mercado Libre": 58,   // oval + wordmark stacked (light grey interior)
  "Money Forward": 50,   // icon + text stacked
  "Nvidia":        52,   // eye mark + wordmark
  "XPeng":         52,   // icon + wordmark stacked
  "Figma":         32,   // logomark + wordmark inline
  "Roblox":        26,   // wordmark + tilted badge
  "Rocket Lab":    36,   // wordmark
  "Palantir":      30,   // wordmark
  "Axon":          30,   // wordmark
  "CATL":          27,   // wordmark (dense)
  "Pro Medicus":   26,   // wordmark
  "Coinbase":      26,   // wordmark
  "Lumine":        24,   // wide wordmark (dense)
  "Fortinet":      21,   // very wide wordmark
  "Kaspi":         50,   // filled disc, stencil cutouts (dense)
  "SpaceX":        21,   // very wide wordmark (aspect ~8.1, same class as Fortinet)
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

// Map company → 24s ambient loop in assets/scenes/ (poster = the scene still).
// Companies without a clip yet (Money Forward, Pro Medicus) fall back to the
// scene still.
const SCENE_VIDEO_FILES = {
  "Tesla": "tesla.mp4",
  "Nvidia": "nvidia.mp4",
  "Palantir": "palantir.mp4",
  "Coinbase": "coinbase.mp4",
  "XPeng": "xpeng.mp4",
  "Figma": "figma.mp4",
  "Rocket Lab": "rocketlab.mp4",
  "Axon": "axon.mp4",
  "Lumine": "lumine.mp4",
  "Fortinet": "fortinet.mp4",
  "CATL": "catl.mp4",
  "Mercado Libre": "mercadolibre.mp4",
  "Roblox": "roblox.mp4",
  "Kaspi": "kaspi.mp4",
};
const sceneVideoUrl = (company) => {
  const f = SCENE_VIDEO_FILES[company];
  if (!f) return null;
  // On WordPress the videos live in the Media Library (not the theme — they'd
  // triple the zip); functions.php injects window.ZILLER_SCENE_VIDEOS mapping
  // filename → uploaded URL. Statically, the files sit in assets/scenes/.
  const map = typeof window !== "undefined" && window.ZILLER_SCENE_VIDEOS;
  if (map) return map[f] || null;
  return `assets/scenes/${f}`;
};

// YouTube scene embeds — copyright-safe alternative to self-hosted clips: the
// footage streams from YouTube's own player under the rights-holder's upload
// (they keep views and control embeddability; nothing is re-hosted by us).
// Styled to match the ambient loops: no controls, muted autoplay loop,
// oversized + cropped, pointer-events off, and revealed only after YouTube's
// title overlay has faded. Companies here take priority over SCENE_VIDEO_FILES.
// `zoom` oversizes the player beyond cover-fit; `biasY` is the share of the
// vertical overflow cropped at the TOP (0.5 = centred; lower keeps the upper
// region), `biasX` the share cropped at the LEFT. `start` is whole seconds.
// The DEFAULT zoom (1.32, centred) crops ~12% off the top and bottom of the
// player — enough to keep YouTube's title band (top-left), watch-later/share
// (top-right) and the bottom gradient/watermark permanently out of frame, so
// the video reads clean from second zero with NO cover delay. Per-video
// entries push further where the footage itself has burned-in subtitles or
// letterbox bars (keeping the top crop ≥ ~12% so the title stays hidden).
const SCENE_YOUTUBE = {
  "Nvidia":        { id: "1la6fMl7xNA", start: 0, zoom: 1.45, biasY: 0.4 },  // caption chips bottom
  "Tesla":         { id: "T43sbhCKvBY", start: 14 },
  "Coinbase":      { id: "Gxr-ViBuHB8", start: 7 },               // skip the typed "update required" intro
  "Palantir":      { id: "I7siZgE533E", start: 15 },
  "Lumine":        { id: "oMKR10UfxNQ", zoom: 1.38 },             // letterboxed upload — crop past the bars
  "Fortinet":      { id: "o0btrmZcmGI" },
  "Kaspi":         { id: "Gbw18iKpqP8", start: 2, zoom: 1.6, biasY: 0.35, biasX: 0.7 }, // subs bottom, watermark top-left
  "Roblox":        { id: "VL6rYNmfrjM", start: 5 },               // skip the "1989" title card
  "Figma":         { id: "IVON-e6gOG8", start: 3 },
  "CATL":          { id: "Z75mVvU7MPQ", zoom: 1.5, biasY: 0.38 }, // subtitles at the bottom
  "Axon":          { id: "WbA2M9z7mh8", start: 4 },               // skip the logo-on-black intro
  "Mercado Libre": { id: "tniyxhRQSW8" },                          // letterbox bars covered by the default crop
  "Rocket Lab":    { id: "4aJ5NPt5fSM", start: 37 },              // same film as the old cut: pad-at-sunset → liftoff
  "XPeng":         { id: "0bHjqkX_ZRI", start: 1, zoom: 1.4, biasY: 0.44 }, // spec text at the bottom
};

// Poster = the video's own FIRST FRAME (assets/scenes/posters/, theme asset).
// Using the scene still here caused a visible flash: the stills are framed
// differently from the (cropped/re-cut) videos, so the poster→video swap
// jumped. A first-frame poster makes that transition pixel-continuous.
const scenePosterUrl = (company) => {
  const f = SCENE_VIDEO_FILES[company];
  return f ? `assets/scenes/posters/${f.replace(/\.mp4$/, ".webp")}` : null;
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
    card.setAttribute("aria-label", `${f.first} ${f.last}, ${f.company}${f.company2 ? " and " + f.company2 : ""}`);
    const url = portraitUrl(f.company);
    const initials = (f.first[0] + f.last[0]).toUpperCase();
    // Carousel is above the fold: eager-load the cards visible in the opening
    // fan (the centred card gets high fetch priority); lazy-load the rest
    // further along the arc. The fan opens CENTRED (see START_INDEX below), so
    // this window is measured from the middle of the deck, not from index 0 —
    // renderCoverflow() hides anything more than 4 steps from the centre.
    const cardDist = Math.abs(i - Math.floor((founders.length - 1) / 2));
    const imgAttrs = cardDist <= 4 ? (cardDist === 0 ? ' fetchpriority="high"' : '') : ' loading="lazy"';
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
  video: document.getElementById("panel-video"),
  logo2: document.getElementById("panel-logo-2"),
  logo: document.getElementById("panel-logo"),
  name: document.getElementById("panel-name"),
  role: document.getElementById("panel-role"),
  founded: document.getElementById("panel-founded"),
  sector: document.getElementById("panel-sector"),
  geo: document.getElementById("panel-geo"),
  thesis: document.getElementById("panel-thesis"),
};
let activeIdx = null;
// Assigned by the coverflow block below; glides the carousel to an index so
// the stage behind the panel follows the panel's PREV/NEXT navigation.
let coverflowGlideTo = null;

function openPanel(i) {
  const f = founders[i];
  if (!f) return;
  activeIdx = i;
  if (coverflowGlideTo) coverflowGlideTo(i);
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
  // Filter override for logos the default brightness(0) would flatten.
  panelEls.logo.style.filter = LOGO_FILTERS[f.company] || "";
  // Optional second company (Elon: Tesla + SpaceX) — same treatment.
  if (panelEls.logo2) {
    if (f.company2) {
      panelEls.logo2.src = logoUrl(f.company2);
      panelEls.logo2.alt = f.company2;
      panelEls.logo2.style.height = (LOGO_HEIGHTS[f.company2] || 44) + "px";
      panelEls.logo2.style.filter = LOGO_FILTERS[f.company2] || "";
      panelEls.logo2.hidden = false;
    } else {
      panelEls.logo2.removeAttribute("src");
      panelEls.logo2.hidden = true;
    }
  }

  // Photo: YouTube embed if mapped, else ambient video loop (first-frame
  // poster), else the scene still, else the founder portrait. Reduced-motion
  // users always get the still.
  const photo = sceneUrl(f.company) || portraitUrl(f.company);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const embed = reduced ? null : SCENE_YOUTUBE[f.company];
  const video = reduced ? null : sceneVideoUrl(f.company);
  stopPanelVideo();
  if (embed) {
    // If this founder's player was PRE-WARMED (already mounted and counting
    // down behind the closed panel), adopt it as-is — its reveal countdown,
    // or even its finished reveal, carries over so the panel opens with
    // little or no wait. Otherwise mount fresh, still covering until playback.
    const adopted = mountedEmbedId === embed.id;
    if (!adopted) stopPanelEmbed();
    panelEls.video.hidden = true;
    if (photo) {
      panelEls.scene.src = photo;
      panelEls.scene.hidden = false;
    } else {
      panelEls.scene.removeAttribute("src");
      panelEls.scene.hidden = true;
    }
    if (!adopted) startPanelEmbed(embed);
  } else if (video) {
    stopPanelEmbed();
    const poster = scenePosterUrl(f.company) || photo;
    if (poster) panelEls.video.poster = poster;
    panelEls.video.src = video;
    panelEls.video.hidden = false;
    panelEls.scene.hidden = true;
    panelEls.video.muted = true; // re-assert for programmatic src swaps
    // The autoplay attribute starts playback once data arrives; the explicit
    // play() covers browsers that ignore autoplay after a programmatic src
    // swap, and the canplay retry covers play() racing the load.
    panelEls.video.play().catch(() => {});
    panelEls.video.addEventListener(
      "canplay",
      () => { if (panelEls.video.paused) panelEls.video.play().catch(() => {}); },
      { once: true }
    );
  } else if (photo) {
    stopPanelEmbed();
    panelEls.scene.src = photo;
    panelEls.scene.hidden = false;
  } else {
    stopPanelEmbed();
    panelEls.scene.removeAttribute("src");
    panelEls.scene.hidden = true;
  }

  panel.classList.add("open");
  panel.setAttribute("aria-hidden", "false");
  document.body.classList.add("panel-open");
}
function stopPanelVideo() {
  if (!panelEls.video || panelEls.video.hidden) return;
  panelEls.video.pause();
  panelEls.video.removeAttribute("src"); // abort any in-flight download
  panelEls.video.load();
  panelEls.video.hidden = true;
}

// ── YouTube scene embed (see SCENE_YOUTUBE) ─────────────
// The ONLY way to hide YouTube's startup chrome (center play/pause/skip
// controls, title) is to cover the player until that chrome auto-hides —
// it can't be removed by any parameter, cropped away (it's dead-centre), or
// killed via the API. So: the player mounts VISIBLE but under the opaque
// scene still (higher z-index); it plays underneath; once it has played
// continuously long enough for the chrome to auto-hide, the still fades out
// onto clean, already-moving footage. PRE-WARM (below) runs that countdown
// while the visitor browses the carousel, so opening the centred card is
// usually instant instead of a cold wait. pointer-events stay off so hover
// or click can never resummon chrome.
let embedRevealTimer = null;
let embedNudgeTimers = [];
let embedHandshake = null;
let embedMsgHandler = null;
let mountedEmbedId = null; // id of the player currently mounted in the panel
const EMBED_REVEAL_MS = 5000; // continuous-play time before the still lifts
function startPanelEmbed(embed) {
  const box = document.querySelector(".founder-panel-photo");
  if (!box) return;
  let wrap = document.getElementById("panel-embed");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.id = "panel-embed";
    wrap.className = "panel-embed";
    box.appendChild(wrap);
  }
  // Cover-fit the 16:9 player into the box; per-video zoom/bias also crops the
  // VIDEO's own content (letterbox bars, burned-in subtitles).
  const zoom = embed.zoom || 1.32;
  const biasY = embed.biasY === undefined ? 0.5 : embed.biasY;
  const biasX = embed.biasX === undefined ? 0.5 : embed.biasX;
  const h = Math.max(box.clientHeight, box.clientWidth * 9 / 16) * zoom;
  const w = h * 16 / 9;
  const iframe = document.createElement("iframe");
  iframe.width = Math.round(w);
  iframe.height = Math.round(h);
  iframe.style.width = w.toFixed(1) + "px";
  iframe.style.height = h.toFixed(1) + "px";
  iframe.style.left = (-(w - box.clientWidth) * biasX).toFixed(1) + "px";
  iframe.style.top = (-(h - box.clientHeight) * biasY).toFixed(1) + "px";
  iframe.setAttribute("allow", "autoplay; encrypted-media");
  iframe.setAttribute("title", "");
  iframe.setAttribute("aria-hidden", "true"); // decorative ambient footage
  iframe.tabIndex = -1;
  iframe.src =
    `https://www.youtube-nocookie.com/embed/${embed.id}` +
    `?autoplay=1&mute=1&controls=0&loop=1&playlist=${embed.id}` +
    `&rel=0&iv_load_policy=3&playsinline=1&disablekb=1&fs=0` +
    `&enablejsapi=1&origin=${encodeURIComponent(location.origin)}` +
    (embed.start ? `&start=${embed.start}` : "");
  wrap.replaceChildren(iframe);
  mountedEmbedId = embed.id;

  let errored = false;
  let armed = false;         // reveal timer scheduled
  let lastState = -1;        // player's latest reported state
  let resumeAttempts = 0;    // capped auto-resume budget for the pause guard
  const post = (msg) => {
    try { iframe.contentWindow.postMessage(JSON.stringify(msg), "*"); } catch {}
  };
  embedMsgHandler = (e) => {
    if (!/youtube/.test(e.origin) || e.source !== iframe.contentWindow) return;
    try {
      const d = JSON.parse(e.data);
      if (d.event === "onError") errored = true;
      if (!d.info || d.info.playerState === undefined) return;
      lastState = d.info.playerState;
      // Reveal only if the player is STILL playing when the timer fires — a
      // latch on the first playing signal could reveal a player paused in the
      // meantime (= the big play glyph).
      if (!armed && !errored && lastState === 1) {
        armed = true;
        embedRevealTimer = setTimeout(() => {
          if (lastState === 1 && !errored) panelEls.scene.classList.add("cover-fade");
          armed = false;
        }, EMBED_REVEAL_MS);
      }
      // Pause guard: if anything pauses the player (extensions, battery saver,
      // media suspension) re-cover with the still and command a resume (capped
      // so a hard-blocked player converges to the clean still, not a fight).
      // 2 = paused, 5 = cued, -1 = unstarted (0 = ended → loop restart; 3 =
      // buffering is normal mid-play).
      if (lastState === 2 || lastState === 5 || lastState === -1) {
        panelEls.scene.classList.remove("cover-fade");
        if (!errored && resumeAttempts < 6) {
          resumeAttempts++;
          setTimeout(() => { if (lastState !== 1) post({ event: "command", func: "playVideo", args: [] }); }, 250);
        }
      }
    } catch {}
  };
  window.addEventListener("message", embedMsgHandler);
  iframe.addEventListener("load", () => {
    // Repeat the handshake: a single post can land before the player boots.
    embedHandshake = setInterval(
      () => post({ event: "listening", id: "panel", channel: "widget" }), 400);
  }, { once: true });
  // Autoplay sometimes stalls (extensions, data-saver): explicitly ask to play
  // if the player hasn't reported playback yet.
  embedNudgeTimers = [4000, 8000].map((ms) => setTimeout(() => {
    if (lastState !== 1 && !errored) post({ event: "command", func: "playVideo", args: [] });
  }, ms));
}
function stopPanelEmbed() {
  const wrap = document.getElementById("panel-embed");
  if (!wrap) return;
  if (embedRevealTimer) { clearTimeout(embedRevealTimer); embedRevealTimer = null; }
  embedNudgeTimers.forEach(clearTimeout);
  embedNudgeTimers = [];
  if (embedHandshake) { clearInterval(embedHandshake); embedHandshake = null; }
  if (embedMsgHandler) { window.removeEventListener("message", embedMsgHandler); embedMsgHandler = null; }
  panelEls.scene.classList.remove("cover-fade"); // still covers again next open
  wrap.replaceChildren(); // destroys the iframe → stops playback/downloads
  mountedEmbedId = null;
}

// ── Pre-warm: boot the CENTRED founder's player while the panel is closed ──
// Runs the reveal countdown ahead of time so opening the panel usually lands
// straight on clean footage. Debounced against carousel flicking; one
// background player at most; never mounts while the carousel is offscreen.
let prewarmTimer = null;
function schedulePrewarm(idx) {
  if (prewarmTimer) clearTimeout(prewarmTimer);
  prewarmTimer = setTimeout(() => {
    prewarmTimer = null;
    if (panel && panel.classList.contains("open")) return; // panel owns the embed
    const cf = document.querySelector(".coverflow");
    if (cf) {
      const r = cf.getBoundingClientRect();
      if (r.bottom <= 0 || r.top >= window.innerHeight) return;
    }
    const f = founders[idx];
    const embed = f && !matchMedia("(prefers-reduced-motion: reduce)").matches
      ? SCENE_YOUTUBE[f.company]
      : null;
    if (!embed) { stopPanelEmbed(); return; }
    if (mountedEmbedId === embed.id) return;
    stopPanelEmbed();
    startPanelEmbed(embed);
  }, 700);
}
function closePanel() {
  panel.classList.remove("open");
  panel.setAttribute("aria-hidden", "true");
  document.body.classList.remove("panel-open");
  stopPanelVideo();
  // Embed is KEPT mounted (it belongs to the centred founder) so reopening is
  // instant; torn down when another card centres or the carousel scrolls off.
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
  // Open on the MIDDLE card, so the fan is symmetric — roughly equal numbers of
  // cards spread to the left and the right — rather than starting at index 0
  // with the whole deck trailing off to the right. The `founders` array is
  // ordered so the founder we lead with sits at this index.
  const START_INDEX = Math.floor((total - 1) / 2);
  let cfPos = START_INDEX;  // floating active index (0 … total-1), hover-driven

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
      if (cfRole) cfRole.textContent = `${f.role} · ${f.company}${f.company2 ? " · " + f.company2 : ""}`;
      if (cfIndex) cfIndex.textContent = `${pad2(activeInt + 1)} / ${pad2(total)}`;
      cards.forEach((c, idx) => c.classList.toggle("active", idx === activeInt));
      lastActiveInt = activeInt;
      // Boot the centred founder's player in the background (debounced) so its
      // reveal countdown has run before the visitor opens the panel.
      schedulePrewarm(activeInt);
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

  // Bandwidth courtesy: tear the background pre-warm player down while the
  // carousel is offscreen; resume pre-warming when it scrolls back into view.
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          schedulePrewarm(Math.round(Math.max(0, Math.min(total - 1, cfPos))));
        } else if (!document.body.classList.contains("panel-open")) {
          // Tear down only when the carousel is GENUINELY offscreen — guard
          // against an initial-observation race that reports not-intersecting
          // for a frame while the element is actually in view (which would
          // wrongly cancel a just-scheduled pre-warm).
          const r = coverflow.getBoundingClientRect();
          if (r.bottom <= 0 || r.top >= window.innerHeight) {
            if (prewarmTimer) { clearTimeout(prewarmTimer); prewarmTimer = null; }
            stopPanelEmbed();
          }
        }
      });
    }, { threshold: 0.1 }).observe(coverflow);
  }

  // Glide the stage to a founder (panel PREV/NEXT, card click). setInterval
  // rather than rAF so the glide also runs where rAF is throttled or paused
  // (background tabs, embedded previews); reduced motion jumps instantly.
  let glideTimer = null;
  coverflowGlideTo = (idx) => {
    const target = Math.max(0, Math.min(total - 1, idx));
    if (glideTimer) { clearInterval(glideTimer); glideTimer = null; }
    const from = cfPos;
    const dist = target - from;
    if (Math.abs(dist) < 0.001) return;
    if (prefersReduced) { setPos(target); return; }
    const t0 = Date.now();
    const duration = Math.min(900, 320 + Math.abs(dist) * 140);
    glideTimer = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / duration);
      cfPos = from + dist * (1 - Math.pow(1 - p, 3)); // easeOutCubic
      renderCoverflow();
      if (p >= 1) { clearInterval(glideTimer); glideTimer = null; }
    }, 16);
  };

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
    const HOLD_MS = 1500;    // keep flicking this long after leaving a side edge
    const COAST_MS = 700;    // then ease the speed down to rest over this long
    let pointerX = null;
    let hoverRaf = null;
    let heldSince = 0;       // when the pointer left via a side edge (0 = tracking)

    // Run only while the carousel is on-screen and no modal is open.
    const onScreen = () => {
      const r = coverflow.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight &&
        !document.body.classList.contains("panel-open");
    };

    const stopHover = () => { pointerX = null; heldSince = 0; hoverRaf = null; };

    const tick = () => {
      if (pointerX == null || !onScreen()) { hoverRaf = null; return; }
      if (glideTimer) { hoverRaf = requestAnimationFrame(tick); return; } // glide owns cfPos

      // While the pointer is held off a side edge (see mouseleave), run at the
      // edge speed for HOLD_MS, then ease to rest over COAST_MS so it settles
      // instead of either cutting dead or spinning at full tilt forever.
      let fade = 1;
      if (heldSince) {
        const held = Date.now() - heldSince;
        if (held > HOLD_MS) {
          fade = 1 - (held - HOLD_MS) / COAST_MS;
          if (fade <= 0) { stopHover(); return; }
          fade *= fade;                       // ease-out
        }
      }

      const cx = centerX();
      const dead = cardHalf() + DEAD_PAD;
      const dx = pointerX - cx;
      const adx = Math.abs(dx);
      if (adx > dead) {
        const reach = Math.max(1, cx - dead);
        const t = Math.min(1, (adx - dead) / reach);
        const speed = (MIN_STEP + (MAX_STEP - MIN_STEP) * Math.pow(t, RAMP)) * fade;
        const before = cfPos;
        setPos(cfPos + Math.sign(dx) * speed);
        // Held against the first/last founder — nothing left to reveal, so stop
        // rather than burning frames on a clamped position.
        if (heldSince && cfPos === before) { stopHover(); return; }
      }
      hoverRaf = requestAnimationFrame(tick);
    };

    const pin = coverflow.querySelector(".coverflow-pin") || coverflow;
    pin.addEventListener("mousemove", (e) => {
      pointerX = e.clientX;
      heldSince = 0;                    // pointer is back — resume live tracking
      if (hoverRaf == null) hoverRaf = requestAnimationFrame(tick);
    }, { passive: true });

    // The pin stops at documentElement.clientWidth, so the native scrollbar sits
    // just outside it — and scrollbars don't emit mousemove. Sliding onto one
    // therefore fires mouseleave while the flick is at ~full speed, which used to
    // cut it dead mid-motion. If the pointer left through a SIDE edge, keep
    // feeding the loop that edge position so the motion carries on seamlessly
    // (then coast to rest in tick). Leaving via the top or bottom still stops
    // immediately — that's a genuine "done with the carousel" gesture.
    pin.addEventListener("mouseleave", (e) => {
      const r = pin.getBoundingClientRect();
      const sideExit = (e.clientX >= r.right - 2 || e.clientX <= r.left + 2) &&
                       e.clientY > r.top && e.clientY < r.bottom;
      if (!sideExit) { pointerX = null; heldSince = 0; return; }
      pointerX = e.clientX >= r.right - 2 ? r.right : r.left;  // pin to that edge
      heldSince = Date.now();
      if (hoverRaf == null) hoverRaf = requestAnimationFrame(tick);
    });

    // Pointer gone to another window/app — don't keep flicking in the background.
    window.addEventListener("blur", stopHover);
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
  ".hero-quote, .hero-attribution, .about-headline, .about-stat, .pillar, .advantage-intro, .advantage-card, .advantage-stats-text, .stat-box, .insights-text, .insight-tile, .contact-headline, .contact-email, .coverflow-head"
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
// Lives in founder-chart.js (shared with the Founder-led Advantage page).


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

// ─── Deep link to a founder card ───────────────────────
// The Founder-led Advantage page links each holding logo here as
// "/#founder-<company slug>". Resolve it against the same `founders`
// array the carousel is built from, so the two can never drift apart.
// Runs after a tick: coverflowGlideTo is assigned further down this file
// and the stage needs one layout pass before it can glide anywhere.
if (stage) {
  const founderSlug = (s) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const openFounderFromHash = () => {
    const m = /^#founder-(.+)$/.exec(location.hash || "");
    if (!m) return;
    const want = m[1].toLowerCase();
    const i = founders.findIndex(
      (f) => founderSlug(f.company) === want ||
             (f.company2 && founderSlug(f.company2) === want)
    );
    if (i < 0) return;
    // instant, not smooth: arriving from another page should land already
    // there rather than animate the whole way down
    document.getElementById("founders")
      ?.scrollIntoView({ behavior: "instant", block: "start" });
    openPanel(i);
  };
  setTimeout(openFounderFromHash, 0);
  window.addEventListener("hashchange", openFounderFromHash);
}
