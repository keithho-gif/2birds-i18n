/* =========================================================================
   2birds — page flight transition.
   A small flock of two birds animates on every page load (the "arrival"),
   and a soft cover plays on internal navigation (the "departure"). The
   arrival animation differs per page, à la the Hermès loader.
   Plain JS, loaded in <head> so the cover paints before the page does.
   ========================================================================= */
(function () {
  if (window.__tbFly) return;
  window.__tbFly = true;

  // Map each page to a distinct arrival animation.
  var page = (location.pathname.split("/").pop() || "index.html")
    .toLowerCase().replace(".html", "") || "index";
  var MAP = {
    index:      "meet",
    brand:      "orbit",
    curriculum: "rise",
    audit:      "descend",
    revenue:    "fan",
    setup:      "rise",
    sourcing:   "cross",
    engagement: "fan",
    contact:    "meet"
  };
  var anim = MAP[page] || "rise";

  var BIRD =
    '<svg viewBox="0 0 48 22" aria-hidden="true">' +
    '<path d="M3 15 Q 13 3 24 13 Q 35 3 45 15" fill="none" ' +
    'stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function flock(cls) {
    var el = document.createElement("div");
    el.className = "tb-fly" + (cls ? " " + cls : "");
    el.setAttribute("aria-hidden", "true");
    el.setAttribute("data-anim", anim);
    el.innerHTML =
      '<div class="tb-fly__flock">' +
        '<span class="tb-fly__bird tb-fly__bird--1"><span class="tb-fly__wing">' + BIRD + "</span></span>" +
        '<span class="tb-fly__bird tb-fly__bird--2"><span class="tb-fly__wing">' + BIRD + "</span></span>" +
      "</div>";
    return el;
  }

  // ---- Arrival: cover is present immediately, then lifts after load ----
  var arrival = flock("is-arrival");
  (document.body || document.documentElement).appendChild(arrival);

  var started = Date.now();
  function lift() {
    var wait = Math.max(0, 900 - (Date.now() - started));
    setTimeout(function () {
      arrival.classList.add("is-out");
      setTimeout(function () { if (arrival && arrival.parentNode) arrival.parentNode.removeChild(arrival); }, 650);
    }, wait);
  }
  if (document.readyState === "complete") lift();
  else window.addEventListener("load", lift);

  // Make sure the cover ends up inside <body> once it exists (tidier stacking).
  document.addEventListener("DOMContentLoaded", function () {
    if (arrival.parentNode === document.documentElement && document.body) {
      document.body.appendChild(arrival);
    }
  });

  // ---- Departure: soft cover on internal navigation ----
  var leaving = false;
  document.addEventListener("click", function (e) {
    if (leaving) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    var a = e.target.closest ? e.target.closest("a") : null;
    if (!a) return;
    var href = a.getAttribute("href");
    if (!href || a.target === "_blank" || a.hasAttribute("download")) return;
    if (href.charAt(0) === "#" || href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0) return;
    if (!/\.html(\?|#|$)/.test(href) && href !== "index.html") return;
    if (/^https?:\/\//.test(href) && a.host !== location.host) return;
    // ignore same-page links
    if (a.pathname === location.pathname && (a.hash || href.indexOf("#") > -1)) return;

    leaving = true;
    e.preventDefault();
    var cover = flock("is-departure");
    document.body.appendChild(cover);
    requestAnimationFrame(function () { cover.classList.add("is-cover"); });
    setTimeout(function () { window.location.href = href; }, 460);
  }, true);
})();
