/* =========================================================================
   2birds — i18n engine + region/language bar
   - Slim bar above the NavBar (see css/i18n.css)
   - Detects region from the browser, lets the visitor change it, persists it
   - Translates the page by swapping text on "leaf" text elements, and restores
     the English original when switched back. Re-applies after React re-renders.
   - Dictionaries register themselves via window.TBI18N.register(lang, obj)
     and are lazy-loaded from js/i18n-<lang>.js on demand.
   Brand palette only. Singapore & Malaysia (+ India, Philippines, Indonesia EN)
   are served in English by design.
   ========================================================================= */
(function () {
  "use strict";
  if (window.__TB_I18N_BOOTED) return;
  window.__TB_I18N_BOOTED = true;

  var STORAGE_KEY = "tb_locale_v1";

  /* ---------- real national flags (flagcdn) ----------------------------- */
  var FLAGCODE = {
    cn: "cn", jp: "jp", kr: "kr", hk: "hk", sg: "sg", my: "my", tw: "tw",
    th: "th", vn: "vn", id_en: "id", id: "id", "in": "in", ph: "ph"
  };
  function flagSVG(key) {
    var code = FLAGCODE[key] || "un";
    return '<img class="tb-flagimg" src="https://flagcdn.com/' + code +
      '.svg" alt="" loading="lazy" decoding="async" />';
  }

  /* ---------- locales (display order as requested) ---------------------- */
  // dict: BCP-47 dictionary id, or null for English (no translation).
  var LOCALES = [
    { key: "cn",    name: "中国大陆",        sub: "Mainland China · 简体中文",   dict: "zh-Hans" },
    { key: "jp",    name: "日本",            sub: "Japan · 日本語",              dict: "ja" },
    { key: "kr",    name: "대한민국",         sub: "South Korea · 한국어",        dict: "ko" },
    { key: "hk",    name: "香港特別行政區",   sub: "Hong Kong SAR · 繁體中文",    dict: "zh-Hant" },
    { key: "sg",    name: "Singapore",       sub: "English",                     dict: null },
    { key: "my",    name: "Malaysia",        sub: "English",                     dict: null },
    { key: "tw",    name: "台灣地區",         sub: "Taiwan · 繁體中文",           dict: "zh-Hant" },
    { key: "th",    name: "ประเทศไทย",       sub: "Thailand · ภาษาไทย",          dict: "th" },
    { key: "vn",    name: "Việt Nam",        sub: "Vietnam · Tiếng Việt",        dict: "vi" },
    { key: "id_en", name: "Indonesia",       sub: "English",                     dict: null },
    { key: "id",    name: "Indonesia",       sub: "Bahasa Indonesia",            dict: "id" },
    { key: "in",    name: "India",           sub: "English",                     dict: null },
    { key: "ph",    name: "Philippines",     sub: "English",                     dict: null }
  ];
  var BY_KEY = {};
  LOCALES.forEach(function (l) { BY_KEY[l.key] = l; });

  /* ---------- localized chrome (the bar/modal itself) ------------------- */
  var UI = {
    en:      { tag: "Across Asia", eyebrow: "Region &amp; Language", title: "Where are you <em>visiting from?</em>",
               note: "Choose your region to view the practice in your preferred language.",
               group: "Asia", close: "Close", choose: "Select region" },
    "zh-Hans": { tag: "亚洲各地", eyebrow: "地区与语言", title: "您从<em>何处</em>访问？",
               note: "请选择您所在的地区，以您偏好的语言浏览本所网站。",
               group: "亚洲", close: "关闭", choose: "选择地区" },
    "zh-Hant": { tag: "亞洲各地", eyebrow: "地區與語言", title: "您從<em>何處</em>造訪？",
               note: "請選擇您所在的地區，以您偏好的語言瀏覽本所網站。",
               group: "亞洲", close: "關閉", choose: "選擇地區" },
    ja:      { tag: "アジア各地", eyebrow: "地域と言語", title: "どちらから<em>ご覧</em>ですか？",
               note: "ご希望の言語で閲覧いただけるよう、地域をお選びください。",
               group: "アジア", close: "閉じる", choose: "地域を選択" },
    ko:      { tag: "아시아 전역", eyebrow: "지역 및 언어", title: "어디에서 <em>방문</em>하셨나요?",
               note: "원하시는 언어로 보실 수 있도록 지역을 선택해 주십시오.",
               group: "아시아", close: "닫기", choose: "지역 선택" },
    th:      { tag: "ทั่วเอเชีย", eyebrow: "ภูมิภาคและภาษา", title: "คุณเข้าชมจาก<em>ที่ใด?</em>",
               note: "โปรดเลือกภูมิภาคของท่านเพื่อรับชมในภาษาที่ท่านต้องการ",
               group: "เอเชีย", close: "ปิด", choose: "เลือกภูมิภาค" },
    vi:      { tag: "Khắp châu Á", eyebrow: "Khu vực &amp; Ngôn ngữ", title: "Bạn đang <em>truy cập từ đâu?</em>",
               note: "Vui lòng chọn khu vực của bạn để xem bằng ngôn ngữ ưa thích.",
               group: "Châu Á", close: "Đóng", choose: "Chọn khu vực" },
    id:      { tag: "Seluruh Asia", eyebrow: "Wilayah &amp; Bahasa", title: "Anda <em>mengunjungi dari mana?</em>",
               note: "Silakan pilih wilayah Anda untuk melihat dalam bahasa pilihan Anda.",
               group: "Asia", close: "Tutup", choose: "Pilih wilayah" }
  };
  function uiFor(dict) { return UI[dict] || UI.en; }

  /* ---------- detection ------------------------------------------------- */
  function detect() {
    var langs = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || "en"];
    for (var i = 0; i < langs.length; i++) {
      var L = (langs[i] || "").toLowerCase();
      if (L.indexOf("zh") === 0) {
        if (L.indexOf("tw") > -1) return "tw";
        if (L.indexOf("hk") > -1 || L.indexOf("mo") > -1) return "hk";
        if (L.indexOf("sg") > -1) return "sg";
        if (L.indexOf("hant") > -1) return "tw";
        return "cn";
      }
      if (L.indexOf("ja") === 0) return "jp";
      if (L.indexOf("ko") === 0) return "kr";
      if (L.indexOf("th") === 0) return "th";
      if (L.indexOf("vi") === 0) return "vn";
      if (L.indexOf("ms") === 0) return "my";
      if (L === "id" || L.indexOf("id-") === 0 || L.indexOf("in-id") === 0) return "id";
      if (L.indexOf("fil") === 0 || L.indexOf("tl") === 0 || L.indexOf("-ph") > -1) return "ph";
      if (L.indexOf("-sg") > -1) return "sg";
      if (L.indexOf("-my") > -1) return "my";
      if (L.indexOf("-in") > -1 || L === "hi" || L.indexOf("hi-") === 0) return "in";
    }
    return null; // default: English chrome, no banner translation
  }

  /* ---------- translation core ------------------------------------------ */
  var PHRASE_SEL = "h1,h2,h3,h4,h5,h6,p,li,a,button,span,blockquote,figcaption,dt,dd,summary,th,td,label,legend";
  var INLINE_OK = { EM: 1, STRONG: 1, B: 1, I: 1, U: 1, BR: 1, SUP: 1, SUB: 1, SMALL: 1, ABBR: 1, MARK: 1, WBR: 1, TIME: 1 };
  var ORIG = new WeakMap();           // el -> { key, html }
  var DICTS = {};                     // dictLang -> { normEnglish: translation }
  var pendingDict = null;

  function norm(s) { return (s || "").replace(/\s+/g, " ").trim(); }

  // The live editor wraps every text node in <span class="__om-t" data-om-text>
  // for direct editing. Those wrappers do not exist in production, so we treat
  // them as transparent: a child wrapper does not stop a heading/paragraph from
  // being a single translatable "leaf", and the wrappers are never translated
  // on their own. This keeps preview keys identical to production keys.
  function isOmWrapper(el) {
    return (el.classList && el.classList.contains("__om-t")) || el.hasAttribute("data-om-text");
  }
  function inlineChild(el) {
    return INLINE_OK[el.tagName] || isOmWrapper(el);
  }

  function isTranslatable(el) {
    if (isOmWrapper(el)) return false;
    if (el.closest(".tb-langbar") || el.closest(".tb-lb-overlay")) return false;
    var c = el.children, i;
    for (i = 0; i < c.length; i++) {
      if (!inlineChild(c[i])) return false;
    }
    var t = norm(el.textContent);
    if (!t) return false;
    return true;
  }

  function apply(dict) {
    var els = document.querySelectorAll(PHRASE_SEL), i, el, rec;
    for (i = 0; i < els.length; i++) {
      el = els[i];
      if (!isTranslatable(el)) continue;
      rec = ORIG.get(el);
      if (!rec) {
        rec = { key: norm(el.textContent), html: el.innerHTML };
        ORIG.set(el, rec);
      }
      if (dict && Object.prototype.hasOwnProperty.call(dict, rec.key)) {
        var tr = dict[rec.key];
        if (el.textContent !== tr) el.textContent = tr;
      } else if (el.innerHTML !== rec.html) {
        el.innerHTML = rec.html; // restore English (also covers untranslated keys)
      }
    }
  }

  /* ---------- mutation watcher (React re-renders) ----------------------- */
  var mo = null, moRaf = 0, applying = false;
  function startObserver() {
    if (!("MutationObserver" in window) || mo) return;
    mo = new MutationObserver(function () {
      if (applying || moRaf) return;
      moRaf = requestAnimationFrame(function () { moRaf = 0; render(false); });
    });
    var target = document.getElementById("root") || document.body;
    mo.observe(target, { childList: true, subtree: true });
  }

  /* ---------- state ----------------------------------------------------- */
  var current = null; // locale key

  function dictFor(key) { var l = BY_KEY[key]; return l ? l.dict : null; }

  function render(rebuildChrome) {
    var dl = dictFor(current);
    applying = true;
    if (!dl) {
      apply(null);
      document.documentElement.setAttribute("lang", "en");
    } else if (DICTS[dl]) {
      apply(DICTS[dl]);
      document.documentElement.setAttribute("lang", dl);
    } else {
      // lazy-load dictionary, then apply on register
      pendingDict = dl;
      loadDict(dl);
    }
    applying = false;
    if (rebuildChrome) refreshChrome();
  }

  function loadDict(dl) {
    if (document.querySelector('script[data-i18n-dict="' + dl + '"]')) return;
    var s = document.createElement("script");
    s.src = "js/i18n-" + dl + ".js";
    s.setAttribute("data-i18n-dict", dl);
    s.onerror = function () { /* fall back to English silently */ };
    document.head.appendChild(s);
  }

  // Dictionary files call this.
  window.TBI18N = window.TBI18N || {};
  window.TBI18N.register = function (lang, obj) {
    DICTS[lang] = Object.assign(DICTS[lang] || {}, obj);
    if (pendingDict === lang && dictFor(current) === lang) {
      pendingDict = null;
      applying = true; apply(DICTS[lang]); applying = false;
      document.documentElement.setAttribute("lang", lang);
    }
  };
  // For authoring: dump the unique translatable strings on this page.
  window.TBI18N.collect = function () {
    var els = document.querySelectorAll(PHRASE_SEL), set = {}, out = [], i, el, t;
    for (i = 0; i < els.length; i++) {
      el = els[i];
      if (!isTranslatable(el)) continue;
      t = norm(el.textContent);
      if (t && !set[t]) { set[t] = 1; out.push(t); }
    }
    return out;
  };

  /* ---------- chrome (bar + modal) -------------------------------------- */
  var bar, overlay, triggerEls = {};
  var GLOBE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18"/></svg>';
  var CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 9l6 6 6-6"/></svg>';
  var XICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>';

  function curLocale() { return BY_KEY[current] || null; }

  function buildBar() {
    bar = document.createElement("div");
    bar.className = "tb-langbar";
    bar.innerHTML =
      '<span class="tb-langbar__tag">' + GLOBE + '<span data-ui="tag"></span></span>' +
      '<button type="button" class="tb-langbar__trigger" aria-haspopup="dialog">' +
        '<span class="tb-langbar__flag" data-ui="flag"></span>' +
        '<span class="tb-langbar__cur">' +
          '<span class="tb-langbar__cur-name" data-ui="name"></span>' +
          '<span class="tb-langbar__cur-sub" data-ui="sub"></span>' +
        '</span>' + CHEV.replace("<svg", '<svg class="tb-langbar__chev"') +
      '</button>';
    document.body.insertBefore(bar, document.body.firstChild);
    triggerEls.tag = bar.querySelector('[data-ui="tag"]');
    triggerEls.flag = bar.querySelector('[data-ui="flag"]');
    triggerEls.name = bar.querySelector('[data-ui="name"]');
    triggerEls.sub = bar.querySelector('[data-ui="sub"]');
    bar.querySelector(".tb-langbar__trigger").addEventListener("click", openModal);
  }

  function buildModal() {
    overlay = document.createElement("div");
    overlay.className = "tb-lb-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    var rows = LOCALES.map(function (l) {
      return '<button type="button" class="tb-lb-item" data-key="' + l.key + '">' +
        '<span class="tb-lb-item__flag">' + flagSVG(l.key) + '</span>' +
        '<span class="tb-lb-item__txt">' +
          '<span class="tb-lb-item__name">' + l.name + '</span>' +
          '<span class="tb-lb-item__sub">' + l.sub + '</span>' +
        '</span>' +
        '<span class="tb-lb-item__check">' + CHECK + '</span>' +
      '</button>';
    }).join("");
    overlay.innerHTML =
      '<div class="tb-lb-card" role="document">' +
        '<div class="tb-lb-head">' +
          '<p class="tb-lb-eyebrow">' + GLOBE + '<span data-ui="eyebrow"></span></p>' +
          '<h2 class="tb-lb-title" data-ui="title"></h2>' +
          '<p class="tb-lb-note" data-ui="note"></p>' +
          '<button type="button" class="tb-lb-close" aria-label="Close">' + XICON + '</button>' +
        '</div>' +
        '<div class="tb-lb-scroll">' +
          '<div class="tb-lb-group" data-ui="group"></div>' + rows +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });
    overlay.querySelector(".tb-lb-close").addEventListener("click", closeModal);
    overlay.querySelectorAll(".tb-lb-item").forEach(function (btn) {
      btn.addEventListener("click", function () { choose(btn.getAttribute("data-key")); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) closeModal();
    });
  }

  function refreshChrome() {
    var loc = curLocale();
    var ui = uiFor(dictFor(current));
    // bar trigger
    if (loc) {
      triggerEls.flag.innerHTML = flagSVG(loc.key);
      triggerEls.flag.style.display = "";
      triggerEls.name.textContent = loc.name;
      triggerEls.sub.textContent = (loc.sub.split("·")[0] || "").trim() || loc.sub;
    } else {
      triggerEls.flag.style.display = "none";
      triggerEls.name.textContent = ui.choose;
      triggerEls.sub.textContent = "";
    }
    triggerEls.tag.textContent = ui.tag;
    // modal chrome
    overlay.querySelector('[data-ui="eyebrow"]').innerHTML = ui.eyebrow;
    overlay.querySelector('[data-ui="title"]').innerHTML = ui.title;
    overlay.querySelector('[data-ui="note"]').textContent = ui.note;
    overlay.querySelector('[data-ui="group"]').textContent = ui.group;
    overlay.querySelectorAll(".tb-lb-item").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-key") === current);
    });
  }

  function openModal() {
    refreshChrome();
    overlay.classList.add("is-open");
    bar.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    overlay.classList.remove("is-open");
    bar.classList.remove("is-open");
    document.body.style.overflow = "";
  }
  function choose(key) {
    current = key;
    try { localStorage.setItem(STORAGE_KEY, key); } catch (e) {}
    render(true);
    closeModal();
  }

  /* ---------- boot ------------------------------------------------------ */
  function boot() {
    var stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    current = (stored && BY_KEY[stored]) ? stored : detect();
    buildBar();
    buildModal();
    refreshChrome();
    render(false);
    startObserver();
    // a few re-applies as React mounts content after first paint
    [150, 500, 1200, 2400].forEach(function (t) { setTimeout(function () { render(false); }, t); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
