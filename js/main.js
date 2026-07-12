/* 2birds — shared chrome and behaviours (no framework) */
(function () {
  "use strict";

  var PAGE = document.body.getAttribute("data-page") || "";

  /* ---------- shared chrome ---------- */

  var NAV_ITEMS = [
    { id: "brand", label: "Brand", href: "brand.html" },
    { id: "curriculum", label: "WSQ Curriculum Development", href: "wsqcurriculumdevelopment.html" },
    { id: "setup", label: "ATO Setup Advisory", href: "atosetupadvisory.html" },
    { id: "audit", label: "SWDA Audit Matters", href: "ssgauditmatters.html" },
    { id: "marketing", label: "Creative Marketing", href: "creativemarketing.html" }
  ];

  function buildNav() {
    var header = document.createElement("header");
    header.className = "nav";
    var links = NAV_ITEMS.map(function (it) {
      return '<a class="nav__link' + (PAGE === it.id ? " is-active" : "") + '" href="' + it.href + '">' + it.label + "</a>";
    }).join("");
    header.innerHTML =
      '<div class="nav__top">' +
      '<button class="nav__region" aria-haspopup="dialog">Singapore · English</button>' +
      '<a href="contact.html">Make an enquiry</a>' +
      '<button class="nav__burger" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button>' +
      "</div>" +
      '<a class="nav__mark" href="index.html" aria-label="2birds, home">' +
      '<img src="assets/logo-text.png" alt="2birds" /></a>' +
      '<nav class="nav__menu" aria-label="Primary">' + links + "</nav>";
    document.body.prepend(header);

    /* skip link for keyboard users; lands on <main> */
    var main = document.querySelector("main");
    if (main && !main.id) main.id = "main";
    var skip = document.createElement("a");
    skip.className = "skiplink";
    skip.href = "#main";
    skip.textContent = "Skip to content";
    document.body.prepend(skip);

    var drawer = document.createElement("div");
    drawer.className = "drawer";
    drawer.setAttribute("aria-hidden", "true");
    drawer.innerHTML = NAV_ITEMS.map(function (it, i) {
      return '<a href="' + it.href + '">' + it.label + "<span>0" + (i + 1) + "</span></a>";
    }).join("") + '<a href="contact.html">Make an enquiry<span>↗</span></a>';
    document.body.appendChild(drawer);

    var burger = header.querySelector(".nav__burger");
    burger.addEventListener("click", function () {
      var open = drawer.classList.toggle("is-open");
      document.body.classList.toggle("drawer-open", open);
      burger.setAttribute("aria-expanded", String(open));
      drawer.setAttribute("aria-hidden", String(!open));
    });

    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
      /* expose the live nav height so the sticky section index sits under it */
      document.documentElement.style.setProperty("--navh", header.offsetHeight + "px");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    /* some embedded viewers withhold scroll events; poll as a fallback */
    setInterval(onScroll, 600);
  }

  /* ---------- sticky section index: highlight the section in view ---------- */
  function bindSecnav() {
    var nav = document.querySelector(".secnav");
    if (!nav) return;
    var links = Array.prototype.slice.call(nav.querySelectorAll("a[href^='#']"));
    var map = {};
    var targets = links.map(function (a) {
      var el = document.getElementById(a.getAttribute("href").slice(1));
      if (el) map[el.id] = a;
      return el;
    }).filter(Boolean);
    if (!targets.length) return;
    var setOn = function (id) {
      links.forEach(function (a) { a.classList.toggle("is-on", a.getAttribute("href") === "#" + id); });
    };
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) setOn(e.target.id); });
      }, { rootMargin: "-30% 0px -60% 0px" });
      targets.forEach(function (t) { io.observe(t); });
    }
    /* polling fallback for viewers that withhold intersection events */
    setInterval(function () {
      var y = window.scrollY + window.innerHeight * 0.35;
      var current = targets[0];
      targets.forEach(function (t) { if (t.offsetTop <= y) current = t; });
      if (current) setOn(current.id);
    }, 800);
  }

  function buildFooter() {
    var footer = document.createElement("footer");
    footer.className = "footer";
    footer.innerHTML =
      '<div class="container footer__inner">' +
      '<div class="footer__grid">' +
      '<div><h4 class="footer__heading">Explore 2birds.asia</h4><ul class="footer__list">' +
      NAV_ITEMS.map(function (it) { return '<li><a href="' + it.href + '">' + it.label + "</a></li>"; }).join("") +
      "</ul></div>" +
      '<div><h4 class="footer__heading">Client Services</h4><ul class="footer__list">' +
      '<li><a href="contact.html">Make an Enquiry</a></li>' +
      '<li><a href="contact.html">Book a Consultation</a></li>' +
      '<li><a href="wsqcurriculumdevelopment.html#casl">The CASL Register</a></li>' +
      '<li><a href="sourcing.html">Trainers and SMEs Sourcing</a></li>' +
      "</ul></div>" +
      '<div><h4 class="footer__heading">The Practice</h4><ul class="footer__list">' +
      "<li>7 Temasek Boulevard, #12-07</li>" +
      "<li>Suntec Tower One, Singapore 038987</li>" +
      "<li>Monday to Friday, 9am to 6pm</li>" +
      '<li><a href="tel:+6585953945">Mobile · +65 8595 3945</a></li>' +
      "<li>Fax · +65 6917 8977</li>" +
      "</ul></div>" +
      '<div><h4 class="footer__heading">The House of 2birds</h4><ul class="footer__list">' +
      '<li><a href="brand.html">The Brand Story</a></li>' +
      '<li><a href="glossary.html">Glossary of Abbreviations</a></li>' +
      '<li><a href="engagement.html">Terms of Engagement</a></li>' +
      '<li><a href="privacy.html">Privacy Policy</a></li>' +
      '<li><a href="terms.html">Legal Statement</a></li>' +
      "</ul></div>" +
      "</div>" +
      '<div class="footer__legal">' +
      "<span>© 2BIRDS PRIVATE LIMITED · UEN 202625717Z</span>" +
      "<span>All rights reserved.</span>" +
      "</div>" +
      '<div class="footer__wordmark">' +
      '<a href="index.html" aria-label="2birds, home"><img src="assets/monogram.png" alt="2birds monogram" /></a>' +
      "</div></div>";
    document.body.appendChild(footer);
  }

  function buildFab() {
    var a = document.createElement("a");
    a.className = "fab-wa";
    a.href = "https://wa.me/6585953945";
    a.target = "_blank";
    a.rel = "noopener";
    a.setAttribute("aria-label", "Chat with 2birds on WhatsApp");
    a.innerHTML =
      '<svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true"><path fill="currentColor" d="M16.02 3.2c-7.07 0-12.8 5.73-12.8 12.8 0 2.26.59 4.46 1.72 6.41L3.2 28.8l6.55-1.71a12.78 12.78 0 0 0 6.27 1.61h.01c7.06 0 12.8-5.73 12.8-12.8S23.09 3.2 16.02 3.2zm0 23.45h-.01a10.6 10.6 0 0 1-5.42-1.49l-.39-.23-3.89 1.02 1.04-3.79-.25-.39a10.64 10.64 0 1 1 19.62-5.77c0 5.87-4.77 10.65-10.7 10.65zm5.84-7.97c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.51-.16-.72.16-.21.32-.83 1.04-1.02 1.25-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59a9.66 9.66 0 0 1-1.78-2.22c-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.53-.54-.72-.55l-.61-.01c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.66 0 1.57 1.14 3.08 1.3 3.29.16.21 2.25 3.43 5.45 4.81.76.33 1.35.52 1.82.67.76.24 1.45.21 2 .13.61-.09 1.89-.77 2.16-1.52.27-.74.27-1.38.19-1.52-.08-.13-.29-.21-.61-.37z"/></svg>';
    document.body.appendChild(a);
  }

  /* ---------- reveal on scroll ----------
     getBoundingClientRect on scroll rather than IntersectionObserver:
     IO callbacks stall inside some sandboxed preview iframes. */

  function initReveal() {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    /* tag imagery containers for the curtain reveal, alternating direction */
    var dirs = ["", "imgreveal--l", "imgreveal--r"];
    var mediaWraps = document.querySelectorAll(".band, .figure, .colcard__img, .panel__media, .mosaic figure");
    mediaWraps.forEach(function (el, i) {
      el.classList.add("imgreveal");
      var d = dirs[i % 3];
      if (d) el.classList.add(d);
    });

    /* opposing entrances for two-column passages */
    document.querySelectorAll(".split").forEach(function (s) {
      var kids = Array.prototype.filter.call(s.children, function (k) { return k.classList; });
      if (kids[0] && kids[0].classList.contains("reveal")) kids[0].setAttribute("data-dir", "left");
      if (kids[1] && kids[1].classList.contains("reveal")) kids[1].setAttribute("data-dir", "right");
    });

    function check() {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var trigger = vh * 0.92;
      document.querySelectorAll(".reveal:not(.is-in), .imgreveal:not(.is-in), .sectionhead:not(.is-in)").forEach(function (el) {
        if (el.getBoundingClientRect().top < trigger) {
          el.classList.add("is-in");
          countersIn(el);
        }
      });
    }
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check, { passive: true });
    check();
    [150, 500, 1200].forEach(function (t) { setTimeout(check, t); });
    /* some embedded viewers withhold scroll events and animation frames;
       a light poll keeps content from ever being stranded at opacity 0 */
    setInterval(check, 700);
  }

  /* ---------- headline line-mask reveal (hero titles) ---------- */

  function initLineReveal() {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    document.querySelectorAll(".bhero .display").forEach(function (h) {
      var parts = h.innerHTML.split(/<br\s*\/?>/i);
      h.innerHTML = parts.map(function (p, i) {
        return '<span class="linewrap"><span style="--ld:' + (0.15 + i * 0.14) + 's">' + p + "</span></span>";
      }).join("");
      setTimeout(function () { h.classList.add("lines-in"); }, 60);
    });
  }

  /* ---------- count-up figures ---------- */

  function countersIn(scope) {
    var els = scope.matches && scope.matches("[data-count]") ? [scope] : scope.querySelectorAll ? scope.querySelectorAll("[data-count]") : [];
    Array.prototype.forEach.call(els, function (el) {
      if (el.__counted) return;
      el.__counted = true;
      var target = Number(el.getAttribute("data-count"));
      var suffix = el.getAttribute("data-suffix") || "";
      var start = null;
      var dur = 1600;
      function tick(ts) {
        if (!start) start = ts;
        var p = Math.min(1, (ts - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target + suffix;
      }
      if ("requestAnimationFrame" in window) requestAnimationFrame(tick);
      else el.textContent = target + suffix;
      /* rAF can be withheld in embedded viewers; settle the final value regardless */
      setTimeout(function () { el.textContent = target + suffix; }, dur + 200);
    });
  }

  /* ---------- accordions ---------- */

  function initAccordions() {
    document.querySelectorAll(".acc__item").forEach(function (item) {
      var btn = item.querySelector(".acc__btn");
      var panel = item.querySelector(".acc__panel");
      if (!btn || !panel) return;
      btn.setAttribute("aria-expanded", "false");
      btn.addEventListener("click", function () {
        var open = item.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", String(open));
        panel.style.maxHeight = open ? panel.scrollHeight + "px" : "0px";
      });
    });
  }

  /* ---------- gentle parallax on .band images ---------- */

  function initParallax() {
    var bands = document.querySelectorAll(".band img");
    if (!bands.length) return;
    var raf = 0;
    function tick() {
      raf = 0;
      var vh = window.innerHeight;
      bands.forEach(function (img) {
        var r = img.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var p = (r.top + r.height / 2 - vh / 2) / vh; /* -0.5 .. 0.5 */
        img.style.transform = "translateY(" + (p * -6) + "%)";
      });
    }
    window.addEventListener("scroll", function () {
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
    tick();
  }

  /* ---------- CASL working-list dock ----------
     Driven by pinned skills in localStorage, so a visitor's working list
     follows them across the site. Collapsible to a small launcher. */

  var SHORTLIST_KEY = "tb_casl_shortlist";
  var COLLAPSE_KEY = "tb_casl_dock_dismissed";

  function readPinned() {
    try {
      var a = JSON.parse(localStorage.getItem(SHORTLIST_KEY) || "[]");
      return Array.isArray(a) ? a.filter(function (x) { return typeof x === "string"; }) : [];
    } catch (e) { return []; }
  }
  function writePinned(arr) {
    try { localStorage.setItem(SHORTLIST_KEY, JSON.stringify(arr)); } catch (e) {}
    try { window.dispatchEvent(new Event("tb-worklist-change")); } catch (e) {}
  }
  window.TBWorklist = { read: readPinned, write: writePinned };

  function initDock() {
    var dock = null, fab = null;

    function isCollapsed() {
      try { return localStorage.getItem(COLLAPSE_KEY) === "1"; } catch (e) { return false; }
    }
    function setCollapsed(v) {
      try { if (v) localStorage.setItem(COLLAPSE_KEY, "1"); else localStorage.removeItem(COLLAPSE_KEY); } catch (e) {}
    }
    function esc(s) {
      return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
    function mailtoFor(pinned) {
      var n = pinned.length;
      var subject = "Course development enquiry · working list of " + n + (n === 1 ? " skill" : " skills") + " from the CASL";
      var body = "Hello 2birds,\n\nI have pinned the following " +
        (n === 1 ? "skill" : n + " skills") +
        " from the CASL and would value a frank read on marketability and the right funding route:\n\n" +
        pinned.map(function (t, i) { return (i + 1) + ". " + t; }).join("\n") + "\n\nThank you.";
      return "mailto:hello@2birds.asia?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    }

    function build() {
      dock = document.createElement("div");
      dock.className = "dock";
      dock.innerHTML =
        '<div class="dock__panel" hidden><div class="dock__panelhead">' +
        '<span class="small-caps">Your working list</span>' +
        '<a href="wsqcurriculumdevelopment.html#casl">Open the register</a></div>' +
        '<ul class="dock__list"></ul></div>' +
        '<div class="dock__bar">' +
        '<button class="dock__info" type="button">Your working list <span class="dock__count"></span></button>' +
        '<a class="dock__send" href="#">Send my working list</a>' +
        '<a class="dock__call" href="contact.html">Book a scoping call</a>' +
        '<button class="dock__close" type="button" aria-label="Minimise">×</button>' +
        "</div>";
      document.body.appendChild(dock);
      var panel = dock.querySelector(".dock__panel");
      dock.querySelector(".dock__info").addEventListener("click", function () {
        panel.hidden = !panel.hidden;
      });
      dock.querySelector(".dock__close").addEventListener("click", function () {
        setCollapsed(true); update();
      });
      dock.querySelector(".dock__list").addEventListener("click", function (e) {
        var b = e.target.closest("[data-rm]");
        if (!b) return;
        writePinned(readPinned().filter(function (t) { return t !== b.getAttribute("data-rm"); }));
      });
    }
    function buildLauncher() {
      fab = document.createElement("button");
      fab.className = "dock__fab";
      fab.type = "button";
      fab.setAttribute("aria-label", "Open your working list");
      fab.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3.5h10a1 1 0 0 1 1 1V21l-6-3.7L6 21V4.5a1 1 0 0 1 1-1z"/></svg><span class="dock__fabcount"></span>';
      document.body.appendChild(fab);
      fab.addEventListener("click", function () { setCollapsed(false); update(); });
    }

    function update() {
      var pinned = readPinned();
      if (!pinned.length) {
        if (dock) dock.style.display = "none";
        if (fab) fab.style.display = "none";
        return;
      }
      if (isCollapsed()) {
        if (!fab) buildLauncher();
        fab.style.display = "";
        fab.querySelector(".dock__fabcount").textContent = String(pinned.length);
        if (dock) dock.style.display = "none";
        return;
      }
      if (!dock) build();
      dock.style.display = "";
      if (fab) fab.style.display = "none";
      dock.querySelector(".dock__count").textContent = String(pinned.length);
      dock.querySelector(".dock__send").setAttribute("href", mailtoFor(pinned));
      dock.querySelector(".dock__list").innerHTML = pinned.map(function (t) {
        return '<li>' + esc(t) + '<button data-rm="' + esc(t) + '" aria-label="Remove">×</button></li>';
      }).join("");
    }

    var css = document.createElement("style");
    css.textContent =
      ".dock{position:fixed;left:50%;transform:translateX(-50%);bottom:20px;z-index:95;width:min(720px,calc(100vw - 32px));}" +
      ".dock__bar{display:flex;align-items:center;gap:18px;background:var(--dark);color:var(--ivory);border-radius:999px;padding:12px 22px;box-shadow:0 14px 40px rgba(22,21,15,.35);font-size:13px;}" +
      ".dock__info{color:var(--ivory);display:inline-flex;align-items:center;gap:9px;font-size:13px;}" +
      ".dock__count{background:var(--olive);border-radius:999px;min-width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;padding:0 6px;}" +
      ".dock__send{margin-left:auto;color:var(--olive-bright);white-space:nowrap;}" +
      ".dock__send:hover{color:var(--ivory);}" +
      ".dock__call{white-space:nowrap;border-bottom:1px solid rgba(250,248,242,.3);}" +
      ".dock__close{color:rgba(250,248,242,.5);font-size:18px;}" +
      ".dock__close:hover{color:var(--ivory);}" +
      ".dock__panel{background:var(--ivory);border:1px solid var(--line);border-radius:14px;margin-bottom:10px;padding:18px 22px;box-shadow:0 14px 40px rgba(22,21,15,.18);max-height:300px;overflow:auto;}" +
      ".dock__panelhead{display:flex;justify-content:space-between;gap:14px;margin-bottom:8px;}" +
      ".dock__panelhead a{font-size:12px;color:var(--olive);border-bottom:1px solid var(--olive-bright);}" +
      ".dock__list{list-style:none;}" +
      ".dock__list li{display:flex;justify-content:space-between;gap:12px;font-size:13.5px;color:var(--ink-soft);padding:8px 0;border-top:1px solid var(--line);}" +
      ".dock__list button{color:var(--ink-faint);font-size:15px;}" +
      ".dock__list button:hover{color:var(--olive);}" +
      ".dock__fab{position:fixed;left:26px;bottom:26px;z-index:95;width:54px;height:54px;border-radius:50%;background:var(--dark);color:var(--ivory);display:flex;align-items:center;justify-content:center;box-shadow:0 10px 30px rgba(22,21,15,.28);}" +
      ".dock__fabcount{position:absolute;top:-4px;right:-4px;background:var(--olive);border-radius:999px;min-width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:11px;padding:0 5px;}" +
      "@media(max-width:680px){.dock__call{display:none;}}";
    document.head.appendChild(css);

    window.addEventListener("tb-worklist-change", update);
    window.addEventListener("storage", function (e) {
      if (!e || e.key === null || e.key === SHORTLIST_KEY || e.key === COLLAPSE_KEY) update();
    });
    update();
  }

  /* ---------- region and language selector ---------- */
  function buildRegion() {
    var trigger = document.querySelector(".nav__region");
    if (!trigger) return;

    var ASIA = [
      { c: "\u4e2d\u56fd\u5927\u9646", en: "Mainland China", lang: "\u7b80\u4f53\u4e2d\u6587" },
      { c: "\u65e5\u672c", en: "Japan", lang: "\u65e5\u672c\u8a9e" },
      { c: "\ub300\ud55c\ubbfc\uad6d", en: "South Korea", lang: "\ud55c\uad6d\uc5b4" },
      { c: "\u9999\u6e2f\u7279\u5225\u884c\u653f\u5340", en: "Hong Kong SAR", lang: "\u7e41\u9ad4\u4e2d\u6587" },
      { c: "Singapore", en: "", lang: "English", cur: true },
      { c: "Malaysia", en: "", lang: "English" },
      { c: "\u53f0\u7063\u5730\u5340", en: "Taiwan", lang: "\u7e41\u9ad4\u4e2d\u6587" },
      { c: "\u0e1b\u0e23\u0e30\u0e40\u0e17\u0e28\u0e44\u0e17\u0e22", en: "Thailand", lang: "\u0e20\u0e32\u0e29\u0e32\u0e44\u0e17\u0e22" },
      { c: "Vi\u1ec7t Nam", en: "Vietnam", lang: "Ti\u1ebfng Vi\u1ec7t" },
      { c: "Indonesia", en: "", lang: "English" },
      { c: "Indonesia", en: "", lang: "Bahasa Indonesia" },
      { c: "India", en: "", lang: "English" },
      { c: "Philippines", en: "", lang: "English" }
    ];

    function meta(r) { return (r.en ? r.en + " \u00b7 " : "") + r.lang; }

    var rows = ASIA.map(function (r, i) {
      return '<li><button class="rgn__row' + (r.cur ? " is-cur" : "") + '" data-i="' + i + '">' +
        '<span class="rgn__names"><span class="rgn__main">' + r.c + "</span>" +
        '<span class="rgn__meta">' + meta(r) + "</span></span>" +
        '<span class="rgn__check" aria-hidden="true">&#10003;</span></button></li>';
    }).join("");

    var overlay = document.createElement("div");
    overlay.className = "rgn";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML =
      '<div class="rgn__sheet" role="dialog" aria-modal="true" aria-label="Region and language">' +
      '<button class="rgn__close" aria-label="Close">&times;</button>' +
      '<span class="eyebrow">Region &amp; language</span>' +
      '<h2 class="rgn__title">Select your <em>region</em>.</h2>' +
      '<p class="rgn__sub">View 2birds, curriculum and advisory for training providers, in your preferred language.</p>' +
      '<div class="rgn__group"><span class="rgn__glabel">Asia</span><ul class="rgn__list">' + rows + "</ul></div>" +
      "</div>";
    document.body.appendChild(overlay);

    function open() {
      overlay.classList.add("is-open");
      overlay.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", esc);
    }
    function close() {
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      document.removeEventListener("keydown", esc);
    }
    function esc(e) { if (e.key === "Escape") close(); }

    trigger.addEventListener("click", open);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay || e.target.closest(".rgn__close")) close();
    });
    overlay.querySelectorAll(".rgn__row").forEach(function (b) {
      b.addEventListener("click", function () {
        var r = ASIA[Number(b.dataset.i)];
        overlay.querySelectorAll(".rgn__row").forEach(function (x) { x.classList.remove("is-cur"); });
        b.classList.add("is-cur");
        trigger.textContent = (r.en || r.c) + " · " + r.lang;
        close();
      });
    });
  }

  /* ---------- reading-progress hairline ---------- */
  /* Recommendation #2: a fine olive rule at the very top scales with how far the
     reader has come. rAF-throttled, and suppressed entirely under reduced-motion. */
  function initReadbar() {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    var bar = document.createElement("div");
    bar.className = "readbar";
    document.body.appendChild(bar);
    var raf = 0;
    function set() {
      raf = 0;
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = "scaleX(" + p + ")";
    }
    function req() { if (!raf) raf = requestAnimationFrame(set); }
    window.addEventListener("scroll", req, { passive: true });
    window.addEventListener("resize", req, { passive: true });
    set();
  }

  /* ---------- image loading hints ---------- */
  /* Recommendation #3: hand the decode off-thread everywhere, and lazy-load any
     image the author did not mark as high priority, so first paint stays quick. */
  function initImgHints() {
    document.querySelectorAll("img").forEach(function (im) {
      if (!im.hasAttribute("decoding")) im.decoding = "async";
      if (!im.hasAttribute("loading") && im.getAttribute("fetchpriority") !== "high") {
        im.loading = "lazy";
      }
    });
  }

  /* ---------- boot ---------- */

  buildNav();
  buildFooter();
  buildFab();
  buildRegion();
  bindSecnav();
  initReveal();
  initLineReveal();
  initAccordions();
  initParallax();
  initReadbar();
  initImgHints();
  initDock();
})();
