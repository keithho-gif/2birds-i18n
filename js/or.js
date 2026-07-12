/* 2birds — Organisation Registration register (vanilla, data from or-list.js) */
(function () {
  "use strict";
  var host = document.getElementById("tb-or");
  if (!host || !window.TB_OR_STAGES) return;

  var current = window.TB_OR_STAGES[0].id;

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function render() {
    var stage = window.TB_OR_STAGES.find(function (s) { return s.id === current; });
    host.innerHTML =
      '<div class="or__tabs">' +
      window.TB_OR_STAGES.map(function (s) {
        return '<button class="or__tab' + (s.id === current ? " is-on" : "") + '" data-id="' + s.id + '">' +
          '<span class="small-caps">' + esc(s.label) + "</span>" +
          '<span class="or__tabtitle">' + esc(s.title) + "</span></button>";
      }).join("") +
      "</div>" +
      '<p class="or__blurb">' + esc(stage.blurb) + "</p>" +
      '<div class="acc or__acc">' +
      stage.items.map(function (it) {
        return '<div class="acc__item">' +
          '<button class="acc__btn"><span class="acc__ref">' + esc(it.ref) + "</span>" +
          '<span><span class="acc__q" style="display:block">' + esc(it.name) + "</span>" +
          '<span class="or__summary">' + esc(it.summary) + "</span></span>" +
          '<span class="acc__icon">+</span></button>' +
          '<div class="acc__panel"><div class="acc__body">' +
          "<p>" + esc(it.body) + "</p>" +
          (it.assist ? '<p class="or__assist"><span class="small-caps" style="color:var(--olive)">How 2birds assists</span><br />' + esc(it.assist) + "</p>" : "") +
          "</div></div></div>";
      }).join("") +
      "</div>";

    host.querySelectorAll(".or__tab").forEach(function (b) {
      b.addEventListener("click", function () { current = b.dataset.id; render(); });
    });
    host.querySelectorAll(".acc__item").forEach(function (item) {
      var btn = item.querySelector(".acc__btn");
      var panel = item.querySelector(".acc__panel");
      btn.addEventListener("click", function () {
        var open = item.classList.toggle("is-open");
        panel.style.maxHeight = open ? panel.scrollHeight + "px" : "0px";
      });
    });
  }

  var css = document.createElement("style");
  css.textContent =
    ".or__tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);border:1px solid var(--line);margin-bottom:34px;}" +
    "@media(max-width:720px){.or__tabs{grid-template-columns:1fr;}}" +
    ".or__tab{background:var(--ivory);padding:22px 24px;text-align:left;display:grid;gap:6px;transition:background .3s;}" +
    ".or__tab:hover{background:var(--bone);}" +
    ".or__tab.is-on{background:var(--dark);}" +
    ".or__tab.is-on .small-caps{color:var(--olive-bright);}" +
    ".or__tab.is-on .or__tabtitle{color:var(--ivory);}" +
    ".or__tabtitle{font-family:var(--serif);font-size:1.05rem;font-weight:500;}" +
    ".or__blurb{color:var(--ink-soft);max-width:62ch;margin-bottom:26px;}" +
    ".or__summary{display:block;font-size:13px;color:var(--ink-faint);margin-top:5px;font-family:var(--sans);font-weight:400;}" +
    ".or__assist{margin-top:16px;padding-top:14px;border-top:1px solid var(--line);}";
  document.head.appendChild(css);

  render();
})();
