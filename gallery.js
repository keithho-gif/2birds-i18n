/* Image gallery for work cards. A card opts in with data-gallery (image URLs
   separated by "|"), optional data-gallery-alt (matching alt texts) and
   data-gallery-title; any [data-gallery-open] inside it opens the viewer.
   Clicks are delegated from the document because the page is re-rendered
   by the design runtime after load. */
(function () {
  if (window.__tbGallery) return;
  window.__tbGallery = true;

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ARROW = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M15 5l-7 7 7 7"/></svg>';
  var CROSS = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M5 5l14 14M19 5L5 19"/></svg>';

  var dlg, img, title, count, thumbs, items = [], at = 0, opener = null, startX = null, startY = null;

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; }
  function navBtn(dir, extra) {
    var b = el("button", "gal__nav gal__nav--" + dir + (extra ? " " + extra : ""), ARROW);
    b.type = "button";
    b.setAttribute("aria-label", dir === "prev" ? "Previous image" : "Next image");
    b.addEventListener("click", function () { go(at + (dir === "prev" ? -1 : 1)); });
    return b;
  }

  function build() {
    dlg = el("dialog", "gal");
    dlg.setAttribute("aria-modal", "true");
    var top = el("div", "gal__top");
    var meta = el("div", "gal__meta");
    title = el("p", "gal__title");
    count = el("p", "gal__count");
    meta.appendChild(title); meta.appendChild(count);
    var close = el("button", "gal__close", CROSS);
    close.type = "button";
    close.setAttribute("aria-label", "Close gallery");
    close.addEventListener("click", hide);
    top.appendChild(meta); top.appendChild(close);

    var stage = el("div", "gal__stage");
    img = el("img", "gal__img");
    img.decoding = "async";
    stage.appendChild(navBtn("prev", "gal__nav--side"));
    stage.appendChild(img);
    stage.appendChild(navBtn("next", "gal__nav--side"));
    stage.addEventListener("click", function (e) { if (e.target === stage) hide(); });
    stage.addEventListener("pointerdown", function (e) { startX = e.clientX; startY = e.clientY; });
    stage.addEventListener("pointerup", function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX, dy = e.clientY - startY;
      startX = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(at + (dx < 0 ? 1 : -1));
    });

    var bar = el("div", "gal__bar");
    thumbs = el("div", "gal__thumbs");
    bar.appendChild(navBtn("prev", "gal__nav--bar"));
    bar.appendChild(thumbs);
    bar.appendChild(navBtn("next", "gal__nav--bar"));

    dlg.appendChild(top); dlg.appendChild(stage); dlg.appendChild(bar);
    dlg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); go(at - 1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); go(at + 1); }
    });
    dlg.addEventListener("close", cleanup);
    document.body.appendChild(dlg);
  }

  function go(i) {
    var n = items.length;
    at = ((i % n) + n) % n;
    var it = items[at];
    img.src = it.src;
    img.alt = it.alt;
    count.textContent = (at + 1) + " / " + n;
    var t = thumbs.children;
    for (var k = 0; k < t.length; k++) t[k].setAttribute("aria-current", k === at ? "true" : "false");
    if (!reduce && img.animate) img.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: "ease-out" });
  }

  function show(card, trigger) {
    var srcs = (card.getAttribute("data-gallery") || "").split("|");
    var alts = (card.getAttribute("data-gallery-alt") || "").split("|");
    items = srcs.map(function (s, i) { return { src: s.trim(), alt: (alts[i] || "").trim() }; }).filter(function (x) { return x.src; });
    if (!items.length) return;
    if (!dlg) build();
    opener = trigger;
    var name = card.getAttribute("data-gallery-title") || "";
    title.textContent = name;
    dlg.setAttribute("aria-label", name ? name + " gallery" : "Gallery");
    thumbs.innerHTML = "";
    items.forEach(function (it, i) {
      var b = el("button", "gal__thumb");
      b.type = "button";
      b.setAttribute("aria-label", "Image " + (i + 1) + " of " + items.length);
      var ti = el("img"); ti.src = it.src; ti.alt = ""; ti.decoding = "async";
      b.appendChild(ti);
      b.addEventListener("click", function () { go(i); });
      thumbs.appendChild(b);
    });
    dlg.classList.toggle("gal--single", items.length < 2);
    go(0);
    document.documentElement.classList.add("gal-lock");
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
  }

  function hide() { if (dlg.close) dlg.close(); else { dlg.removeAttribute("open"); cleanup(); } }
  function cleanup() {
    document.documentElement.classList.remove("gal-lock");
    if (opener && opener.isConnected) opener.focus();
    opener = null;
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-gallery-open]");
    if (!t) return;
    var card = t.closest("[data-gallery]");
    if (!card) return;
    e.preventDefault();
    show(card, t);
  });
})();
