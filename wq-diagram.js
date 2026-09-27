/* WSQ approval logic diagram · route sweep, failure states and stage details on click */
(function () {
  var ROUTES = [
    ["31", "33", "35", "37", "39"],
    ["31", "33", "53", "55", "35", "15"],
    ["31", "33", "35", "37", "57"],
    ["31", "51"],
    ["31", "33", "53", "73"]
  ];
  var NODES = { "31": 1, "33": 1, "35": 1, "37": 1, "39": 1, "53": 1, "15": 1, "51": 1, "57": 1, "73": 1 };
  var STEP = 420, HOLD = 1900;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function boot(dg) {
    if (window.__wqBooted) return; window.__wqBooted = 1;
    var wrap = dg.closest(".dg-wrap") || dg.parentNode;
    function cell(k) { var d = document.querySelector(".dg") || dg; return d.querySelector('[data-k="' + k + '"]'); }

    /* ---- stage details ---- */
    
    var pop = document.createElement("div");
    pop.className = "dg-pop"; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-modal", "false"); pop.hidden = true;
    pop.innerHTML = '<div class="dg-pop__in"><div class="dg-pop__top"><p class="dg-pop__n"></p><button type="button" class="dg-pop__x">Close</button></div><h4 class="dg-pop__t"></h4><p class="dg-pop__a"></p><dl class="dg-pop__g"></dl></div>';
    function host() { var w = document.querySelector(".dg-wrap"); if (w && pop.parentNode !== w) w.appendChild(pop); return w; }
    host();
    var opener = null;
    function place(node) {
      var w = host(); if (!w) return;
      if (window.innerWidth < 768) { pop.classList.add("dg-pop--sheet"); pop.style.left = pop.style.top = ""; return; }
      pop.classList.remove("dg-pop--sheet");
      var a = w.getBoundingClientRect(), r = node.getBoundingClientRect(), pw = pop.offsetWidth;
      var x = Math.min(Math.max(0, r.left - a.left + r.width / 2 - pw / 2), a.width - pw);
      pop.style.left = x + "px"; pop.style.top = (r.bottom - a.top + 12) + "px";
    }
    function openFor(node) {
      var n = parseInt(node.querySelector(".dg-node__n").textContent, 10), row = document.querySelectorAll(".wq-logic__row")[n - 1]; if (!row) return;
      pop.querySelector(".dg-pop__n").textContent = "Stage " + node.querySelector(".dg-node__n").textContent;
      pop.querySelector(".dg-pop__t").textContent = node.querySelector(".dg-node__t").textContent;
      pop.querySelector(".dg-pop__a").textContent = row.querySelector(".wq-logic__a").textContent;
      var g = row.querySelector(".wq-gate"); pop.querySelector(".dg-pop__g").innerHTML = g ? g.innerHTML : "";
      pop.setAttribute("aria-label", "Stage " + n + " details");
      document.querySelectorAll(".dg-node.is-open").forEach(function (e) { e.classList.remove("is-open"); e.setAttribute("aria-expanded", "false"); });
      node.classList.add("is-open"); node.setAttribute("aria-expanded", "true");
      opener = node; pop.hidden = false; place(node);
      requestAnimationFrame(function () { pop.classList.add("is-on"); });
      pop.querySelector(".dg-pop__x").focus({ preventScroll: true });
    }
    function close(back) {
      if (pop.hidden) return;
      pop.classList.remove("is-on"); pop.hidden = true;
      if (opener) { opener.classList.remove("is-open"); opener.setAttribute("aria-expanded", "false"); if (back) opener.focus({ preventScroll: true }); }
      opener = null;
    }
    document.addEventListener("click", function (e) {
      var node = e.target.closest && e.target.closest(".dg-node"); if (!node) return;
      e.stopPropagation(); if (opener === node) close(true); else openFor(node);
    }, true);
    document.addEventListener("keydown", function (e) {
      var node = e.target.closest && e.target.closest(".dg-node");
      if (node && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); if (opener === node) close(true); else openFor(node); }
    });
    pop.querySelector(".dg-pop__x").addEventListener("click", function () { close(true); });
    pop.addEventListener("click", function (e) { e.stopPropagation(); });
    document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest(".dg-node,.dg-pop")) return; close(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(true); });
    window.addEventListener("resize", function () { if (opener) place(opener); });
    
    var sc = dg.closest(".dg-scroll"); if (sc) sc.addEventListener("scroll", function () { if (opener) place(opener); }, { passive: true });

    /* ---- route sweep ---- */
    if (reduce) return;
    document.documentElement.classList.add("dg-sweep-on");
    var visible = false, ri = 0, timer = null;
    function clear() { document.querySelectorAll(".is-lit,.is-fail").forEach(function (e) { e.classList.remove("is-lit", "is-fail"); }); }
    function between(a, b) {
      var out = [], ar = +a[0], ac = +a[1], br = +b[0], bc = +b[1];
      var dr = Math.sign(br - ar), dc = Math.sign(bc - ac), r = ar + dr, c = ac + dc;
      while (r !== br || c !== bc) { var el = cell("" + r + c); if (el) out.push(el); r += dr; c += dc; }
      return out;
    }
    function run() {
      if (!visible) return;
      clear();
      var route = ROUTES[ri % ROUTES.length]; ri++;
      var seq = [cell(route[0])];
      for (var i = 0; i < route.length - 1; i++) { seq = seq.concat(between(route[i], route[i + 1])); seq.push(cell(route[i + 1])); }
      var end = cell(route[route.length - 1]), fail = end.classList.contains("dg-out--no"), s = 0;
      (function tick() {
        if (!visible) return;
        if (s >= seq.length) {
          if (fail) seq.forEach(function (e) { e.classList.add("is-fail"); });
          timer = setTimeout(run, HOLD); return;
        }
        var el = seq[s++]; if (el) el.classList.add("is-lit");
        timer = setTimeout(tick, el && NODES[el.getAttribute("data-k")] ? STEP : STEP * 0.6);
      })();
    }
    setInterval(function () {
      var w = document.querySelector(".dg-wrap"); if (!w) return;
      var r = w.getBoundingClientRect(), vh = window.innerHeight;
      var on = r.bottom > vh * 0.25 && r.top < vh * 0.75 && !document.hidden;
      if (on && !visible) { visible = true; ri = 0; run(); }
      else if (!on && visible) { visible = false; clearTimeout(timer); clear(); }
    }, 400);
  }
  function scan() { document.querySelectorAll(".dg").forEach(boot); }
  var n = 0, iv = setInterval(function () { scan(); if (++n > 40) clearInterval(iv); }, 250);
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();
