/* 2birds i18n — runtime translation.
   English is the source. Each language has a dictionary at js/i18n/<lang>.js
   (window.TB_DICT[lang] = { "English source": "translation", ... }), loaded on
   demand. The chosen language persists in localStorage across pages.

   Translation is unit-based. A "unit" is the outermost element whose only child
   elements are inline (em, strong, a, span, br ...) — a heading, paragraph, list
   item, cell or caption. A unit with no link/line-break/icon is translated whole,
   so word order is correct in every language and its English markup is restored
   from a cached innerHTML when switching back. A unit that carries a link, an
   arrow, a <br> or an icon is translated one text node at a time instead, so that
   markup survives. Widget text that renders after load (calendar, OR register,
   quiz, TPQA) is picked up by a MutationObserver. Anything inside [data-noi18n]
   stays in English: the CASL register, the legal pages, the organisation list,
   the sector taxonomy. */
(function () {
  "use strict";
  var KEY = "tb_lang", BASE = "en", DV = "3";
  window.TB_DICT = window.TB_DICT || {};
  var lang = BASE, observer = null, queued = false;

  function norm(s) { return (s || "").replace(/\s+/g, " ").trim(); }

  var BLOCK = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 1, PRE: 1, SVG: 1 };

  /* inline elements that may sit inside a text unit without making it a container */
  var INLINE = {
    EM: 1, STRONG: 1, B: 1, I: 1, U: 1, SPAN: 1, MARK: 1, SMALL: 1, SUP: 1, SUB: 1,
    ABBR: 1, A: 1, BR: 1, WBR: 1, TIME: 1, CITE: 1, Q: 1, S: 1, DEL: 1, INS: 1, BDI: 1
  };
  function allInline(el) {
    if (!el || el.nodeType !== 1) return false;
    var c = el.children;
    for (var i = 0; i < c.length; i++) { if (!INLINE[c[i].nodeName]) return false; }
    return /\p{L}/u.test(el.textContent);
  }

  /* bare typographic emphasis — the only children a unit may hold and still be
     translated whole (flattened). A link, a <br>, an icon, or any classed/nested
     span means the unit holds distinct pieces, so it is translated node by node. */
  var TYPO = {
    EM: 1, STRONG: 1, B: 1, I: 1, U: 1, MARK: 1, SMALL: 1, SUP: 1, SUB: 1,
    ABBR: 1, CITE: 1, Q: 1, S: 1, DEL: 1, INS: 1, WBR: 1, BDI: 1, TIME: 1
  };
  function flattenable(el) {
    var c = el.children;
    for (var i = 0; i < c.length; i++) {
      var ch = c[i];
      if (!TYPO[ch.nodeName] || ch.className || ch.children.length) return false;
    }
    return true;
  }

  function isUnit(el) {
    if (BLOCK[el.nodeName] || !allInline(el)) return false;
    var p = el.parentElement;                       /* skip if an ancestor unit covers it */
    if (p && !BLOCK[p.nodeName] && allInline(p)) return false;
    if (el.closest("[data-noi18n]")) return false;
    return norm(el.textContent).length >= 2;
  }

  function units() {
    var out = [], all = document.body ? document.body.getElementsByTagName("*") : [];
    for (var i = 0; i < all.length; i++) { if (isUnit(all[i])) out.push(all[i]); }
    return out;
  }

  function okText(n) {
    var t = n.nodeValue;
    if (!t || !/\p{L}/u.test(t) || norm(t).length < 2) return false;
    var p = n.parentNode;
    if (!p || p.nodeType !== 1 || BLOCK[p.nodeName]) return false;
    return !p.closest("[data-noi18n]");
  }
  function textNodes(el, fn) {
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false), n;
    while ((n = w.nextNode())) { if (okText(n)) fn(n); }
  }

  /* every unique source string on this page — used to build the dictionaries */
  function collect() {
    var set = {};
    units().forEach(function (el) {
      if (flattenable(el)) { set[norm(el.textContent)] = 1; }
      else { textNodes(el, function (n) { set[norm(n.nodeValue)] = 1; }); }
    });
    return Object.keys(set).sort();
  }

  function tr(key) {
    var d = window.TB_DICT[lang];
    return (lang === BASE || !d) ? null : d[key];
  }

  function putWhole(el) {
    if (el.__html == null) { el.__html = el.innerHTML; el.__key = norm(el.textContent); }
    var t = tr(el.__key);
    if (t) { if (el.textContent !== t) el.textContent = t; }
    else if (el.innerHTML !== el.__html) { el.innerHTML = el.__html; }   /* English / no match */
  }

  function putNode(n) {
    if (n.__en == null) n.__en = n.nodeValue;
    var raw = n.__en, t = tr(norm(raw));
    if (!t) { if (n.nodeValue !== raw) n.nodeValue = raw; return; }
    var lead = (raw.match(/^\s+/) || [""])[0], tail = (raw.match(/\s+$/) || [""])[0];
    var val = lead + t + tail;                        /* keep spacing around inline tags */
    if (n.nodeValue !== val) n.nodeValue = val;
  }

  function apply() {
    if (observer) observer.disconnect();              /* our own writes must not re-trigger us */
    units().forEach(function (el) {
      if (flattenable(el)) putWhole(el);
      else textNodes(el, putNode);
    });
    document.documentElement.lang = (lang === BASE ? "en" : lang);
    if (observer) observer.observe(document.body, { childList: true, subtree: true });
  }

  function schedule() {
    if (queued) return; queued = true;
    setTimeout(function () { queued = false; apply(); }, 60);
  }

  function watch() {
    if (observer || typeof MutationObserver === "undefined" || !document.body) return;
    observer = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        if (muts[i].addedNodes && muts[i].addedNodes.length) { schedule(); return; }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function loadDict(cb) {
    if (lang === BASE || window.TB_DICT[lang]) { cb(); return; }
    var s = document.createElement("script");
    s.src = "js/i18n/" + lang + ".js?v=" + DV;
    s.onload = cb; s.onerror = cb;
    document.head.appendChild(s);
  }

  function setLang(l) {
    lang = l || BASE;
    try { localStorage.setItem(KEY, lang); } catch (e) {}
    loadDict(function () { apply(); watch(); });
  }

  function boot() {
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    if (saved && saved !== BASE) setLang(saved);
  }

  window.TB_I18N = {
    collect: collect, apply: apply, setLang: setLang, boot: boot,
    get lang() { return lang; }
  };
  /* runs after main.js has built the nav/footer (i18n.js is loaded after it) */
  if (document.readyState !== "loading") boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();
