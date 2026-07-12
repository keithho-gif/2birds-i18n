/* 2birds i18n — runtime DOM translation.
   English is the source. Each language has a dictionary at js/i18n/<lang>.js
   (window.TB_DICT[lang] = { "English source": "translation", ... }), loaded on
   demand. The chosen language persists in localStorage across pages.
   Known limits (v1): dynamically-injected widget text (CASL modal, calendar,
   quiz) and paragraphs containing inline links are left in the source language. */
(function () {
  "use strict";
  var KEY = "tb_lang";
  var BASE = "en";
  window.TB_DICT = window.TB_DICT || {};

  /* leaf text elements + directly-selected anchors we translate */
  var SEL = [
    ".eyebrow", ".small-caps", ".display", ".h2", ".h3", "h1", "h2", "h3", "h4",
    ".lede", "figcaption", ".figcap",
    ".gcard__title", ".gcard__kicker", ".gcard__body", ".gcard__num",
    ".step__label", ".step__title", ".step__body",
    ".stats__label", ".stats__value", ".stats__note",
    ".acc__q", ".acc__body", ".bhero__scroll", ".cta__title", ".cta__sub",
    ".panel__title", ".panel__sub", ".panel__title--xl",
    "label", "option",
    ".nav__link", ".nav__cta", ".nav__region", ".nav__top a",
    ".footer__heading", ".footer__list a", ".secnav a", ".text-link", ".btn",
    ".rgn__title", ".rgn__sub", ".rgn__glabel"
  ].join(",");

  function norm(s) { return (s || "").replace(/\s+/g, " ").trim(); }

  /* an element is safe to translate whole only if it holds no link/other block */
  function safe(el) { return !el.querySelector("a, .arrow"); }

  function nodes() {
    var out = [];
    document.querySelectorAll(SEL).forEach(function (el) {
      if (!safe(el)) return;
      if (el.closest("[data-noi18n]")) return;   /* CASL register stays English */
      if (norm(el.textContent).length < 2) return;
      out.push(el);
    });
    return out;
  }

  /* every unique source string on this page — used to build the dictionaries */
  function collect() {
    var set = {};
    nodes().forEach(function (el) { set[norm(el.textContent)] = 1; });
    return Object.keys(set).sort();
  }

  function apply(lang) {
    var d = window.TB_DICT[lang];
    nodes().forEach(function (el) {
      if (el.__en == null) el.__en = el.textContent;
      if (lang === BASE || !d) { el.textContent = el.__en; return; }
      var tr = d[norm(el.__en)];
      el.textContent = tr || el.__en;
    });
    document.documentElement.lang = (lang === BASE ? "en" : lang);
  }

  function loadDict(lang, cb) {
    if (lang === BASE || window.TB_DICT[lang]) { cb(); return; }
    var s = document.createElement("script");
    s.src = "js/i18n/" + lang + ".js?v=1";
    s.onload = cb; s.onerror = cb;
    document.head.appendChild(s);
  }

  function setLang(lang) {
    lang = lang || BASE;
    try { localStorage.setItem(KEY, lang); } catch (e) {}
    loadDict(lang, function () { apply(lang); });
  }

  function boot() {
    /* snapshot English first so switching back always restores it */
    nodes().forEach(function (el) { if (el.__en == null) el.__en = el.textContent; });
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    if (saved && saved !== BASE) setLang(saved);
  }

  window.TB_I18N = { collect: collect, apply: apply, setLang: setLang, boot: boot };
  /* run after main.js has built the nav/footer (i18n.js is loaded after it) */
  if (document.readyState !== "loading") boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();
