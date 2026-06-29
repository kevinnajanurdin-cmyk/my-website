// ─── Idle cross-page image prefetch ────────────────────
// Included on the site's entry pages. After the current page has loaded, and
// during browser idle time, this warms the HTTP cache for the heavier images
// the Team and Insights pages need — so the first navigation to those pages
// paints from cache instead of streaming in. A page skips its OWN images (it
// is already loading them). Low priority; skipped on Save-Data / 2G.
(function () {
  var c = navigator.connection;
  if (c && (c.saveData || /2g/.test(c.effectiveType || ""))) return;

  var TEAM = [
    ["assets/team/background.jpg", null],
    ["assets/team/joseph-ziller-cutout.webp", "image/webp"],
    ["assets/team/wendy-herringer-cutout.webp", "image/webp"],
    ["assets/team/kevin-najanurdin-cutout.webp", "image/webp"],
    ["assets/team/steven-yee-cutout.webp", "image/webp"],
    ["assets/team/mark-pashley-cutout.webp", "image/webp"],
    ["assets/team/anthony-patterson-cutout.webp", "image/webp"],
    ["assets/team/bill-anastasopoulos-cutout.webp", "image/webp"]
  ];
  var INSIGHTS = [
    ["assets/essays/Peter_Beck_KNZM_(cropped).jpg", null],
    ["assets/essays/founders-advantage-hero.jpg", null],
    ["assets/essays/CATL_Arnstadt_2crop_2020-04.jpg", null]
  ];

  var assets = [];
  // Skip a category when this page already renders it.
  if (!document.querySelector(".team-photo-img")) assets = assets.concat(TEAM);
  if (!document.querySelector(".ins-card-media--photo")) assets = assets.concat(INSIGHTS);
  if (!assets.length) return;

  function prefetch() {
    assets.forEach(function (a) {
      var l = document.createElement("link");
      l.rel = "prefetch";
      l.as = "image";
      l.href = a[0];
      if (a[1]) l.type = a[1];
      document.head.appendChild(l);
    });
  }
  window.addEventListener("load", function () {
    if ("requestIdleCallback" in window) requestIdleCallback(prefetch, { timeout: 3000 });
    else setTimeout(prefetch, 1500);
  });
})();
