/* 2birds — CASL directory (vanilla, data from casl-list.js: window.TB_CASL)
   v6 — card grid + detail modal, in the manner of the previous 2birds site. */
(function () {
  "use strict";
  var host = document.getElementById("tb-casl");
  if (!host || !window.TB_CASL) return;
  /* optional separate mount for the sector landscape (dark directory panel) */
  var scapeHost = document.getElementById("tb-casl-scape");

  var DATA = window.TB_CASL;
  var PAGE_SIZE = 12;

  var state = {
    q: "",
    industry: "",
    sort: "az",        /* az | za | group */
    shown: PAGE_SIZE
  };

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* sector landscape: counts per industry, descending; rank per industry */
  var counts = {};
  DATA.forEach(function (d) { counts[d.industry] = (counts[d.industry] || 0) + 1; });
  var industries = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
  var maxCount = counts[industries[0]] || 1;
  var rankOf = {};
  industries.forEach(function (ind, i) { rankOf[ind] = i + 1; });
  var landscapeExpanded = false;

  function depthPhrase(rank) {
    if (rank <= 4) return "a deep bench";
    if (rank <= 9) return "a solid bench";
    return "a narrow bench";
  }

  function filtered() {
    var q = state.q.toLowerCase();
    var rows = DATA.filter(function (d) {
      if (state.industry && d.industry !== state.industry) return false;
      if (q && (d.title + " " + d.desc + " " + d.industry + " " + (d.participants || "")).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    if (state.sort === "az") rows.sort(function (a, b) { return a.title.localeCompare(b.title); });
    if (state.sort === "za") rows.sort(function (a, b) { return b.title.localeCompare(a.title); });
    if (state.sort === "group") rows.sort(function (a, b) {
      return a.industry === b.industry ? a.title.localeCompare(b.title) : a.industry.localeCompare(b.industry);
    });
    return rows;
  }

  function renderLandscape() {
    var list = landscapeExpanded ? industries : industries.slice(0, 9);
    return '<div class="casl__scape' + (landscapeExpanded ? " is-full" : "") + '">' +
      list.map(function (ind) {
        var on = state.industry === ind;
        return '<button class="casl__bar' + (on ? " is-on" : "") + '" data-ind="' + esc(ind) + '">' +
          '<span class="casl__barname">' + esc(ind) + "</span>" +
          '<span class="casl__barline"><i style="width:' + Math.round((counts[ind] / maxCount) * 100) + '%"></i></span>' +
          '<span class="casl__barcount">' + counts[ind] + "</span></button>";
      }).join("") +
      "</div>" +
      (industries.length > 9
        ? '<button class="casl__more" data-expand>' + (landscapeExpanded ? "Show fewer industries ↑" : "Show all " + industries.length + " industries ↓") + "</button>"
        : "");
  }

  function renderControls() {
    return '<div class="casl__controls">' +
      '<div class="field"><label>Search</label><input id="casl-q" type="search" value="' + esc(state.q) + '" placeholder="Skill, keyword…" /></div>' +
      '<div class="field"><label>Industry</label><select id="casl-ind"><option value="">All industries</option>' +
      industries.map(function (i) {
        return '<option' + (state.industry === i ? " selected" : "") + ">" + esc(i) + "</option>";
      }).join("") +
      "</select></div>" +
      '<div class="field"><label>Sort</label><select id="casl-sort">' +
      '<option value="az"' + (state.sort === "az" ? " selected" : "") + ">Title · A to Z</option>" +
      '<option value="za"' + (state.sort === "za" ? " selected" : "") + ">Title · Z to A</option>" +
      '<option value="group"' + (state.sort === "group" ? " selected" : "") + ">Group by industry</option>" +
      "</select></div></div>";
  }

  function pinSvg(on) {
    return '<svg viewBox="0 0 24 24" width="15" height="15" fill="' + (on ? "currentColor" : "none") + '" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3.5h10a1 1 0 0 1 1 1V21l-6-3.7L6 21V4.5a1 1 0 0 1 1-1z"/></svg>';
  }

  function renderResults(rows) {
    var pinned = window.TBWorklist ? window.TBWorklist.read() : [];
    var slice = rows.slice(0, state.shown);
    var lastGroup = null;
    var cards = slice.map(function (d) {
      var group = "";
      if (state.sort === "group" && d.industry !== lastGroup) {
        lastGroup = d.industry;
        group = '<div class="caslr__group">' + esc(d.industry) + "</div>";
      }
      var isPinned = pinned.indexOf(d.title) >= 0;
      return group +
        '<article class="caslr__card" data-skill="' + esc(d.title) + '" tabindex="0" role="button" aria-label="View ' + esc(d.title) + '">' +
        '<div class="caslr__cardhead">' +
        '<span class="caslr__sector">' + esc(d.industry) + "</span>" +
        '<button class="caslr__pin' + (isPinned ? " is-on" : "") + '" data-pin="' + esc(d.title) + '" title="' + (isPinned ? "Remove from working list" : "Pin to working list") + '">' + pinSvg(isPinned) + "</button>" +
        "</div>" +
        '<h4 class="caslr__title">' + esc(d.title) + "</h4>" +
        '<p class="caslr__desc">' + esc(d.desc) + "</p>" +
        '<span class="caslr__view">View skill · develop the course <i>→</i></span>' +
        "</article>";
    }).join("");

    return '<div class="caslr__meta"><span>' + (state.industry ? esc(state.industry) : "The full directory") + "</span>" +
      '<span class="caslr__count"><strong>' + rows.length + "</strong> skills shown</span></div>" +
      '<div class="caslr__grid">' + cards + "</div>" +
      (rows.length > state.shown
        ? '<div class="caslr__foot"><button class="caslr__morebtn" data-more>Show ' + Math.min(PAGE_SIZE, rows.length - state.shown) + " more</button>" +
          '<span class="caslr__paging">Showing ' + Math.min(state.shown, rows.length) + " of " + rows.length + "</span></div>"
        : "") +
      (rows.length === 0 ? '<p class="caslr__empty">Nothing in the directory answers that search. Try a broader word, or clear the industry filter.</p>' : "");
  }

  /* ---------- detail modal ---------- */
  var overlay = null;

  function miniChart(current) {
    return '<div class="caslm__chart" aria-hidden="true">' +
      industries.map(function (ind) {
        var h = Math.max(8, Math.round((counts[ind] / maxCount) * 56));
        return '<i class="' + (ind === current ? "is-on" : "") + '" style="height:' + h + 'px"></i>';
      }).join("") +
      "</div>";
  }

  /* extra intended-participant roles per sector, appended to the directory's own */
  var SECTOR_ROLES = {
    engineering: ["Plant supervisors", "Maintenance leads", "Production engineers"],
    ict: ["IT managers", "Systems analysts", "Data specialists"],
    finance: ["Finance managers", "Risk officers", "Internal auditors"],
    business: ["Operations managers", "Quality leads", "Team supervisors"],
    humancapital: ["HR business partners", "Learning and development leads", "People managers"],
    media: ["Creative leads", "Content producers", "Brand managers"],
    healthcare: ["Care team leads", "Clinical supervisors", "Allied health professionals"],
    marine: ["Operations officers", "Logistics coordinators", "Fleet supervisors"],
    legal: ["Compliance officers", "Legal executives", "Regulatory leads"],
    food: ["Outlet managers", "Service leads", "Kitchen supervisors"],
    procurement: ["Procurement leads", "Supply chain officers", "Category managers"],
    built: ["Project managers", "Sustainability leads", "Facilities managers"],
    security: ["Operations commanders", "Safety officers", "Response team leads"],
    marketing: ["Marketing managers", "Retail leads", "Customer experience officers"]
  };

  function participantsFor(d) {
    var base = (d.participants || "").split("·").map(function (p) { return p.trim(); }).filter(Boolean);
    var extra = SECTOR_ROLES[d.industryId] || ["Team leads", "Frontline supervisors", "New joiners in the field"];
    var out = base.slice();
    extra.forEach(function (r) { if (out.indexOf(r) < 0) out.push(r); });
    return out.slice(0, base.length + 3);
  }

  function shortSector(s) { return s.split(",")[0].split("&")[0].trim(); }

  /* concepts a course on this skill would cover, drawn from its own CASL
     description so the list is specific to each skill rather than generic */
  function courseCovers(d) {
    var desc = (d.desc || "").replace(/\s+/g, " ").trim().replace(/\binustry\b/g, "industry");
    if (!desc) return [];
    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
    function clip(s) { var w = s.split(" "); return w.length <= 16 ? s : w.slice(0, 14).join(" ") + "…"; }
    function keep(list, p) {
      p = p.trim().replace(/^[,;.\s]+|[,;.\s]+$/g, "").replace(/^(and|or|as well as)\s+/i, "");
      var w = p.split(" ").length;
      if (w >= 2 && w <= 16 && p.length > 7) list.push(cap(p));
    }
    var out = [];
    desc.split(/\s+to\s+|\s+for\s+|\s+in order to\s+|\.\s+|;\s+|\s+this includes\s+|\s+this involves\s+|,?\s+including\s+|,?\s+such as\s+|\s+which includes\s+/i)
      .forEach(function (p) { keep(out, p); });
    if (out.length === 0) desc.split(/,\s+/).forEach(function (p) { keep(out, p); });
    if (out.length === 0) out.push(cap(clip(desc)));
    return out.filter(function (v, i) { return out.indexOf(v) === i; }).slice(0, 4);
  }

  function openModal(d) {
    closeModal();
    var pinned = window.TBWorklist ? window.TBWorklist.read() : [];
    var isPinned = pinned.indexOf(d.title) >= 0;
    var rank = rankOf[d.industry];
    var inSector = counts[d.industry];
    var chips = participantsFor(d);
    var covers = courseCovers(d);

    overlay = document.createElement("div");
    overlay.className = "caslm";
    overlay.innerHTML =
      '<div class="caslm__sheet" role="dialog" aria-modal="true" aria-label="' + esc(d.title) + '">' +
      '<button class="caslm__close" data-close aria-label="Close">×</button>' +

      '<header class="caslm__head">' +
      '<span class="caslm__mono">' + esc(d.title.charAt(0)) + "</span>" +
      "<div>" +
      '<div class="caslm__pills"><span class="caslm__pill">Current · In force</span><span class="caslm__sector">' + esc(d.industry) + "</span></div>" +
      '<h3 class="caslm__title">' + esc(d.title) + "</h3>" +
      "</div></header>" +

      '<div class="caslm__stats">' +
      '<div><strong>' + rank + " of 14</strong><span>Sector rank by depth</span></div>" +
      '<div><strong>' + inSector + "</strong><span>Skills in this sector</span></div>" +
      '<div><strong>369</strong><span>In the directory</span></div>' +
      "</div>" +

      '<div class="caslm__cols">' +
      '<div class="caslm__main">' +
      '<span class="caslm__label">Skills description</span>' +
      '<p class="caslm__desc">' + esc(d.desc) + "</p>" +
      (chips.length ? '<span class="caslm__label">Intended participants</span><div class="caslm__chips">' +
        chips.map(function (c) { return '<span class="caslm__chip">' + esc(c) + "</span>"; }).join("") + "</div>" : "") +
      '<span class="caslm__label">Directory status</span>' +
      '<div class="caslm__timeline">' +
      '<div class="caslm__stop is-done"><i></i><b>2 May 2026</b><span>In the directory</span></div>' +
      '<div class="caslm__stop is-now"><i></i><b>Today</b><span>In force</span></div>' +
      '<div class="caslm__stop"><i></i><b>Q3 2026</b><span>Carried into this edition</span></div>' +
      "</div>" +
      "</div>" +

      '<aside class="caslm__rail">' +
      '<span class="caslm__label">What a course would cover</span>' +
      '<p class="caslm__read">One approved skill is enough to anchor a whole course. For this one, the work would cover:</p>' +
      '<ul class="caslm__ways">' + covers.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("") + "</ul>" +
      '<hr class="caslm__rule" />' +
      '<p class="caslm__fine">We turn each into an assessable learning outcome, then build the lessons, practice and assessment around it, funded under WSQ or certifiable against the CASL.</p>' +
      "</aside>" +
      "</div>" +

      '<footer class="caslm__actions">' +
      '<a class="caslm__cta" href="mailto:hello@2birds.asia?subject=' + encodeURIComponent("Course development enquiry · " + d.title) + '">Develop this course with 2birds</a>' +
      '<button class="caslm__ghost" data-modalpin="' + esc(d.title) + '">' + pinSvg(isPinned) + "<span>" + (isPinned ? "Pinned to working list" : "Pin to working list") + "</span></button>" +
      "</footer>" +
      '<p class="caslm__foot">We reply to enquiries within two working days during Singapore business hours. All proposals are subject to a no-obligation scoping call.</p>' +
      "</div>";

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(function () { overlay.classList.add("is-open"); });

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay || e.target.closest("[data-close]")) closeModal();
    });
    var mp = overlay.querySelector("[data-modalpin]");
    mp.addEventListener("click", function () {
      togglePin(d.title);
      var on = (window.TBWorklist.read()).indexOf(d.title) >= 0;
      mp.innerHTML = pinSvg(on) + "<span>" + (on ? "Pinned to working list" : "Pin to working list") + "</span>";
      mp.classList.toggle("is-on", on);
    });
    document.addEventListener("keydown", escClose);
    overlay.querySelector(".caslm__close").focus();
  }

  function escClose(e) { if (e.key === "Escape") closeModal(); }

  function closeModal() {
    if (!overlay) return;
    document.removeEventListener("keydown", escClose);
    document.body.style.overflow = "";
    var o = overlay;
    overlay = null;
    o.classList.remove("is-open");
    setTimeout(function () { o.remove(); }, 220);
  }

  function togglePin(title) {
    var pinned = window.TBWorklist.read();
    if (pinned.indexOf(title) >= 0) pinned = pinned.filter(function (x) { return x !== title; });
    else pinned = pinned.concat([title]);
    window.TBWorklist.write(pinned);
    /* refresh card pins without a full re-render */
    host.querySelectorAll('[data-pin="' + CSS.escape(title) + '"]').forEach(function (b) {
      var on = pinned.indexOf(title) >= 0;
      b.classList.toggle("is-on", on);
      b.innerHTML = pinSvg(on);
      b.title = on ? "Remove from working list" : "Pin to working list";
    });
  }

  /* ---------- render + bind ---------- */
  function render() {
    var rows = filtered();
    if (scapeHost) {
      scapeHost.innerHTML = renderLandscape();
      host.innerHTML = renderControls() + '<div id="casl-results">' + renderResults(rows) + "</div>";
    } else {
      host.innerHTML = renderLandscape() + renderControls() + '<div id="casl-results">' + renderResults(rows) + "</div>";
    }
    bind();
  }

  function rerenderResults() {
    var wrap = host.querySelector("#casl-results");
    wrap.innerHTML = renderResults(filtered());
    bindResults();
  }

  function bind() {
    var scRoot = scapeHost || host;
    scRoot.querySelectorAll("[data-ind]").forEach(function (b) {
      b.addEventListener("click", function () {
        state.industry = state.industry === b.dataset.ind ? "" : b.dataset.ind;
        state.shown = PAGE_SIZE;
        render();
      });
    });
    var expand = scRoot.querySelector("[data-expand]");
    if (expand) expand.addEventListener("click", function () {
      landscapeExpanded = !landscapeExpanded;
      render();
    });

    var q = host.querySelector("#casl-q");
    q.addEventListener("input", function () {
      state.q = q.value;
      state.shown = PAGE_SIZE;
      rerenderResults();
    });
    host.querySelector("#casl-ind").addEventListener("change", function (e) {
      state.industry = e.target.value; state.shown = PAGE_SIZE; render();
    });
    host.querySelector("#casl-sort").addEventListener("change", function (e) {
      state.sort = e.target.value; rerenderResults();
    });
    bindResults();
  }

  function bindResults() {
    host.querySelectorAll(".caslr__card").forEach(function (card) {
      card.addEventListener("click", function (e) {
        if (e.target.closest("[data-pin]")) return;
        var d = DATA.filter(function (x) { return x.title === card.dataset.skill; })[0];
        if (d) openModal(d);
      });
      card.addEventListener("keydown", function (e) {
        if ((e.key === "Enter" || e.key === " ") && !e.target.closest("[data-pin]")) {
          e.preventDefault();
          var d = DATA.filter(function (x) { return x.title === card.dataset.skill; })[0];
          if (d) openModal(d);
        }
      });
    });
    host.querySelectorAll("[data-pin]").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        togglePin(b.dataset.pin);
      });
    });
    var more = host.querySelector("[data-more]");
    if (more) more.addEventListener("click", function () {
      state.shown += PAGE_SIZE;
      rerenderResults();
    });
  }

  /* ---------- styles ---------- */
  var css = document.createElement("style");
  css.textContent =
    /* sector landscape (dark ground styling supplied by the page) */
    ".casl__scape{border-top:1px solid var(--line);}" +
    ".casl__bar{width:100%;display:grid;grid-template-columns:minmax(150px,280px) 1fr 44px;gap:18px;align-items:center;padding:13px 6px;border-bottom:1px solid var(--line);text-align:left;font-size:13.5px;color:var(--ink-soft);transition:background .3s;}" +
    ".casl__bar:hover{background:rgba(35,34,30,.03);}" +
    ".casl__bar.is-on{background:var(--sage);color:var(--ink);}" +
    ".casl__barline{height:2px;background:rgba(35,34,30,.08);position:relative;}" +
    ".casl__barline i{position:absolute;left:0;top:0;bottom:0;background:var(--olive);}" +
    ".casl__barcount{font-family:var(--serif);color:var(--olive);text-align:right;}" +
    "@media(max-width:640px){.casl__bar{grid-template-columns:1fr 44px;}.casl__barline{display:none;}}" +
    ".casl__more{margin-top:16px;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--olive);}" +
    /* expanded chart flows into two columns so it grows one row, not five */
    "@media(min-width:861px){.casl__scape.is-full{display:grid;grid-template-columns:1fr 1fr;column-gap:clamp(24px,4vw,56px);}}" +
    ".casl__controls{display:grid;grid-template-columns:2fr 1.4fr 1fr;gap:22px;margin:38px 0 8px;}" +
    "@media(max-width:860px){.casl__controls{grid-template-columns:1fr 1fr;}}" +
    "@media(max-width:520px){.casl__controls{grid-template-columns:1fr;}}" +

    /* results meta row (sits on the navy ground) */
    ".caslr__meta{display:flex;justify-content:space-between;align-items:baseline;gap:18px;margin:26px 0 18px;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.62);}" +
    ".caslr__count{letter-spacing:.06em;text-transform:none;font-size:13px;color:rgba(255,255,255,.65);}" +
    ".caslr__count strong{font-family:var(--serif);font-size:1.5rem;color:#fff;font-weight:500;font-style:italic;margin-right:6px;}" +

    /* card grid — ivory cards on navy */
    ".caslr__grid{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(14px,1.8vw,24px);}" +
    "@media(max-width:1020px){.caslr__grid{grid-template-columns:repeat(2,1fr);}}" +
    "@media(max-width:680px){.caslr__grid{grid-template-columns:1fr;}}" +
    ".caslr__group{grid-column:1/-1;font-size:10.5px;letter-spacing:.24em;text-transform:uppercase;color:var(--olive-bright);padding-top:16px;}" +
    ".caslr__card{background:#FFFFFF;padding:clamp(22px,2.4vw,30px);display:flex;flex-direction:column;gap:12px;cursor:pointer;transition:transform .35s var(--ease,ease),box-shadow .35s;}" +
    ".caslr__card:hover{transform:translateY(-3px);box-shadow:0 18px 40px rgba(0,0,0,.28);}" +
    ".caslr__card:focus-visible{outline:2px solid var(--olive-bright);outline-offset:3px;}" +
    ".caslr__cardhead{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;}" +
    ".caslr__sector{font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--olive);font-weight:500;line-height:1.6;}" +
    ".caslr__pin{color:var(--ink-faint);flex:none;transition:color .25s,transform .25s;}" +
    ".caslr__pin:hover{color:var(--olive);transform:translateY(-1px);}" +
    ".caslr__pin.is-on{color:var(--olive);}" +
    ".caslr__title{font-family:var(--serif);font-weight:500;font-size:1.22rem;line-height:1.3;color:var(--ink);}" +
    ".caslr__desc{font-size:13px;line-height:1.7;color:var(--ink-soft);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}" +
    ".caslr__view{margin-top:auto;padding-top:14px;border-top:1px solid var(--line);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--olive);display:flex;justify-content:space-between;align-items:center;}" +
    ".caslr__view i{font-style:normal;transition:transform .3s;}" +
    ".caslr__card:hover .caslr__view i{transform:translateX(4px);}" +
    ".caslr__foot{display:flex;align-items:center;justify-content:center;gap:22px;margin-top:34px;}" +
    ".caslr__morebtn{border:1px solid rgba(255,255,255,.3);color:#fff;padding:14px 30px;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;transition:all .3s;}" +
    ".caslr__morebtn:hover{border-color:#fff;background:rgba(255,255,255,.08);}" +
    ".caslr__paging{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.62);}" +
    ".caslr__empty{margin-top:26px;color:rgba(255,255,255,.6);font-size:14px;}" +

    /* detail modal */
    ".caslm{position:fixed;inset:0;z-index:200;background:rgba(14,13,10,.6);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:clamp(12px,3vw,40px);opacity:0;transition:opacity .22s ease;overflow-y:auto;}" +
    ".caslm.is-open{opacity:1;}" +
    ".caslm__sheet{position:relative;background:#FFFFFF;width:min(1000px,100%);max-height:92vh;overflow-y:auto;padding:clamp(26px,3.4vw,48px);transform:translateY(14px);transition:transform .22s ease;margin:auto;}" +
    ".caslm.is-open .caslm__sheet{transform:none;}" +
    ".caslm__close{position:absolute;top:14px;right:18px;font-size:26px;line-height:1;color:var(--ink-faint);transition:color .25s;}" +
    ".caslm__close:hover{color:var(--ink);}" +
    ".caslm__head{display:flex;gap:20px;align-items:center;}" +
    ".caslm__mono{flex:none;width:58px;height:58px;border:1px solid var(--line);border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--serif);font-size:1.5rem;color:var(--olive);}" +
    ".caslm__pills{display:flex;gap:14px;align-items:center;flex-wrap:wrap;}" +
    ".caslm__pill{font-size:9px;letter-spacing:.18em;text-transform:uppercase;padding:5px 12px;border:1px solid var(--olive-bright);border-radius:999px;color:var(--olive);}" +
    ".caslm__sector{font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-faint);}" +
    ".caslm__title{font-family:var(--serif);font-weight:500;font-size:clamp(1.5rem,2.6vw,2.1rem);line-height:1.2;margin-top:8px;color:var(--ink);}" +
    ".caslm__stats{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid var(--line);margin-top:clamp(20px,2.6vw,32px);}" +
    ".caslm__stats>div{padding:16px 18px;text-align:center;}" +
    ".caslm__stats>div+div{border-left:1px solid var(--line);}" +
    ".caslm__stats strong{display:block;font-family:var(--serif);font-weight:500;font-size:1.35rem;color:var(--ink);}" +
    ".caslm__stats span{display:block;margin-top:5px;font-size:8.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-faint);}" +
    ".caslm__cols{display:grid;grid-template-columns:minmax(0,7fr) minmax(0,4fr);gap:clamp(24px,3vw,44px);margin-top:clamp(22px,3vw,36px);}" +
    "@media(max-width:760px){.caslm__cols{grid-template-columns:1fr;}}" +
    ".caslm__label{display:block;font-size:9.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--olive);margin:22px 0 10px;font-weight:500;}" +
    ".caslm__main .caslm__label:first-child{margin-top:0;}" +
    ".caslm__desc{font-size:14.5px;line-height:1.8;color:var(--ink-soft);}" +
    ".caslm__chips{display:flex;gap:8px;flex-wrap:wrap;align-items:flex-start;}" +
    ".caslm__chip{font-size:11.5px;padding:8px 16px;border:1px solid var(--line);border-radius:999px;color:var(--ink);background:var(--bone);white-space:nowrap;}" +
    ".caslm__ways{list-style:none;margin:12px 0 0;padding:0;}" +
    ".caslm__ways li{position:relative;padding:11px 0 11px 20px;border-top:1px solid var(--line);font-size:13px;line-height:1.6;color:var(--ink);}" +
    ".caslm__ways li:first-child{border-top:0;padding-top:2px;}" +
    ".caslm__ways li::before{content:\"\";position:absolute;left:2px;top:1.35em;width:6px;height:6px;border:1px solid var(--olive);border-radius:50%;}" +
    ".caslm__ways li:first-child::before{top:.55em;}" +
    ".caslm__timeline{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:4px;}" +
    ".caslm__stop{position:relative;padding-top:18px;}" +
    ".caslm__stop::before{content:\"\";position:absolute;top:5px;left:14px;right:-10px;border-top:1px dashed var(--line);}" +
    ".caslm__stop:last-child::before{right:14px;}" +
    ".caslm__stop i{position:absolute;top:0;left:0;width:11px;height:11px;border-radius:50%;border:1px solid var(--olive);background:transparent;}" +
    ".caslm__stop.is-done i{background:var(--olive);}" +
    ".caslm__stop.is-now i{background:var(--ink);border-color:var(--ink);}" +
    ".caslm__stop b{display:block;font-family:var(--serif);font-weight:500;font-size:.95rem;color:var(--ink);}" +
    ".caslm__stop span{display:block;margin-top:3px;font-size:8.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-faint);}" +
    ".caslm__rail{background:var(--bone);padding:clamp(18px,2.2vw,28px);align-self:start;}" +
    ".caslm__rail .caslm__label{margin-top:0;}" +
    ".caslm__chart{display:flex;align-items:flex-end;gap:4px;height:56px;margin:6px 0 14px;}" +
    ".caslm__chart i{flex:1;background:var(--line);}" +
    ".caslm__chart i.is-on{background:var(--olive);}" +
    ".caslm__read{font-size:13px;line-height:1.7;color:var(--ink-soft);}" +
    ".caslm__read strong{color:var(--ink);font-weight:600;}" +
    ".caslm__rule{border:0;border-top:1px solid var(--line);margin:16px 0;}" +
    ".caslm__note{font-size:12.5px;line-height:1.7;color:var(--ink-soft);}" +
    ".caslm__fine{margin-top:12px;font-size:11.5px;line-height:1.7;font-style:italic;color:var(--ink-faint);}" +
    ".caslm__actions{display:flex;gap:14px;flex-wrap:wrap;margin-top:clamp(24px,3vw,36px);}" +
    ".caslm__cta{background:var(--royal);color:#fff;padding:16px 30px;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;transition:background .3s;}" +
    ".caslm__cta:hover{background:#0F1A42;}" +
    ".caslm__ghost{display:inline-flex;align-items:center;gap:10px;border:1px solid var(--line);padding:16px 26px;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink);transition:border-color .3s;}" +
    ".caslm__ghost:hover{border-color:var(--ink);}" +
    ".caslm__ghost.is-on{color:var(--olive);border-color:var(--olive-bright);}" +
    ".caslm__foot{margin-top:16px;font-size:11px;font-style:italic;color:var(--ink-faint);}" +
    /* modal on small screens: stat strip stacks, timeline runs vertically, buttons go full width */
    "@media(max-width:560px){" +
    ".caslm__stats{grid-template-columns:1fr;}" +
    ".caslm__stats>div{display:flex;justify-content:space-between;align-items:baseline;text-align:left;padding:13px 16px;}" +
    ".caslm__stats>div+div{border-left:0;border-top:1px solid var(--line);}" +
    ".caslm__stats span{margin-top:0;}" +
    ".caslm__timeline{grid-template-columns:1fr;gap:18px;}" +
    ".caslm__stop{padding-top:0;padding-left:26px;}" +
    ".caslm__stop::before{left:5px;top:14px;bottom:-18px;right:auto;border-top:0;border-left:1px dashed var(--line);}" +
    ".caslm__stop:last-child::before{display:none;}" +
    ".caslm__stop i{top:2px;}" +
    ".caslm__head{align-items:flex-start;}" +
    ".caslm__actions{flex-direction:column;}" +
    ".caslm__cta,.caslm__ghost{width:100%;text-align:center;justify-content:center;}" +
    "}";
  document.head.appendChild(css);

  render();
})();
