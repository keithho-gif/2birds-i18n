/* 2birds — homepage widgets: hover-play service videos, booking calendar */
(function () {
  "use strict";

  /* service card videos play on hover */
  document.querySelectorAll("video[data-hoverplay]").forEach(function (v) {
    var row = v.closest(".svc__row") || v;
    row.addEventListener("mouseenter", function () { v.play().catch(function () {}); });
    row.addEventListener("mouseleave", function () { v.pause(); });
  });

  /* ---------- availability calendar ---------- */

  var HOLIDAYS_2026 = {
    "2026-01-01": "New Year's Day",
    "2026-02-17": "Chinese New Year",
    "2026-02-18": "Chinese New Year",
    "2026-03-21": "Hari Raya Puasa",
    "2026-04-03": "Good Friday",
    "2026-05-01": "Labour Day",
    "2026-05-27": "Hari Raya Haji",
    "2026-05-31": "Vesak Day",
    "2026-06-01": "Vesak Day (observed)",
    "2026-08-09": "National Day",
    "2026-08-10": "National Day (observed)",
    "2026-11-08": "Deepavali",
    "2026-11-09": "Deepavali (observed)",
    "2026-12-25": "Christmas Day"
  };

  var host = document.getElementById("tb-calendar");
  if (!host) return;

  var today = new Date();
  var view = new Date(today.getFullYear(), today.getMonth(), 1);
  /* booking opens for the current month and the three ahead */
  var minView = new Date(today.getFullYear(), today.getMonth(), 1);
  var maxView = new Date(today.getFullYear(), today.getMonth() + 3, 1);
  /* a stable, pseudo-random set of already-booked weekdays */
  function isBooked(y, m, d) { return ((d * 13 + (m + 1) * 7 + y) % 5) === 2; }

  var MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  function iso(d) {
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  /* appointment times across the business day */
  var SLOTS = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];
  function prettyDate(key) {
    var p = key.split("-");
    return Number(p[2]) + " " + MONTHS[Number(p[1]) - 1] + " " + p[0];
  }
  function renderSlots(dateKey) {
    var wrap = host.querySelector(".cal__slots");
    if (!wrap) return;
    var pretty = prettyDate(dateKey);
    wrap.innerHTML =
      '<span class="cal__slotslabel">' + pretty + " · choose a time</span>" +
      '<div class="cal__slotgrid">' +
      SLOTS.map(function (t) { return '<button class="cal__slot" data-time="' + t + '">' + t + "</button>"; }).join("") +
      "</div>";
    wrap.querySelectorAll("[data-time]").forEach(function (s) {
      s.addEventListener("click", function () {
        var t = s.dataset.time;
        var subj = "Consultation enquiry · " + pretty + " · " + t;
        var body = "Hello 2birds,\n\nI would like to enquire about a consultation on " + pretty + " at " + t + ".\n\nThank you.";
        window.location.href = "mailto:hello@2birds.asia?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body);
      });
    });
  }

  function render() {
    var y = view.getFullYear(), m = view.getMonth();
    var first = new Date(y, m, 1);
    var startCol = (first.getDay() + 6) % 7; /* Monday first */
    var days = new Date(y, m + 1, 0).getDate();
    var atMin = (y === minView.getFullYear() && m === minView.getMonth());
    var atMax = (y === maxView.getFullYear() && m === maxView.getMonth());

    var html =
      '<div class="cal">' +
      '<div class="cal__head">' +
      '<span class="cal__title">' + MONTHS[m] + " " + y + "</span>" +
      '<span class="cal__navs">' +
      '<button class="cal__nav" data-nav="-1"' + (atMin ? " disabled" : "") + ' aria-label="Previous month">‹</button>' +
      '<button class="cal__nav" data-nav="1"' + (atMax ? " disabled" : "") + ' aria-label="Next month">›</button>' +
      "</span></div>" +
      '<div class="cal__grid">' +
      ["M", "T", "W", "T", "F", "S", "S"].map(function (d) {
        return '<span class="cal__dow">' + d + "</span>";
      }).join("");

    for (var i = 0; i < startCol; i++) html += "<span></span>";
    for (var d = 1; d <= days; d++) {
      var date = new Date(y, m, d);
      var key = iso(date);
      var dow = date.getDay();
      var cls = "cal__day";
      var title = "";
      var open = false;
      if (HOLIDAYS_2026[key]) { cls += " is-holiday"; title = HOLIDAYS_2026[key]; }
      else if (dow === 0 || dow === 6) { cls += " is-off"; }
      else if (date < new Date(today.getFullYear(), today.getMonth(), today.getDate())) { cls += " is-past"; }
      else if (isBooked(y, m, d)) { cls += " is-off"; title = "Fully booked"; }
      else { cls += " is-open"; open = true; title = MONTHS[m] + " " + d + " · enquire by email"; }
      if (key === iso(today)) cls += " is-today";
      if (open) {
        html += '<button class="' + cls + '" data-date="' + key + '" title="' + title + '">' + d + "</button>";
      } else {
        html += '<span class="' + cls + '"' + (title ? ' title="' + title + '"' : "") + ">" + d + "</span>";
      }
    }
    html += "</div>" +
      '<div class="cal__legend">' +
      '<span><i class="dot dot--open"></i>Open</span>' +
      '<span><i class="dot dot--today"></i>Today</span>' +
      '<span><i class="dot dot--off"></i>Unavailable</span>' +
      '<span><i class="dot dot--hol"></i>Public holiday</span>' +
      "</div>" +
      '<div class="cal__slots" aria-live="polite"></div>' +
      '<p class="cal__note">Pick an open date, then a time, and you reach us directly at <a href="mailto:hello@2birds.asia">hello@2birds.asia</a>.</p>' +
      "</div>";

    host.innerHTML = html;
    host.querySelectorAll(".cal__nav").forEach(function (b) {
      if (b.disabled) return;
      b.addEventListener("click", function () {
        view = new Date(view.getFullYear(), view.getMonth() + Number(b.dataset.nav), 1);
        render();
      });
    });
    host.querySelectorAll("[data-date]").forEach(function (b) {
      b.addEventListener("click", function () {
        host.querySelectorAll("[data-date]").forEach(function (x) { x.classList.remove("is-sel"); });
        b.classList.add("is-sel");
        renderSlots(b.dataset.date);
      });
    });
  }

  /* calendar styles, scoped */
  var css = document.createElement("style");
  css.textContent =
    ".cal{background:var(--ivory);border:1px solid var(--line);padding:clamp(22px,3vw,36px);}" +
    ".cal__head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:18px;}" +
    ".cal__title{font-family:var(--serif);font-size:1.25rem;font-weight:500;}" +
    ".cal__nav{font-size:20px;color:var(--ink-faint);padding:0 8px;transition:color .3s}" +
    ".cal__nav:hover{color:var(--olive)}" +
    ".cal__nav[disabled]{opacity:.25;cursor:not-allowed;}" +
    ".cal__grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;}" +
    ".cal__dow{font-size:10px;letter-spacing:.14em;color:var(--ink-faint);padding:6px 0;}" +
    ".cal__day{font-family:inherit;font-size:13px;padding:9px 0;border-radius:999px;color:var(--ink-soft);border:0;background:transparent;width:100%;}" +
    ".cal__day.is-open{color:var(--ink);background:rgba(151,146,101,.14);cursor:pointer;transition:background .25s,transform .25s;}" +
    ".cal__day.is-open:hover{background:rgba(151,146,101,.36);transform:translateY(-1px);}" +
    ".cal__day.is-off,.cal__day.is-past{color:var(--ink-faint);opacity:.55;}" +
    ".cal__day.is-holiday{color:var(--olive);box-shadow:inset 0 0 0 1px var(--olive-bright);}" +
    ".cal__day.is-today{background:var(--ink);color:var(--ivory);}" +
    ".cal__day.is-open.is-sel{background:var(--olive);color:var(--ivory);}" +
    ".cal__day.is-open.is-sel:hover{background:var(--olive);}" +
    ".cal__legend{display:flex;flex-wrap:wrap;gap:10px 20px;margin-top:20px;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-faint);}" +
    ".cal__legend span{display:inline-flex;align-items:center;gap:7px;}" +
    ".dot{width:9px;height:9px;border-radius:50%;display:inline-block;}" +
    ".dot--open{background:rgba(151,146,101,.5);}" +
    ".dot--today{background:var(--ink);}" +
    ".dot--off{background:rgba(35,34,30,.18);}" +
    ".dot--hol{border:1px solid var(--olive-bright);}" +
    ".cal__slots:empty{display:none;}" +
    ".cal__slots{margin-top:18px;padding-top:16px;border-top:1px solid var(--line);}" +
    ".cal__slotslabel{display:block;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--olive);margin-bottom:11px;}" +
    ".cal__slotgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;}" +
    ".cal__slot{font-family:inherit;font-size:12px;padding:10px 4px;border:1px solid var(--line);color:var(--ink);background:transparent;cursor:pointer;transition:border-color .25s,background .25s,transform .25s;}" +
    ".cal__slot:hover{border-color:var(--olive);background:rgba(151,146,101,.14);transform:translateY(-1px);}" +
    "@media(max-width:440px){.cal__slotgrid{grid-template-columns:repeat(3,1fr);}}" +
    ".cal__note{margin-top:16px;padding-top:14px;border-top:1px solid var(--line);font-size:11.5px;line-height:1.6;color:var(--ink-faint);}" +
    ".cal__note a{color:var(--olive);border-bottom:1px solid var(--olive-bright);}";
  document.head.appendChild(css);

  render();
})();
