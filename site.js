/* 2birds.asia — shared behaviour.
   The fade-and-rise entrance runs through the Web Animations API on viewport
   entry; the resting state is visible, so a failure here leaves content
   readable. The header's scrolled state lives in the header component itself. */
(function () {
  if (window.__tbSite) return;
  window.__tbSite = true;

  var root = document.documentElement;
  root.classList.add("tb-js");

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canAnimate = !reduce && typeof Element.prototype.animate === "function" && "IntersectionObserver" in window;
  var seen = typeof WeakSet === "function" ? new WeakSet() : null;
  var io = null;

  function disarm() { root.classList.remove("tb-armed"); }

  if (canAnimate) {
    root.classList.add("tb-armed");
    setTimeout(disarm, 1500);
    window.addEventListener("load", function () { setTimeout(disarm, 300); });

    io = new IntersectionObserver(function (entries) {
      var started = false;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        io.unobserve(el);
        if (seen && seen.has(el)) return;
        if (seen) seen.add(el);
        started = true;
        el.animate(
          [{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }],
          { duration: 600, easing: "cubic-bezier(.22,.61,.36,1)", fill: "none" }
        );
      });
      if (started) disarm();
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
  }

  function scan(node) {
    if (!io || !node || node.nodeType !== 1) return;
    if (node.classList.contains("reveal") && !(seen && seen.has(node))) io.observe(node);
    if (!node.querySelectorAll) return;
    var list = node.querySelectorAll(".reveal");
    for (var i = 0; i < list.length; i++) {
      if (!(seen && seen.has(list[i]))) io.observe(list[i]);
    }
  }

  if ("MutationObserver" in window) {
    new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        for (var j = 0; j < records[i].addedNodes.length; j++) scan(records[i].addedNodes[j]);
      }
    }).observe(root, { childList: true, subtree: true });
  }

  // Safety net for the header state: the component owns it, this only
  // re-applies the same class from the same scroll position on a timer.
  var header = null;
  function headerState() {
    if (!header || !header.isConnected) header = document.querySelector(".site-header");
    if (header) header.classList.toggle("is-scrolled", (window.scrollY || window.pageYOffset || 0) > 40);
  }
  window.addEventListener("scroll", headerState, { passive: true });
  window.addEventListener("resize", headerState);
  window.addEventListener("pageshow", headerState);
  window.addEventListener("hashchange", headerState);
  window.addEventListener("load", headerState);
  [0, 300, 1000].forEach(function (d) { setTimeout(headerState, d); });
  headerState();

  document.addEventListener("DOMContentLoaded", function () { scan(document.body); headerState(); });
  window.addEventListener("load", function () { scan(document.body); });
  scan(document.body);
})();

/* ---------- Site-wide translation -------------------------------------------
   The header owns its own translated labels. Everything else on the page is
   translated from English on the fly and cached per language, so a page is
   only translated once. Regulatory terms, names and addresses stay as written. */
(function () {
  var NAMES = { zh: "Simplified Chinese", zht: "Traditional Chinese", ms: "Malay", ta: "Tamil", ja: "Japanese", ko: "Korean", id: "Indonesian", th: "Thai", vi: "Vietnamese", fil: "Filipino", hi: "Hindi" };
  var KEEP = "2BIRDS, 2BIRDS PRIVATE LIMITED, SWDA, SSG, WSG, SkillsFuture, WSQ, CASL, TPQA, CQC, ATO, TPGateway, TAEPP, DACE, DDDLP, ACLP, ACTA, IAL, SAE, TRAQOM, CEB, CP Form, SOA, OJT, PWM, UEN, IRAS, ACRA, Corppass, PayNow, EduTrust, VARK, PixPlaySG, Tier 1, Tier 2, and every personal name, organisation name, street address, email address, phone number, URL, course code and number";
  var SKIP = "script,style,noscript,textarea,code,pre,[translate='no'],.notranslate,.tb-xl";
  var orig = new WeakMap(), mine = new WeakMap(), writing = false, lang = "en", busy = false, timer = null;

  function cache(l) { try { return JSON.parse(localStorage.getItem("tb-xl-" + l) || "{}"); } catch (e) { return {}; } }
  function store(l, c) { try { localStorage.setItem("tb-xl-" + l, JSON.stringify(c)); } catch (e) {} }

  function nodes() {
    var out = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentElement;
        if (!p || p.closest(SKIP)) return NodeFilter.FILTER_REJECT;
        var t = (orig.get(n) || n.nodeValue).trim();
        if (t.length < 2 || !/[A-Za-z]{2}/.test(t)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    while (w.nextNode()) out.push(w.currentNode);
    return out;
  }
  function fields() { return Array.prototype.slice.call(document.querySelectorAll("input[placeholder],textarea[placeholder]")).filter(function (el) { return !el.closest(SKIP); }); }
  function groups() { return Array.prototype.slice.call(document.querySelectorAll("optgroup[label]")); }

  function write(n, v) { mine.set(n, v); n.nodeValue = v; }
  function source(n) { if (!orig.has(n)) orig.set(n, n.nodeValue); return orig.get(n); }
  function split(s) { var m = s.match(/^(\s*)([\s\S]*?)(\s*)$/); return m; }

  function badge(on) {
    var b = document.querySelector(".tb-xl");
    if (on && !b) { b = document.createElement("div"); b.className = "tb-xl"; b.setAttribute("role", "status"); b.textContent = "Translating"; document.body.appendChild(b); }
    if (!on && b) b.remove();
  }

  function applyFromCache(c) {
    var missing = [];
    nodes().forEach(function (n) {
      var s = source(n), p = split(s), key = p[2].replace(/\s+/g, " ");
      if (c[key]) { var v = p[1] + c[key] + p[3]; if (n.nodeValue !== v) write(n, v); }
      else missing.push(key);
    });
    fields().forEach(function (el) {
      if (!el.dataset.tbPh) el.dataset.tbPh = el.placeholder;
      var k = el.dataset.tbPh;
      if (c[k]) el.placeholder = c[k]; else missing.push(k);
    });
    groups().forEach(function (g) { if (!g.dataset.tbLb) g.dataset.tbLb = g.label; var k = g.dataset.tbLb; if (c[k]) g.label = c[k]; });
    return missing.filter(function (v, i, a) { return a.indexOf(v) === i; });
  }

  function restore() {
    nodes().forEach(function (n) { if (orig.has(n) && n.nodeValue !== orig.get(n)) write(n, orig.get(n)); orig.delete(n); });
    fields().forEach(function (el) { if (el.dataset.tbPh) el.placeholder = el.dataset.tbPh; });
    groups().forEach(function (g) { if (g.dataset.tbLb) g.label = g.dataset.tbLb; });
  }

  // Fixed copy is translated ahead of time into i18n/<lang>.json, one array
  // aligned to i18n/en.json. Strings with no entry stay in English. Nothing is
  // machine-translated in the browser.
  var DICT = {}, KEYS = null;
  async function loadDict(l) {
    if (DICT[l]) return DICT[l];
    try {
      if (!KEYS) KEYS = await (await fetch("i18n/en.json", { cache: "no-cache" })).json();
      var arr = await (await fetch("i18n/" + l + ".json", { cache: "no-cache" })).json();
      var m = {}; KEYS.forEach(function (k, i) { if (typeof arr[i] === "string" && arr[i]) m[k] = arr[i]; });
      DICT[l] = m;
    } catch (e) { DICT[l] = {}; }
    return DICT[l];
  }

  // Inside the design editor the page runs in a frame. Rewriting text there
  // detaches it from its source, so the editor cannot edit it. Translate only
  // when the page is viewed on its own.
  var XL = (function () { try { return new URLSearchParams(location.search).get("xl"); } catch (e) { return null; } })();
  var EDITING = !XL && (function () { try { return window.self !== window.top; } catch (e) { return true; } })();

  async function run() {
    if (EDITING) { restore(); badge(false); return; }
    if (lang === "en") { restore(); badge(false); return; }
    var l = lang, c = await loadDict(l);
    if (lang !== l) return;
    applyFromCache(c);
  }
  function schedule() { clearTimeout(timer); timer = setTimeout(run, 350); }

  function setLang(l) { lang = l || "en"; document.documentElement.setAttribute("data-lang", lang); run(); }

  window.addEventListener("tb-lang", function (e) { if (!XL) setLang(e.detail); });
  try { lang = localStorage.getItem("tb-lang") || "en"; } catch (e) {}
  if (XL) lang = XL;

  new MutationObserver(function (recs) {
    if (EDITING || lang === "en") return;
    var real = false;
    for (var i = 0; i < recs.length; i++) {
      var r = recs[i];
      if (r.type === "characterData") { if (mine.get(r.target) === r.target.nodeValue) continue; orig.delete(r.target); real = true; } else if (r.addedNodes.length) real = true;
    }
    if (real) schedule();
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });

  window.addEventListener("load", function () { setTimeout(function () { setLang(lang); }, 300); });
  if (document.readyState !== "loading") setTimeout(function () { setLang(lang); }, 600);

  // Autoplay: React may not set the muted attribute, so force it and play.
  function tbPlayVideos(){
    var vs=document.querySelectorAll('video[autoplay]');
    for(var i=0;i<vs.length;i++){var v=vs[i];
      if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches) continue;
      v.muted=true;v.defaultMuted=true;v.setAttribute('muted','');v.playsInline=true;
      if(v.paused){var p=v.play();if(p&&p.catch)p.catch(function(){});}
    }
  }
  document.addEventListener('DOMContentLoaded',tbPlayVideos);
  window.addEventListener('load',tbPlayVideos);
  [300,1000,2500].forEach(function(d){setTimeout(tbPlayVideos,d);});
  if('MutationObserver' in window){new MutationObserver(tbPlayVideos).observe(document.documentElement,{childList:true,subtree:true});}

  // The Anatomy of the Mark: draw hairline leaders from each card to its point on the logo.
  function tbAnatomy(){
    var stages=document.querySelectorAll('[data-anatomy]');
    for(var s=0;s<stages.length;s++){
      var st=stages[s],svg=st.querySelector('.anat__lines'),logo=st.querySelector('.anat__logo');
      if(!svg||!logo) continue;
      if(getComputedStyle(svg).display==='none'){svg.innerHTML='';continue;}
      var sr=st.getBoundingClientRect(),lr=logo.getBoundingClientRect();
      if(!lr.width) continue;
      svg.setAttribute('viewBox','0 0 '+sr.width+' '+sr.height);
      var out='';var cards=st.querySelectorAll('[data-anat-card]');
      for(var i=0;i<cards.length;i++){
        var c=cards[i],cr=c.getBoundingClientRect(),p=c.getAttribute('data-pt').split(',');
        var px=lr.left-sr.left+lr.width*parseFloat(p[0]),py=lr.top-sr.top+lr.height*parseFloat(p[1]);
        var left=c.getAttribute('data-side')==='l';
        var ax=(left?cr.right:cr.left)-sr.left,ay=cr.top-sr.top+34;
        var kx=ax+(left?28:-28);
        var n=c.getAttribute('data-anat-card'),on=st.getAttribute('data-active')===n?' is-active':'';
        out+='<polyline class="anat__line'+on+'" data-n="'+n+'" points="'+ax+','+ay+' '+kx+','+ay+' '+px+','+py+'"/>';
        out+='<circle class="anat__ring'+on+'" data-n="'+n+'" cx="'+ax+'" cy="'+ay+'" r="3"/>';
      }
      svg.innerHTML=out;
    }
  }
  function tbAnatSet(st,n){
    if(!st) return;
    if(n) st.setAttribute('data-active',n); else st.removeAttribute('data-active');
    var els=st.querySelectorAll('[data-anat-card],[data-anat-hot],.anat__line,.anat__ring');
    for(var i=0;i<els.length;i++){
      var e=els[i],k=e.getAttribute('data-anat-card')||e.getAttribute('data-anat-hot')||e.getAttribute('data-n');
      var on=!!n&&k===n;
      e.classList.toggle('is-active',on);
      if(e.hasAttribute('data-anat-card')) e.setAttribute('aria-pressed',on?'true':'false');
    }
  }
  function tbAnatKey(e){
    var el=e.target&&e.target.closest?e.target.closest('[data-anat-card],[data-anat-hot]'):null;
    return el?{st:el.closest('[data-anatomy]'),n:el.getAttribute('data-anat-card')||el.getAttribute('data-anat-hot')}:null;
  }
  var tbFine=window.matchMedia&&window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.addEventListener('mouseover',function(e){if(!tbFine)return;var k=tbAnatKey(e);if(k)tbAnatSet(k.st,k.n);});
  document.addEventListener('mouseout',function(e){
    if(!tbFine)return;var k=tbAnatKey(e);if(!k)return;
    var to=e.relatedTarget&&e.relatedTarget.closest?e.relatedTarget.closest('[data-anat-card],[data-anat-hot]'):null;
    if(!to&&!k.st.hasAttribute('data-locked'))tbAnatSet(k.st,null);
    else if(!to&&k.st.hasAttribute('data-locked'))tbAnatSet(k.st,k.st.getAttribute('data-locked'));
  });
  document.addEventListener('click',function(e){
    var k=tbAnatKey(e);
    if(!k){var open=document.querySelectorAll('[data-anatomy][data-locked]');for(var i=0;i<open.length;i++){if(!open[i].contains(e.target)){open[i].removeAttribute('data-locked');tbAnatSet(open[i],null);}}return;}
    if(k.st.getAttribute('data-locked')===k.n){k.st.removeAttribute('data-locked');tbAnatSet(k.st,null);}
    else{k.st.setAttribute('data-locked',k.n);tbAnatSet(k.st,k.n);}
    if(e.target.closest('[data-anat-hot]')&&!tbFine){
      var card=k.st.querySelector('[data-anat-card="'+k.n+'"]');
      if(card){var r=card.getBoundingClientRect();if(r.top<0||r.bottom>innerHeight)window.scrollTo(0,window.scrollY+r.top-innerHeight/2+r.height/2);}
    }
  });
  document.addEventListener('focusin',function(e){var k=tbAnatKey(e);if(k)tbAnatSet(k.st,k.n);});
  document.addEventListener('focusout',function(e){var k=tbAnatKey(e);if(k&&!k.st.hasAttribute('data-locked'))tbAnatSet(k.st,null);});
  document.addEventListener('keydown',function(e){
    if(e.key!=='Enter'&&e.key!==' ')return;var el=e.target;
    if(el&&el.hasAttribute&&el.hasAttribute('data-anat-card')){e.preventDefault();el.click();}
  });
  window.addEventListener('resize',tbAnatomy);
  window.addEventListener('load',tbAnatomy);
  document.addEventListener('DOMContentLoaded',tbAnatomy);
  [200,600,1200,2500,5000].forEach(function(d){setTimeout(tbAnatomy,d);});
  document.addEventListener('load',function(e){if(e.target&&e.target.tagName==='IMG')tbAnatomy();},true);

  // The Anatomy of the Mark: one part is always selected; hover previews, click selects.
  function tbMark(root,n){
    if(!root||!n) return;
    var els=root.querySelectorAll('[data-mk]');
    for(var i=0;i<els.length;i++){
      var on=els[i].getAttribute('data-mk')===n;
      if(els[i].classList.contains('mk-pin')||els[i].classList.contains('mk-row')) els[i].classList.toggle('is-on',on);
      if(els[i].classList.contains('mk-row__btn')) els[i].setAttribute('aria-expanded',on?'true':'false');
    }
  }
  function tbMarkHit(e){var el=e.target&&e.target.closest?e.target.closest('.mk-pin,.mk-row__btn'):null;return el?{root:el.closest('[data-mk-root]'),n:el.getAttribute('data-mk')}:null;}
  document.addEventListener('click',function(e){var k=tbMarkHit(e);if(!k)return;k.root.setAttribute('data-mk-sel',k.n);tbMark(k.root,k.n);});
  var tbHover=window.matchMedia&&window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.addEventListener('mouseover',function(e){if(!tbHover)return;var k=tbMarkHit(e);if(k)tbMark(k.root,k.n);});
  document.addEventListener('mouseout',function(e){
    if(!tbHover)return;var k=tbMarkHit(e);if(!k)return;
    var to=e.relatedTarget&&e.relatedTarget.closest?e.relatedTarget.closest('.mk-pin,.mk-row__btn'):null;
    if(!to) tbMark(k.root,k.root.getAttribute('data-mk-sel')||'01');
  });
})();

/* mg-leaders: leader lines from the monogram out to its four parts */
(function () {
  var NS = "http://www.w3.org/2000/svg";
  function draw() {
    var grid = document.querySelector(".mg__grid");
    if (!grid) return;
    var svg = grid.querySelector(".mg__lines"), img = grid.querySelector(".mg__figure img");
    if (!svg || !img || getComputedStyle(svg).display === "none") return;
    var g = grid.getBoundingClientRect(), im = img.getBoundingClientRect();
    if (!im.width) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var parts = grid.querySelectorAll(".mg-part[data-pt]");
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i], pt = p.getAttribute("data-pt").split(",");
      var tx = im.left - g.left + im.width * parseFloat(pt[0]);
      var ty = im.top - g.top + im.height * parseFloat(pt[1]);
      var r = p.getBoundingClientRect(), h = p.querySelector(".mg-part__h").getBoundingClientRect();
      var left = p.closest(".mg__col--l") !== null;
      var sx = left ? r.right - g.left + 20 : r.left - g.left - 20;
      var sy = h.top - g.top + h.height / 2;
      var fx = left ? im.left - g.left - 24 : im.right - g.left + 24;
      var grp = document.createElementNS(NS, "g");
      grp.setAttribute("data-i", i);
      if (p.classList.contains("is-on")) grp.setAttribute("class", "on");
      else if (p.classList.contains("is-off")) grp.setAttribute("class", "off");
      var path = document.createElementNS(NS, "path");
      path.setAttribute("d", "M" + tx + "," + ty + " L" + fx + "," + sy + " L" + sx + "," + sy);
      var dir = left ? 1 : -1;
      var ah = document.createElementNS(NS, "path");
      ah.setAttribute("d", "M" + (sx + 7 * dir) + "," + (sy - 4) + " L" + sx + "," + sy + " L" + (sx + 7 * dir) + "," + (sy + 4));
      var ring = document.createElementNS(NS, "circle");
      ring.setAttribute("class", "ring"); ring.setAttribute("cx", tx); ring.setAttribute("cy", ty); ring.setAttribute("r", 9);
      var dot = document.createElementNS(NS, "circle");
      dot.setAttribute("class", "dot"); dot.setAttribute("cx", tx); dot.setAttribute("cy", ty); dot.setAttribute("r", 3.5);
      grp.appendChild(path); grp.appendChild(ah); grp.appendChild(ring); grp.appendChild(dot);
      svg.appendChild(grp);
    }
  }
  function focus(on) {
    var grid = document.querySelector(".mg__grid"); if (!grid) return;
    var parts = grid.querySelectorAll(".mg-part");
    for (var i = 0; i < parts.length; i++) {
      parts[i].classList.toggle("is-on", parts[i] === on);
      parts[i].classList.toggle("is-off", !!on && parts[i] !== on);
    }
    draw();
  }
  document.addEventListener("mouseover", function (e) { var p = e.target.closest && e.target.closest(".mg-part"); if (p) focus(p); });
  document.addEventListener("mouseout", function (e) { var p = e.target.closest && e.target.closest(".mg-part"); if (p && !p.contains(e.relatedTarget)) focus(null); });
  document.addEventListener("focusin", function (e) { var p = e.target.closest && e.target.closest(".mg-part"); if (p) focus(p); });
  document.addEventListener("focusout", function (e) { var p = e.target.closest && e.target.closest(".mg-part"); if (p) focus(null); });
  var pend = null;
  function soon() { clearTimeout(pend); pend = setTimeout(draw, 60); }
  window.addEventListener("resize", soon);
  window.addEventListener("scroll", soon, { passive: true });
  window.addEventListener("load", draw);
  document.addEventListener("load", function (e) { if (e.target && e.target.tagName === "IMG") soon(); }, true);
  [0, 300, 900, 2000, 4000].forEach(function (d) { setTimeout(draw, d); });
  if ("ResizeObserver" in window) {
    var ro = new ResizeObserver(soon), watched = null;
    setInterval(function () { var g = document.querySelector(".mg__grid"); if (g && g !== watched) { watched = g; ro.observe(g); draw(); } }, 1000);
  }
})();

/* tb-loop: keep every ambient video playing on repeat, even if the loop attribute is dropped */
(function(){
  function arm(v){if(v.__tbl)return;v.__tbl=1;v.muted=true;v.loop=true;v.setAttribute('loop','loop');
    v.addEventListener('ended',function(){try{v.currentTime=0;}catch(e){}var p=v.play();if(p&&p.catch)p.catch(function(){});});}
  function kick(){document.querySelectorAll('video[autoplay], video[loop], .wkv__media video, .band video').forEach(function(v){arm(v);if(v.paused||v.ended){if(v.ended){try{v.currentTime=0;}catch(e){}}var p=v.play();if(p&&p.catch)p.catch(function(){});}});}
  if('MutationObserver' in window){new MutationObserver(kick).observe(document.documentElement,{childList:true,subtree:true});}
  document.addEventListener('visibilitychange',kick);window.addEventListener('load',kick);
  [300,1500,4000].forEach(function(d){setTimeout(kick,d);});
  document.addEventListener('pointerdown',kick,{once:true});
})();

/* wkc-tabs spy · marks the section in view and keeps the active tab visible */
(function(){function init(){var nav=document.querySelector('.wkc-tabs');if(!nav||nav.__spy)return;nav.__spy=1;var links=[].slice.call(nav.querySelectorAll('a[href^="#"]'));var secs=links.map(function(a){return document.getElementById(a.getAttribute('href').slice(1))}).filter(Boolean);if(!secs.length)return;var wrap=nav.querySelector('.wrap');function set(id){links.forEach(function(a){var on=a.getAttribute('href')==='#'+id;if(on){a.setAttribute('aria-current','page');var r=a.getBoundingClientRect(),w=wrap.getBoundingClientRect();if(r.left<w.left||r.right>w.right)wrap.scrollTo({left:a.offsetLeft-16,behavior:'smooth'});}else a.removeAttribute('aria-current');});}
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)set(e.target.id)})},{rootMargin:'-40% 0px -55% 0px'});secs.forEach(function(s){io.observe(s)});set(secs[0].id);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();setTimeout(init,1500);})();

/* dg-scroll end */
(function(){function init(){var s=document.querySelector('.dg-scroll');if(!s||s.__end)return;s.__end=1;var w=s.closest('.dg-wrap');function u(){w.classList.toggle('is-end',s.scrollLeft+s.clientWidth>=s.scrollWidth-4)}s.addEventListener('scroll',u,{passive:true});u();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();setTimeout(init,1500);})();

/* ---- Photograph swaps · auto crossfade on touch devices ------------------- */
(function autoSwap(){
  if(!window.matchMedia||!matchMedia('(hover: none)').matches)return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var HOLD=4000,STAGGER=1000;
  function arm(){
    var els=[].slice.call(document.querySelectorAll('.ph--swap:not([data-autoswap])'));
    if(!els.length)return;
    els.forEach(function(el,i){
      el.setAttribute('data-autoswap','');
      var alt=el.querySelector('.ph__alt');if(!alt)return;
      var on=false,timer=null,visible=false,order=i%4;
      function tick(){ if(!visible||document.hidden){timer=null;return;} on=!on; el.classList.toggle('is-swapped',on); timer=setTimeout(tick,HOLD); }
      function start(){ if(timer)return; timer=setTimeout(tick,HOLD+order*STAGGER); }
      function stop(){ if(timer){clearTimeout(timer);timer=null;} }
      var io=new IntersectionObserver(function(en){ visible=en[0].isIntersecting; visible?start():stop(); },{threshold:.25});
      io.observe(el);
      document.addEventListener('visibilitychange',function(){ document.hidden?stop():(visible&&start()); });
    });
  }
  arm(); new MutationObserver(arm).observe(document.documentElement,{childList:true,subtree:true});
})();

/* ========== Region and language · one source for header, menu and footer ========== */
(function () {
  if (window.TBLocale) return;
  var REGION_LANG = { "Singapore": "en", "Malaysia": "ms", "Brunei": "ms", "Indonesia": "id", "Philippines": "fil", "Thailand": "th", "Vietnam": "vi", "China": "zh", "Hong Kong": "zht", "Macau": "zht", "Taiwan": "zht", "Japan": "ja", "South Korea": "ko", "India": "hi", "Sri Lanka": "ta" };
  var HTML = { en: "en-SG", zh: "zh-Hans-SG", ms: "ms-SG", ta: "ta-SG", zht: "zh-Hant", ja: "ja", ko: "ko", id: "id", th: "th", vi: "vi", fil: "fil", hi: "hi" };
  var ISO = { SG: "Singapore", BN: "Brunei", KH: "Cambodia", ID: "Indonesia", LA: "Laos", MY: "Malaysia", MM: "Myanmar", PH: "Philippines", TH: "Thailand", TL: "Timor-Leste", VN: "Vietnam", CN: "China", HK: "Hong Kong", JP: "Japan", MO: "Macau", MN: "Mongolia", KR: "South Korea", TW: "Taiwan", AF: "Afghanistan", BD: "Bangladesh", BT: "Bhutan", IN: "India", MV: "Maldives", NP: "Nepal", PK: "Pakistan", LK: "Sri Lanka", KZ: "Kazakhstan", KG: "Kyrgyzstan", TJ: "Tajikistan", TM: "Turkmenistan", UZ: "Uzbekistan", AM: "Armenia", AZ: "Azerbaijan", BH: "Bahrain", CY: "Cyprus", GE: "Georgia", IQ: "Iraq", IL: "Israel", JO: "Jordan", KW: "Kuwait", LB: "Lebanon", OM: "Oman", PS: "Palestine", QA: "Qatar", SA: "Saudi Arabia", SY: "Syria", TR: "Türkiye", AE: "United Arab Emirates", YE: "Yemen" };
  var TZ = { "Asia/Singapore": "Singapore", "Asia/Kuala_Lumpur": "Malaysia", "Asia/Kuching": "Malaysia", "Asia/Jakarta": "Indonesia", "Asia/Pontianak": "Indonesia", "Asia/Makassar": "Indonesia", "Asia/Jayapura": "Indonesia", "Asia/Manila": "Philippines", "Asia/Bangkok": "Thailand", "Asia/Ho_Chi_Minh": "Vietnam", "Asia/Saigon": "Vietnam", "Asia/Phnom_Penh": "Cambodia", "Asia/Vientiane": "Laos", "Asia/Yangon": "Myanmar", "Asia/Rangoon": "Myanmar", "Asia/Brunei": "Brunei", "Asia/Dili": "Timor-Leste", "Asia/Shanghai": "China", "Asia/Urumqi": "China", "Asia/Chongqing": "China", "Asia/Harbin": "China", "Asia/Hong_Kong": "Hong Kong", "Asia/Macau": "Macau", "Asia/Taipei": "Taiwan", "Asia/Tokyo": "Japan", "Asia/Seoul": "South Korea", "Asia/Ulaanbaatar": "Mongolia", "Asia/Hovd": "Mongolia", "Asia/Choibalsan": "Mongolia", "Asia/Kolkata": "India", "Asia/Calcutta": "India", "Asia/Colombo": "Sri Lanka", "Asia/Dhaka": "Bangladesh", "Asia/Kathmandu": "Nepal", "Asia/Katmandu": "Nepal", "Asia/Thimphu": "Bhutan", "Indian/Maldives": "Maldives", "Asia/Karachi": "Pakistan", "Asia/Kabul": "Afghanistan", "Asia/Almaty": "Kazakhstan", "Asia/Qostanay": "Kazakhstan", "Asia/Aqtobe": "Kazakhstan", "Asia/Aqtau": "Kazakhstan", "Asia/Atyrau": "Kazakhstan", "Asia/Oral": "Kazakhstan", "Asia/Qyzylorda": "Kazakhstan", "Asia/Bishkek": "Kyrgyzstan", "Asia/Dushanbe": "Tajikistan", "Asia/Ashgabat": "Turkmenistan", "Asia/Tashkent": "Uzbekistan", "Asia/Samarkand": "Uzbekistan", "Asia/Yerevan": "Armenia", "Asia/Baku": "Azerbaijan", "Asia/Bahrain": "Bahrain", "Asia/Nicosia": "Cyprus", "Asia/Famagusta": "Cyprus", "Europe/Nicosia": "Cyprus", "Asia/Tbilisi": "Georgia", "Asia/Baghdad": "Iraq", "Asia/Jerusalem": "Israel", "Asia/Tel_Aviv": "Israel", "Asia/Amman": "Jordan", "Asia/Kuwait": "Kuwait", "Asia/Beirut": "Lebanon", "Asia/Muscat": "Oman", "Asia/Gaza": "Palestine", "Asia/Hebron": "Palestine", "Asia/Qatar": "Qatar", "Asia/Riyadh": "Saudi Arabia", "Asia/Damascus": "Syria", "Europe/Istanbul": "Türkiye", "Asia/Istanbul": "Türkiye", "Asia/Dubai": "United Arab Emirates", "Asia/Aden": "Yemen" };
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function fromNav() {
    var list = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || ""];
    for (var i = 0; i < list.length; i++) {
      var t = String(list[i] || "").toLowerCase();
      if (!t) continue;
      if (/^zh-(tw|hk|mo)|^zh-hant/.test(t)) return "zht";
      if (/^zh/.test(t)) return "zh";
      if (/^(fil|tl)\b/.test(t)) return "fil";
      var b = t.split("-")[0];
      if (["ms", "ta", "ja", "ko", "id", "th", "vi", "hi", "en"].indexOf(b) >= 0) return b;
    }
    return null;
  }
  var api = {
    REGION_LANG: REGION_LANG,
    read: function () { return { region: get("tb-region") || "Singapore", lang: get("tb-lang") || "en", src: get("tb-locale-src") || ((get("tb-region") || get("tb-lang")) ? "user" : "") }; },
    set: function (region, lang, src) {
      var cur = api.read();
      if (src === "auto" && cur.src === "user") return;
      region = region || cur.region; lang = lang || cur.lang;
      put("tb-region", region); put("tb-lang", lang); put("tb-locale-src", src || "user");
      document.documentElement.lang = HTML[lang] || "en-SG";
      try { window.dispatchEvent(new CustomEvent("tb-region", { detail: region })); } catch (e) {}
      try { window.dispatchEvent(new CustomEvent("tb-lang", { detail: lang })); } catch (e) {}
      try { window.dispatchEvent(new CustomEvent("tb-locale", { detail: { region: region, lang: lang, src: src || "user" } })); } catch (e) {}
    },
    last: null,
    detect: function () {
      if (api._p) return api._p;
      var cur = api.read();
      if (cur.src) { document.documentElement.lang = HTML[cur.lang] || "en-SG"; api.last = { source: "stored", region: cur.region, lang: cur.lang }; return (api._p = Promise.resolve(api.last)); }
      var how = "default";
      api._p = fetch("/api/geo", { cache: "no-store" }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
        var code = String((j && j.country) || "").toUpperCase(); if (!code) throw 0;
        how = "geo"; return ISO[code] || "Singapore";
      }).catch(function () {
        var tz = ""; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
        if (TZ[tz]) { how = "timezone " + tz; return TZ[tz]; }
        how = "default (timezone " + (tz || "unknown") + ")"; return "Singapore";
      }).then(function (country) {
        var n = fromNav(), lang = n || REGION_LANG[country] || "en";
        api.last = { source: how, region: country, lang: lang, langFrom: n ? "browser" : (REGION_LANG[country] ? "country" : "default") };
        api.set(country, lang, "auto");
        return api.last;
      });
      return api._p;
    }
  };
  window.TBLocale = api;
  api.detect();
})();

/* Site dropdown · replaces native selects in the header, menu and footer on fine pointers.
   The native select stays in the DOM as the source of truth; touch devices keep it. */
(function () {
  if (window.__tbDD || window.__tbDDoff) return; window.__tbDD = true;
  var fine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)");
  var SEL = "#ft-region, #ft-lang, #hdr-region, #mp-region";
  var open = null, typed = "", typedT = 0;
  function label(sel) { var o = sel.options[sel.selectedIndex]; return o ? o.textContent.trim() : ""; }
  function setVal(sel, v) {
    var d = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
    d.set.call(sel, v); sel.dispatchEvent(new Event("change", { bubbles: true })); sel.dispatchEvent(new Event("input", { bubbles: true }));
  }
  function close(focusBtn) {
    if (!open) return; var o = open; open = null;
    o.panel.remove(); o.btn.setAttribute("aria-expanded", "false");
    if (focusBtn) o.btn.focus();
  }
  function build(sel, btn) {
    var p = document.createElement("div"); p.className = "tb-dd"; p.setAttribute("role", "listbox"); p.tabIndex = -1;
    p.setAttribute("aria-label", btn.getAttribute("aria-label") || "Options");
    var items = [];
    Array.prototype.forEach.call(sel.children, function (ch) {
      if (ch.tagName === "OPTGROUP") {
        var g = document.createElement("p"); g.className = "tb-dd__g"; g.setAttribute("role", "presentation"); g.textContent = ch.label; p.appendChild(g);
        Array.prototype.forEach.call(ch.children, function (o) { items.push(add(o)); });
      } else if (ch.tagName === "OPTION") items.push(add(ch));
    });
    function add(o) {
      var b = document.createElement("div"); b.className = "tb-dd__o"; b.setAttribute("role", "option"); b.id = "tbdd-" + Math.random().toString(36).slice(2, 8);
      b.textContent = o.textContent.trim(); if (o.lang) b.lang = o.lang; b.dataset.v = o.value;
      if (o.value === sel.value) { b.setAttribute("aria-selected", "true"); }
      b.addEventListener("mousedown", function (e) { e.preventDefault(); });
      b.addEventListener("click", function () { setVal(sel, o.value); close(true); sync(sel); });
      p.appendChild(b); return b;
    }
    return { p: p, items: items };
  }
  function place(btn, panel) {
    var r = btn.getBoundingClientRect(), vh = window.innerHeight, gap = 8;
    panel.style.minWidth = Math.max(r.width, 220) + "px";
    panel.style.left = Math.min(Math.max(8, r.left), window.innerWidth - panel.offsetWidth - 8) + "px";
    var h = panel.offsetHeight, below = vh - r.bottom - gap, above = r.top - gap;
    var up = btn.closest("footer") ? true : (below < h && above > below);
    if (up) { panel.style.top = ""; panel.style.bottom = (vh - r.top + gap) + "px"; panel.style.maxHeight = Math.min(vh * 0.6, above - 8) + "px"; }
    else { panel.style.bottom = ""; panel.style.top = (r.bottom + gap) + "px"; panel.style.maxHeight = Math.min(vh * 0.6, below - 8) + "px"; }
  }
  function active(i) {
    if (!open) return; var it = open.items; if (!it.length) return;
    i = Math.max(0, Math.min(it.length - 1, i)); open.idx = i;
    it.forEach(function (b, k) { b.classList.toggle("is-active", k === i); });
    open.panel.setAttribute("aria-activedescendant", it[i].id);
    var b = it[i], pn = open.panel;
    if (b.offsetTop < pn.scrollTop) pn.scrollTop = b.offsetTop - 8;
    else if (b.offsetTop + b.offsetHeight > pn.scrollTop + pn.clientHeight) pn.scrollTop = b.offsetTop + b.offsetHeight - pn.clientHeight + 8;
  }
  function openFor(sel, btn) {
    close(false);
    var b = build(sel, btn); document.body.appendChild(b.p);
    open = { sel: sel, btn: btn, panel: b.p, items: b.items, idx: 0 };
    btn.setAttribute("aria-expanded", "true"); place(btn, b.p);
    var cur = b.items.findIndex(function (x) { return x.dataset.v === sel.value; }); active(cur < 0 ? 0 : cur);
    b.p.focus({ preventScroll: true });
    b.p.addEventListener("keydown", key);
  }
  function key(e) {
    if (!open) return; var k = e.key;
    if (k === "ArrowDown") { e.preventDefault(); active(open.idx + 1); }
    else if (k === "ArrowUp") { e.preventDefault(); active(open.idx - 1); }
    else if (k === "Home") { e.preventDefault(); active(0); }
    else if (k === "End") { e.preventDefault(); active(open.items.length - 1); }
    else if (k === "PageDown") { e.preventDefault(); active(open.idx + 8); }
    else if (k === "PageUp") { e.preventDefault(); active(open.idx - 8); }
    else if (k === "Enter" || k === " ") { e.preventDefault(); var s = open.sel; setVal(s, open.items[open.idx].dataset.v); close(true); sync(s); }
    else if (k === "Escape") { e.preventDefault(); close(true); }
    else if (k === "Tab") { close(false); }
    else if (k.length === 1) {
      var now = Date.now(); typed = (now - typedT > 700 ? "" : typed) + k.toLowerCase(); typedT = now;
      var n = open.items.length;
      for (var j = 1; j <= n; j++) { var q = (open.idx + (typed.length > 1 ? 0 : j)) % n; if (open.items[q].textContent.toLowerCase().indexOf(typed) === 0) { active(q); break; } }
    }
  }
  function sync(sel) { var b = sel.__tbBtn; if (!b) return; var v = b.querySelector(".tb-ddb__v"), t = label(sel); if (v.textContent !== t) v.textContent = t; }
  function enhance(sel) {
    if (sel.__tbBtn) { sync(sel); return; }
    var btn = document.createElement("button"); btn.type = "button"; btn.className = "tb-ddb";
    btn.setAttribute("aria-haspopup", "listbox"); btn.setAttribute("aria-expanded", "false");
    var lab = sel.id && document.querySelector('label[for="' + sel.id + '"]'); btn.setAttribute("aria-label", lab ? lab.textContent.trim() : "Choose");
    btn.innerHTML = '<span class="tb-ddb__v"></span><span class="tb-ddb__c" aria-hidden="true"></span>';
    sel.parentNode.insertBefore(btn, sel.nextSibling); sel.classList.add("tb-dd-native"); sel.tabIndex = -1; sel.setAttribute("aria-hidden", "true");
    sel.__tbBtn = btn; sync(sel);
    btn.addEventListener("click", function (e) { e.stopPropagation(); if (open && open.btn === btn) close(true); else openFor(sel, btn); });
    btn.addEventListener("keydown", function (e) { if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") { e.preventDefault(); openFor(sel, btn); } });
    sel.addEventListener("change", function () { sync(sel); });
  }
  function scan() { if (!fine || !fine.matches) return; document.querySelectorAll(SEL).forEach(enhance); document.querySelectorAll(".tb-ddb").forEach(function (b) { if (!b.previousElementSibling || !b.previousElementSibling.matches || !b.previousElementSibling.matches("select")) b.remove(); }); }
  document.addEventListener("mousedown", function (e) { if (open && !open.panel.contains(e.target) && e.target !== open.btn && !open.btn.contains(e.target)) close(false); }, true);
  window.addEventListener("resize", function () { close(false); });
  window.addEventListener("scroll", function (e) { if (open && !open.panel.contains(e.target)) close(false); }, true);
  function start() { scan(); setInterval(scan, 1200); }
  if (document.readyState === "complete") setTimeout(start, 300); else window.addEventListener("load", function () { setTimeout(start, 300); });
})();

/* Same-background section joins · the gap from the last content of one section to the first
   content of the next is 96 / 72 / 56px (desktop / tablet / phone). Differing backgrounds keep
   their own padding. Stacked padding is taken off the two paddings themselves. */
(function () {
  if (window.__tbJoin) return; window.__tbJoin = true;
  function bg(el) { var c = getComputedStyle(el); var col = c.backgroundColor; if (!col || col === "transparent" || /rgba\([^)]*,\s*0\)/.test(col)) col = "rgb(255, 255, 255)"; return col + "|" + (c.backgroundImage && c.backgroundImage !== "none" ? "img" : ""); }
  function target() { var w = window.innerWidth; return w >= 1080 ? 96 : (w >= 768 ? 72 : 56); }
  function visible(el) { var c = getComputedStyle(el); if (c.display === "none" || c.visibility === "hidden" || +c.opacity === 0 || c.position === "absolute" || c.position === "fixed") return null; var r = el.getBoundingClientRect(); return (r.width > 0 && r.height > 0) ? { r: r, c: c } : null; }
  function marks(el) { var c = getComputedStyle(el), t = parseFloat(c.borderTopWidth) > 0, b = parseFloat(c.borderBottomWidth) > 0; var hasText = false; for (var n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 3 && n.textContent.trim()) { hasText = true; break; } return { t: t, b: b, x: hasText || /^(IMG|SVG|VIDEO|PICTURE|INPUT|BUTTON|SELECT|TEXTAREA|HR|CANVAS)$/i.test(el.tagName) }; }
  function edge(sec, last) {
    var best = null, all = sec.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) { var el = all[i]; var m = marks(el); if (!m.x && !m.t && !m.b) continue; var v = visible(el); if (!v) continue;
      var y = last ? (m.x || m.b ? v.r.bottom : v.r.top) : (m.x || m.t ? v.r.top : v.r.bottom);
      if (best == null || (last ? y > best : y < best)) best = y; }
    return best;
  }
  function skip(s) { return !s || s.tagName !== "SECTION" || s.id === "follow" || s.hasAttribute("data-nojoin") || s.querySelector("#nx-pin"); }
  function run() {
    var main = document.querySelector("main"); if (!main) return;
    var secs = Array.prototype.filter.call(main.children, function (s) { return s.tagName === "SECTION"; });
    secs.forEach(function (s) { if (s.__tbJ) { s.style.removeProperty("padding-bottom"); s.style.removeProperty("padding-top"); s.__tbJ = 0; } });
    var T = target(), out = [];
    for (var i = 0; i < secs.length - 1; i++) {
      var a = secs[i], b = secs[i + 1]; if (skip(a) || skip(b) || a.nextElementSibling !== b) continue;
      if (bg(a) !== bg(b) || bg(a).indexOf("img") >= 0) continue;
      var la = edge(a, true), fb = edge(b, false); if (la == null || fb == null) continue;
      var gap = fb - la; if (gap <= T + 1) continue;
      var over = gap - T, ca = getComputedStyle(a), cb = getComputedStyle(b);
      var pa = parseFloat(ca.paddingBottom) || 0, pb = parseFloat(cb.paddingTop) || 0;
      var ta = Math.min(pa, over); over -= ta; var tb = Math.min(pb, over);
      if (ta) { a.style.setProperty("padding-bottom", (pa - ta) + "px", "important"); a.__tbJ = 1; }
      if (tb) { b.style.setProperty("padding-top", (pb - tb) + "px", "important"); b.__tbJ = 1; }
      out.push((a.getAttribute("data-block") || a.id || i) + " → " + (b.getAttribute("data-block") || b.id || i + 1) + ": " + Math.round(gap) + " → " + Math.round(gap - ta - tb));
    }
    window.__tbJoinLog = out;
  }
  var t; function later(d) { clearTimeout(t); t = setTimeout(run, d || 200); }
  window.TBJoin = run;
  if (document.readyState === "complete") later(600); else window.addEventListener("load", function () { later(600); });
  [1500, 3000].forEach(function (d) { setTimeout(run, d); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { later(300); });
  window.addEventListener("resize", function () { later(250); });
})();
