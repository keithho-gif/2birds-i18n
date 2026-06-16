// CASL Dashboard, interactive Course Approval Skills List directory for ATOs.
// Renders inside a host page that has already loaded React + window.TB_CASL.
//
// Beyond search and filter, the dashboard is built to help a training provider
// DECIDE what to develop: an industry landscape (where the register
// concentrates, and where SSG widened approval in the June 2026 update),
// a pinned working list that persists between visits, and a marketability
// reading inside each skill's detail view.

const { useState, useMemo, useEffect, useRef } = React;

const VIEWS = [
  { id: "all", label: "Full register" },
  { id: 1, label: "Current CASL" },
  { id: 2, label: "New in update" },
];

const SORTS = [
  { id: "az", label: "Title · A to Z" },
  { id: "za", label: "Title · Z to A" },
  { id: "industry", label: "Group by industry" },
];

// SSG-published source list (Phases 1 and 2), hosted on TPGateway.
const OFFICIAL_CASL = "https://www.tpgateway.gov.sg/docs/default-source/default-document-library/updates-library/ppd-tgs/050526_course-approval-skills-list-phase-1-and-2.xlsx?sfvrsn=dcd0168e_3";
const OFFICIAL_CURRENT = OFFICIAL_CASL;
const OFFICIAL_UPDATED = OFFICIAL_CASL;

const SHORTLIST_KEY = "tb_casl_shortlist";

// Wrap query matches in <mark> for in-card highlighting.
function highlight(text, q) {
  const query = (q || "").trim();
  if (!query) return text;
  const lower = text.toLowerCase();
  const ql = query.toLowerCase();
  const out = [];
  let i = 0, k = 0;
  while (true) {
    const j = lower.indexOf(ql, i);
    if (j === -1) { out.push(text.slice(i)); break; }
    if (j > i) out.push(text.slice(i, j));
    out.push(<mark key={k++} className="casl__mark">{text.slice(j, j + query.length)}</mark>);
    i = j + query.length;
  }
  return out;
}

// Manual eased scroll. Native `behavior: smooth` is unreliable inside some
// embedded frames; drive it with setTimeout so it runs even where rAF is throttled.
function smoothScrollTo(targetY, duration) {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const startY = window.scrollY;
  const dist = targetY - startY;
  if (reduce || Math.abs(dist) < 4) { window.scrollTo(0, targetY); return; }
  const dur = duration || 560;
  const start = Date.now();
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const tick = () => {
    const t = Math.min(1, (Date.now() - start) / dur);
    window.scrollTo(0, startY + dist * ease(t));
    if (t < 1) setTimeout(tick, 16);
  };
  tick();
}

// Engraved line-art illustrations for the guidance cells. Flat drawings in
// the brand olive, each with one quiet living element: the summit dot pulses
// and ripples (01), the audience dots orbit the course (02), the arrow rises
// from the foundations (03). Loops are gated on prefers-reduced-motion.
function GuideArt({ kind }) {
  const common = {
    className: "casl__guide-art",
    viewBox: "0 0 120 84",
    fill: "none",
    "aria-hidden": "true",
  };
  if (kind === "paper") {
    return (
      <svg {...common}>
        <g className="casl__art-stroke" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <path d="M18 66h84" opacity="0.45" />
          <path d="M26 66V46" />
          <path d="M42 66V36" />
          <path d="M58 66V42" />
          <path d="M74 66V26" />
          <path d="M90 66V32" />
          <path className="casl__art-accent" d="M22 52 42 32l16 6 18-16 16 6" strokeWidth="1.6" />
        </g>
        <circle className="casl__anim-ripple casl__anim-travel" cx="74" cy="22" r="2.6"
                fill="none" stroke="currentColor" strokeWidth="1" opacity="0" />
        <circle className="casl__art-dot casl__anim-pulse casl__anim-travel" cx="74" cy="22" r="2.6" fill="currentColor" />
      </svg>
    );
  }
  if (kind === "market") {
    return (
      <svg {...common}>
        <g className="casl__art-stroke" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <circle cx="60" cy="44" r="11" />
          <circle cx="60" cy="44" r="23" opacity="0.6" strokeDasharray="3 5" />
          <circle cx="60" cy="44" r="35" opacity="0.32" strokeDasharray="2 7" />
        </g>
        <g className="casl__art-dot casl__anim-orbit" fill="currentColor">
          <circle cx="83" cy="44" r="2" />
          <circle cx="44" cy="26" r="2" />
        </g>
        <g className="casl__art-dot casl__anim-orbit is-rev" fill="currentColor">
          <circle cx="33" cy="56" r="2" />
          <circle cx="76" cy="68" r="2" />
        </g>
        <circle className="casl__art-dot casl__anim-pulse" cx="60" cy="44" r="2.6" fill="currentColor" />
      </svg>
    );
  }
  // kind === "capability": a section drawing of foundations bearing a course.
  return (
    <svg {...common}>
      <g className="casl__art-stroke" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M30 66h60" opacity="0.45" />
        <path d="M36 66V54h48v12" />
        <path d="M42 54V42h36v12" />
        <path d="M50 42V30h20v12" />
      </g>
      <g className="casl__art-stroke casl__anim-rise" stroke="currentColor" strokeWidth="1.6"
         strokeLinecap="round" strokeLinejoin="round">
        <path className="casl__art-accent" d="M60 30V18m0 0-6 6m6-6 6 6" />
      </g>
    </svg>
  );
}

// Eased count-up for the landscape totals. setTimeout-driven (not rAF) so it
// still runs where frame callbacks are throttled; renders the final value
// immediately under reduced motion or after the heal probe fires.
function CountNum({ value, on, instant, delay }) {
  const reduce = typeof window !== "undefined" && window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const skip = instant || reduce;
  const [n, setN] = useState(skip ? value : 0);
  useEffect(() => {
    if (skip) { setN(value); return; }
    if (!on) return;
    let cancelled = false;
    const dur = 850;
    const start = Date.now() + (delay || 0);
    const tick = () => {
      if (cancelled) return;
      const t = (Date.now() - start) / dur;
      if (t < 0) { setTimeout(tick, 40); return; }
      const k = Math.min(1, t);
      const e = 1 - Math.pow(1 - k, 3);
      setN(Math.round(value * e));
      if (k < 1) setTimeout(tick, 40);
    };
    tick();
    return () => { cancelled = true; };
  }, [on, skip, value, delay]);
  return <>{n}</>;
}

// Industry glyphs. One thin line icon per industry, same engraved register
// as the guidance art. 24px grid, stroked in currentColor.
const IND_GLYPHS = {
  "Aerospace": <g><path d="M12 3l2.2 6.5L21 12l-6.8 2.5L12 21l-2.2-6.5L3 12l6.8-2.5z" opacity="0.0" /><path d="M12 3v7.2M12 10.2L4 15l8-1.4 8 1.4-8-4.8zM12 13.6V19M9.4 19h5.2" /></g>,
  "Infocomm Technology": <g><rect x="5" y="5" width="14" height="14" rx="1" /><path d="M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2" /><rect x="9.5" y="9.5" width="5" height="5" /></g>,
  "Manufacturing": <g><circle cx="12" cy="12" r="3.2" /><path d="M12 4.5v2.3M12 17.2v2.3M4.5 12h2.3M17.2 12h2.3M6.7 6.7l1.6 1.6M15.7 15.7l1.6 1.6M17.3 6.7l-1.6 1.6M8.3 15.7l-1.6 1.6" /></g>,
  "Cross-Industry": <g><circle cx="9" cy="9.5" r="4.5" /><circle cx="15" cy="14.5" r="4.5" /></g>,
  "Legal & Compliance": <g><path d="M12 4v15M8.5 19h7M12 6.5l-5.5 1M12 6.5l5.5 1M6.5 7.5L4 13a2.6 2.6 0 0 0 5 0zM17.5 7.5L15 13a2.6 2.6 0 0 0 5 0z" /></g>,
  "Training & Adult Education": <g><path d="M12 5L3 9l9 4 9-4z" /><path d="M7 11v5c0 1.2 2.2 2.5 5 2.5s5-1.3 5-2.5v-5M21 9v5" /></g>,
  "Logistics & Supply Chain": <g><path d="M4 8.5l8-4 8 4v7l-8 4-8-4z" /><path d="M4 8.5l8 4 8-4M12 12.5v7" /></g>,
  "Media, Design & Creative": <g><path d="M14.5 4.5l5 5L9 20H4v-5z" /><path d="M12 7l5 5M4 20l4.5-1" /></g>,
  "Financial Services": <g><path d="M4 19h16M6 19v-6M10.5 19V9M15 19v-8.5M19.5 19V6" /><path d="M5 8.5L11 5l4 3 4.5-3.5" opacity="0.6" /></g>,
  "Human Resource": <g><circle cx="9" cy="8.5" r="3" /><path d="M3.5 19c.5-3.4 2.8-5.2 5.5-5.2s5 1.8 5.5 5.2" /><circle cx="16.5" cy="9.5" r="2.4" /><path d="M16 13.8c2.4.1 4.1 1.7 4.6 4.6" /></g>,
  "Healthcare": <g><circle cx="12" cy="12" r="8" /><path d="M12 8.5v7M8.5 12h7" /></g>,
  "Wholesale Trade": <g><rect x="4" y="12" width="7" height="7" /><rect x="13" y="12" width="7" height="7" /><rect x="8.5" y="5" width="7" height="7" /></g>,
  "Security & Defence": <g><path d="M12 3.5l7 2.5v5.5c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6z" /><path d="M9 11.8l2.2 2.2 4-4.2" /></g>,
  "Marine & Offshore": <g><circle cx="12" cy="5.8" r="2" /><path d="M12 7.8V19M12 19c-3.8 0-6.8-2.4-7.5-5.5L7 14M12 19c3.8 0 6.8-2.4 7.5-5.5L17 14M8.5 10.5h7" /></g>,
  "Built Environment": <g><path d="M4 20h16M6 20V8l5-3v15M11 20V9h7v11" /><path d="M14 12h1.5M14 15h1.5M8 9h1M8 12h1M8 15h1" opacity="0.7" /></g>,
  "Leadership & Management": <g><path d="M7 21V4M7 4h11l-2.5 3.5L18 11H7" /></g>,
  "Energy & Power": <g><path d="M13 3L5.5 13.5H11L9.5 21 18 10h-5.5z" /></g>,
  "Food Services & Hospitality": <g><path d="M4 16h16M5.5 16a6.5 6.5 0 0 1 13 0M12 9.5V8" /><path d="M9 19h6" opacity="0.7" /></g>,
  "Biopharma & Life Sciences": <g><path d="M10 3.5h4M11 3.5V10l-5 8.5a1.6 1.6 0 0 0 1.4 2.5h9.2a1.6 1.6 0 0 0 1.4-2.5L13 10V3.5" /><path d="M8.2 15.5h7.6" opacity="0.7" /></g>,
};
function IndustryGlyph({ name, size }) {
  const art = IND_GLYPHS[name];
  if (!art) return null;
  return (
    <svg className="casl__ind-glyph" viewBox="0 0 24 24" width={size || 18} height={size || 18}
         fill="none" stroke="currentColor" strokeWidth="1.4"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {art}
    </svg>
  );
}

function PinGlyph({ filled }) {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
      <path d="M4.5 2h7v12l-3.5-2.8L4.5 14z"
            fill={filled ? "currentColor" : "none"}
            stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function CaslDashboard() {
  const all = (typeof window !== "undefined" && window.TB_CASL) || [];
  const industries = (typeof window !== "undefined" && window.TB_CASL_INDUSTRIES) || ["All industries"];

  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("All industries");
  const [phase, setPhase] = useState("all");
  const [sort, setSort] = useState("az");
  const [selected, setSelected] = useState(null); // skill object | null
  const [shown, setShown] = useState(24);          // pagination cap
  const [landOpen, setLandOpen] = useState(false); // landscape: show all industries
  const [barsIn, setBarsIn] = useState(false);     // landscape bars entrance
  const [barsHeal, setBarsHeal] = useState(false); // skip transition where timelines are paused
  const landRef = useRef(null);                    // landscape root, for the heal probe
  const resultsRef = useRef(null);                 // scroll anchor for the result list

  // ---- Working list (pinned skills), persisted between visits ----
  const [pinned, setPinned] = useState(() => {
    try {
      const raw = localStorage.getItem(SHORTLIST_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.filter(t => typeof t === "string") : [];
    } catch (e) { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem(SHORTLIST_KEY, JSON.stringify(pinned)); } catch (e) {}
  }, [pinned]);
  const isPinned = (title) => pinned.indexOf(title) !== -1;
  const togglePin = (title) => setPinned(p =>
    p.indexOf(title) !== -1 ? p.filter(t => t !== title) : [...p, title]);

  // Reset shown count when filters change.
  useEffect(() => { setShown(24); }, [query, industry, phase, sort]);

  // Landscape bars grow in shortly after mount. Some sandboxed preview
  // iframes pause the document timeline, so the width transition never
  // advances and the bars would stay at 0 forever — probe after a beat and,
  // if a track still measures empty, disable the transition so the bars
  // snap to their final widths (same heal pattern as .tb-reveal in shared.jsx).
  useEffect(() => {
    const t = setTimeout(() => setBarsIn(true), 80);
    const heal = setTimeout(() => {
      const root = landRef.current;
      const track = root && root.querySelector(".casl__land-track");
      if (track && track.getBoundingClientRect().width < 1) setBarsHeal(true);
    }, 1100);
    return () => { clearTimeout(t); clearTimeout(heal); };
  }, []);

  const counts = useMemo(() => ({
    current: all.filter(s => s.phase === 1).length,
    added: all.filter(s => s.phase === 2).length,
    total: all.length,
  }), [all]);

  // Industry landscape, computed from the register itself.
  const indStats = useMemo(() => {
    const m = new Map();
    all.forEach(s => {
      const e = m.get(s.industry) || { name: s.industry, total: 0, added: 0 };
      e.total += 1;
      if (s.phase === 2) e.added += 1;
      m.set(s.industry, e);
    });
    return [...m.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  }, [all]);
  const landMax = indStats.length ? indStats[0].total : 1;
  const landRows = landOpen ? indStats : indStats.slice(0, 9);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = all.filter(s => {
      if (industry !== "All industries" && s.industry !== industry) return false;
      if (phase !== "all" && s.phase !== phase) return false;
      if (!q) return true;
      return (s.title.toLowerCase().includes(q) ||
              s.desc.toLowerCase().includes(q) ||
              s.industry.toLowerCase().includes(q));
    });
    list = [...list];
    if (sort === "az") list.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "za") list.sort((a, b) => b.title.localeCompare(a.title));
    else if (sort === "industry") list.sort((a, b) =>
      a.industry.localeCompare(b.industry) || a.title.localeCompare(b.title));
    return list;
  }, [all, query, industry, phase, sort]);

  const visible = filtered.slice(0, shown);

  // Active-filter chips.
  const chips = [];
  if (query.trim()) chips.push({ key: "q", label: "\u201C" + query.trim() + "\u201D", clear: () => setQuery("") });
  if (industry !== "All industries") chips.push({ key: "ind", label: industry, clear: () => setIndustry("All industries") });
  if (phase !== "all") chips.push({ key: "ph", label: phase === 1 ? "Current CASL" : "New in update", clear: () => setPhase("all") });
  const clearAll = () => { setQuery(""); setIndustry("All industries"); setPhase("all"); };

  const scrollToResults = () => {
    const el = resultsRef.current;
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 88;
      smoothScrollTo(Math.max(0, y));
    }
  };

  // Switching the view from a control high up the page should bring the
  // results into view, rather than silently changing them far below.
  const applyView = (id) => { setPhase(id); scrollToResults(); };

  // Landscape rows toggle the industry filter.
  const applyIndustry = (name) => {
    setIndustry(prev => (prev === name ? "All industries" : name));
    if (industry !== name) scrollToResults();
  };

  // ---- Working-list enquiry mailto ----
  const pinnedSkills = pinned
    .map(t => all.find(s => s.title === t))
    .filter(Boolean);
  const shortlistMailto = "mailto:hello@2birds.asia" +
    "?subject=" + encodeURIComponent(
      "Course development enquiry · working list of " + pinnedSkills.length +
      (pinnedSkills.length === 1 ? " skill" : " skills") + " from the CASL") +
    "&body=" + encodeURIComponent(
      "Dear 2birds,\n\nWe are weighing the following skills from the CASL register for course development, " +
      "and should like your read on their marketability and the right funding route.\n\n" +
      pinnedSkills.map((s, i) =>
        (i + 1) + ". " + s.title + " · " + s.industry +
        (s.phase === 2 ? " (new, from 2 June 2026)" : " (current register)")).join("\n") +
      "\n\nOur organisation: \nCourses we already run: \nExpected timeline: \n\nKind regards,\n");

  // Lock scroll while modal open.
  useEffect(() => {
    if (selected) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [selected]);

  // Escape closes modal.
  useEffect(() => {
    if (!selected) return;
    const onKey = (e) => { if (e.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  // Flag the body while the sticky working-list dock is shown, so the floating
  // WhatsApp button lifts clear of it and the page reserves room at the foot.
  useEffect(() => {
    const on = pinned.length > 0 && !selected;
    document.body.classList.toggle("has-worklist-dock", on);
    return () => document.body.classList.remove("has-worklist-dock");
  }, [pinned.length, selected]);

  const cardKey = (fn) => (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); }
  };

  // Marketability signals for the selected skill.
  const selStat = selected ? indStats.find(s => s.name === selected.industry) : null;
  const selRank = selStat ? indStats.indexOf(selStat) + 1 : null;

  return (
    <div className="casl">

      {/* ---- Publication band: the first edition, in two stages ---- */}
      <div className="casl__pub">
        <div className="casl__pub-head">
          <span className="casl__pub-eyebrow">First edition · published in two stages</span>
          <p className="casl__pub-note">
            The register is refreshed annually. Registered Training Partners are notified
            of the next update through TPGateway in mid-2027.
          </p>
        </div>
        <div className="casl__pub-cards">
          <div
            className={"casl__pub-card" + (phase === 1 ? " is-active" : "")}
            role="button" tabIndex={0}
            aria-pressed={phase === 1}
            onClick={() => applyView(1)}
            onKeyDown={cardKey(() => applyView(1))}
          >
            <div className="casl__pub-row">
              <span className="casl__pub-tag">Current CASL</span>
              <span className="casl__pub-badge is-now">In force</span>
            </div>
            <span className="casl__pub-eff">Effective until 1 June 2026</span>
            <p className="casl__pub-desc">
              The list presently in force, last updated 30 September 2025.
              <strong> {counts.current} skills.</strong>
            </p>
            <div className="casl__pub-foot">
              <span className="casl__pub-apply">{phase === 1 ? "Filtered below \u2713" : "Filter register \u2193"}</span>
              <a className="casl__pub-link" href={OFFICIAL_CURRENT} target="_blank" rel="noopener noreferrer"
                 onClick={(e) => e.stopPropagation()}>Official SSG list ↗</a>
            </div>
          </div>

          <div
            className={"casl__pub-card is-updated" + (phase === "all" ? " is-active" : "")}
            role="button" tabIndex={0}
            aria-pressed={phase === "all"}
            onClick={() => applyView("all")}
            onKeyDown={cardKey(() => applyView("all"))}
          >
            <div className="casl__pub-row">
              <span className="casl__pub-tag">Updated CASL</span>
              <span className="casl__pub-badge is-next">From 2 Jun 2026</span>
            </div>
            <span className="casl__pub-eff">Effective from 2 June 2026</span>
            <p className="casl__pub-desc">
              The current skills together with additional skills drawn from the Skills
              Framework 2.0, last updated 2 May 2026.
              <strong> {counts.total} skills.</strong>
            </p>
            <div className="casl__pub-foot">
              <span className="casl__pub-apply">{phase === "all" ? "Filtered below \u2713" : "Filter register \u2193"}</span>
              <a className="casl__pub-link" href={OFFICIAL_UPDATED} target="_blank" rel="noopener noreferrer"
                 onClick={(e) => e.stopPropagation()}>Official SSG list ↗</a>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Industry landscape: where the register concentrates ---- */}
      <div className={"casl__land" + (barsHeal ? " is-noanim" : barsIn ? " is-anim" : "")}
           role="group" aria-label="Skills by industry" ref={landRef}>
        <div className="casl__land-head">
          <div className="casl__land-head-l">
            <span className="casl__land-eyebrow">The shape of the register</span>
            <p className="casl__land-note">
              Industries ranked by their bench of approved skills. The June 2026
              additions mark where SkillsFuture Singapore is widening approval, a
              first signal of demand when weighing what to develop. Select an
              industry to filter the register below.
            </p>
          </div>
          <div className="casl__land-legend" aria-hidden="true">
            <span className="casl__land-key"><i className="casl__land-swatch is-cur"></i>Current register</span>
            <span className="casl__land-key"><i className="casl__land-swatch is-new"></i>Added · Jun 2026</span>
          </div>
        </div>

        <div className="casl__land-rows">
          {landRows.map((st, i) => {
            const w = (st.total / landMax) * 100;
            const curPct = ((st.total - st.added) / st.total) * 100;
            const active = industry === st.name;
            return (
              <button
                key={st.name}
                type="button"
                className={"casl__land-row" + (active ? " is-active" : "")}
                aria-pressed={active}
                onClick={() => applyIndustry(st.name)}
                style={{ transitionDelay: (i * 18) + "ms" }}
              >
                <span className="casl__land-ic"><IndustryGlyph name={st.name} /></span>
                <span className="casl__land-name">{st.name}</span>
                <span className="casl__land-bar">
                  <span
                    className="casl__land-track"
                    style={{
                      width: barsIn ? w + "%" : "0%",
                      transitionDelay: (120 + i * 40) + "ms",
                      "--sheen-delay": (760 + i * 60) + "ms",
                    }}
                  >
                    <span className="casl__land-seg is-cur" style={{ width: curPct + "%" }}></span>
                    <span className="casl__land-seg is-new" style={{ width: (100 - curPct) + "%" }}></span>
                  </span>
                </span>
                <span className="casl__land-nums" data-i18n-skip="true">
                  <CountNum value={st.total} on={barsIn} instant={barsHeal} delay={140 + i * 40} />
                  {st.added > 0 && <em> · {st.added} new</em>}
                </span>
              </button>
            );
          })}
        </div>

        {indStats.length > 9 && (
          <button type="button" className="casl__land-more" onClick={() => setLandOpen(o => !o)}>
            {landOpen ? "Show fewer industries ↑" : "Show all " + indStats.length + " industries ↓"}
          </button>
        )}
      </div>

      {/* ---- Filter bar ---- */}
      <div className="casl__filterbar" role="search">
        <label className="casl__search">
          <span className="casl__filter-label">Search</span>
          <input
            type="search"
            className="casl__search-input"
            placeholder="Search by skill, keyword, or description"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="casl__search-icon" aria-hidden="true">
            <svg viewBox="0 0 16 16" width="14" height="14">
              <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11 11l3 3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
        </label>

        <label className="casl__field">
          <span className="casl__filter-label">Industry</span>
          <select className="casl__select" value={industry} onChange={(e) => setIndustry(e.target.value)}>
            {industries.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </label>

        <label className="casl__field">
          <span className="casl__filter-label">Sort</span>
          <select className="casl__select" value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
      </div>

      {/* ---- Controls: view toggle + live count ---- */}
      <div className="casl__controls" ref={resultsRef}>
        <fieldset className="casl__phases">
          <legend className="casl__filter-label">View</legend>
          <div className="casl__phase-group">
            {VIEWS.map(p => (
              <button
                key={p.id}
                type="button"
                className={"casl__phase-btn" + (phase === p.id ? " is-active" : "")}
                onClick={() => applyView(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="casl__count" aria-live="polite" data-i18n-skip="true">
          <span className="casl__count-num">{filtered.length}</span>
          <span className="casl__count-text">
            {filtered.length === 1 ? "skill" : "skills"} shown
            {filtered.length !== all.length && <> · of <em>{all.length}</em> in the register</>}
          </span>
        </div>
      </div>

      {/* ---- Working list tray ---- */}
      {pinned.length > 0 && (
        <div className="casl__tray" role="region" aria-label="Your working list">
          <div className="casl__tray-top">
            <span className="casl__tray-label" data-i18n-skip="true">
              <PinGlyph filled={true} /> Your working list
              <em> · {pinned.length} {pinned.length === 1 ? "skill" : "skills"}</em>
            </span>
            <div className="casl__tray-actions">
              <a className="casl__tray-send" href={shortlistMailto}>Send list to 2birds →</a>
              <button type="button" className="casl__chips-clear" onClick={() => setPinned([])}>Clear list</button>
            </div>
          </div>
          <div className="casl__tray-chips" data-i18n-skip="true">
            {pinned.map(t => (
              <button key={t} type="button" className="casl__chip" onClick={() => togglePin(t)}
                      aria-label={"Remove " + t + " from working list"}>
                {t}<span className="casl__chip-x" aria-hidden="true">×</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ---- Active filter chips ---- */}
      {chips.length > 0 && (
        <div className="casl__chips" data-i18n-skip="true">
          <span className="casl__chips-label">Filtering</span>
          {chips.map(c => (
            <button key={c.key} type="button" className="casl__chip" onClick={c.clear}
                    aria-label={"Remove filter " + c.label}>
              {c.label}<span className="casl__chip-x" aria-hidden="true">×</span>
            </button>
          ))}
          <button type="button" className="casl__chips-clear" onClick={clearAll}>Clear all</button>
        </div>
      )}

      {/* ---- Cards ---- */}
      {filtered.length === 0 ? (
        <div className="casl__empty">
          <svg className="casl__empty-art" viewBox="0 0 120 84" fill="none" aria-hidden="true">
            <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <circle cx="54" cy="38" r="20" />
              <path d="M69 53l16 16" />
              <path d="M46 38h16M54 30v16" opacity="0.55" />
            </g>
          </svg>
          <p className="casl__empty-title">No skills match those filters.</p>
          <p className="casl__empty-body">
            Adjust the search or industry, or write to us at{" "}
            <a href="mailto:hello@2birds.asia">hello@2birds.asia</a> for an indicative quote.
          </p>
          <button type="button" className="casl__chips-clear" onClick={clearAll}>Clear all filters</button>
        </div>
      ) : (
        <div className="casl__grid">
          {visible.map((s, i) => (
            <article
              key={s.title + i}
              className={"casl__card" + (isPinned(s.title) ? " is-pinned" : "")}
              tabIndex={0}
              role="button"
              aria-label={"View details for " + s.title}
              onClick={() => setSelected(s)}
              onKeyDown={cardKey(() => setSelected(s))}
            >
              <div className="casl__card-head">
                <span className={"casl__phase-tag" + (s.phase === 2 ? " is-p2" : " is-p1")}>
                  {s.phase === 2 ? "New · Jun 2026" : "Current"}
                </span>
                <span className="casl__card-headr">
                  <span className="casl__card-ind" data-i18n-skip="true"><IndustryGlyph name={s.industry} size={14} />{s.industry}</span>
                  <button
                    type="button"
                    className={"casl__pin" + (isPinned(s.title) ? " is-on" : "")}
                    aria-label={isPinned(s.title)
                      ? "Remove " + s.title + " from working list"
                      : "Pin " + s.title + " to working list"}
                    title={isPinned(s.title) ? "On your working list" : "Pin to working list"}
                    onClick={(e) => { e.stopPropagation(); togglePin(s.title); }}
                  >
                    <PinGlyph filled={isPinned(s.title)} />
                  </button>
                </span>
              </div>
              <h3 className="casl__card-title" data-i18n-skip="true">{highlight(s.title, query)}</h3>
              <p className="casl__card-desc" data-i18n-skip="true">{highlight(s.desc, query)}</p>
              <div className="casl__card-foot">
                <span className="casl__card-cue">View skill · develop the course</span>
                <span className="casl__card-arrow" aria-hidden="true">→</span>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ---- Load more ---- */}
      {shown < filtered.length && (
        <div className="casl__loadmore">
          <button type="button" className="casl__loadmore-btn" onClick={() => setShown(s => s + 24)}>
            Show {Math.min(24, filtered.length - shown)} more
          </button>
          <span className="casl__loadmore-meta" data-i18n-skip="true">Showing {Math.min(shown, filtered.length)} of {filtered.length}</span>
        </div>
      )}

      {/* ---- Choosing what to develop: from register to enrolment ---- */}
      <div className="casl__guide">
        <div className="casl__guide-head">
          <span className="casl__guide-eyebrow">Choosing what to develop</span>
          <h3 className="casl__guide-title">From register to <em>enrolment</em>.</h3>
          <p className="casl__guide-sub">
            A place on the CASL means SkillsFuture Singapore will entertain a course
            proposal against the skill. Whether the course fills a classroom is a
            different question. Three readings we take before any courseware is written.
          </p>
        </div>
        <div className="casl__guide-grid">
          <div className="casl__guide-cell">
            <GuideArt kind="paper" />
            <span className="casl__guide-num">01</span>
            <h4 className="casl__guide-cell-title">Demand on paper</h4>
            <p className="casl__guide-cell-body">
              The landscape above shows where the register concentrates, and where the
              June 2026 update widened it. Industries gaining the most new skills are
              where SkillsFuture Singapore is opening approval lanes, a useful first
              proxy for demand.
            </p>
          </div>
          <div className="casl__guide-cell">
            <GuideArt kind="market" />
            <span className="casl__guide-num">02</span>
            <h4 className="casl__guide-cell-title">Demand in the market</h4>
            <p className="casl__guide-cell-body">
              A listing is an approval lane, not an audience. Who pays, whether the
              employer, the learner or the funding tier, and how often the skill renews,
              decide whether a course fills. We pressure-test this with you at scoping.
            </p>
          </div>
          <div className="casl__guide-cell">
            <GuideArt kind="capability" />
            <span className="casl__guide-num">03</span>
            <h4 className="casl__guide-cell-title">Your capability</h4>
            <p className="casl__guide-cell-body">
              The course you can credibly deliver beats the course with the largest
              market. Your AE bench, assessment capacity and track record set how fast
              you reach a first cohort, and how well it withstands TPQA.
            </p>
          </div>
        </div>
        <div className="casl__guide-foot">
          <p className="casl__guide-foot-text">
            Pin skills to a working list as you browse, then send it across. We reply
            with a frank read on marketability and the right funding route, within two
            working days.
          </p>
          <div className="casl__guide-foot-actions">
            <a className="btn btn-on-dark"
               href={pinned.length > 0 ? shortlistMailto :
                 "mailto:hello@2birds.asia?subject=" +
                 encodeURIComponent("Course development enquiry · choosing from the CASL")}>
              {pinned.length > 0
                ? "Send my working list (" + pinned.length + ")"
                : "Write to us about the register"}
            </a>
            <a className="btn btn-ghost-on-dark" href="contact.html">Book a scoping call</a>
          </div>
        </div>
      </div>

      {/* ---- Legal notice ---- */}
      <aside className="casl__legal" aria-label="Legal notice and disclaimer">
        <span className="casl__legal-kicker">Legal notice and disclaimer</span>
        <h4 className="casl__legal-title">Disclaimer and terms of reference</h4>
        <div className="casl__legal-cols">
          <p className="casl__legal-body">
            This dashboard reproduces, for ease of reference only, selected fields drawn
            from the Course Approval Skills List (the <em>“CASL”</em>) as published and
            amended from time to time by SkillsFuture Singapore (<em>“SSG”</em>) on
            TPGateway. It is an unofficial working aid. It possesses no official standing
            and confers no right, benefit or legitimate expectation of any kind. In the
            event of any inconsistency between this dashboard and the CASL as officially
            published, the latter shall prevail in all respects.
          </p>
          <p className="casl__legal-body">
            This dashboard is furnished strictly on an “as is” and “as available” basis.
            2birds makes no representation, and gives no warranty or undertaking of any
            kind, whether express, implied or statutory, including as to the accuracy,
            completeness, currency or fitness for any particular purpose of the information
            presented. All skill titles, descriptions and effective dates remain liable to
            amendment by SSG at any time and without notice.
          </p>
          <p className="casl__legal-body">
            The “industry” and “intended participants” fields, together with all counts,
            rankings and market observations derived from them, represent the editorial
            interpretation of 2birds and are provided solely as an aid to navigation. They
            carry no regulatory significance, are not SSG classifications, and must not be
            relied upon as such. The appearance of a skill in this dashboard does not
            signify that a course is, or will be, eligible for funding or approved by SSG,
            such approval residing at all times in the sole and absolute discretion of SSG,
            nor does it constitute an endorsement or recommendation by 2birds. Nothing in
            this dashboard constitutes legal, financial, regulatory or other professional
            advice.
          </p>
          <p className="casl__legal-body">
            To the fullest extent permitted by law, 2birds disclaims and excludes all
            liability for any loss, damage, cost or expense, whether direct, indirect or
            consequential, howsoever arising, suffered by any person acting or refraining
            from acting in reliance upon this dashboard. The responsibility for verifying
            every particular against the officially published register, before acting,
            rests in every case with the reader alone.
          </p>
        </div>
        <span className="casl__legal-meta">
          Maintained by 2birds · Reflects the CASL as at 2 May 2026 · The official SSG register prevails.
        </span>
      </aside>

      {/* ---- Sticky working-list dock: the prominent, always-in-reach CTA that
              appears the moment a skill is pinned (portalled so position:fixed is
              viewport-relative regardless of ancestor transforms). ---- */}
      {pinned.length > 0 && !selected && ReactDOM.createPortal(
        <div className="casl__dock" role="region" aria-label="Your working list">
          <div className="casl__dock-inner">
            <div className="casl__dock-info">
              <PinGlyph filled={true} />
              <span className="casl__dock-label">Your working list</span>
              <span className="casl__dock-count" data-i18n-skip="true">{pinned.length}</span>
            </div>
            <div className="casl__dock-actions">
              <a className="casl__dock-send" href={shortlistMailto}>Send my working list</a>
              <a className="casl__dock-call" href="contact.html">Book a scoping call</a>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ---- Detail modal (portalled to body so position:fixed is viewport-relative) ---- */}
      {selected && ReactDOM.createPortal(
        <div
          className="casl__modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="casl-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div className="casl__modal-card is-v2">
            <button type="button" className="casl__modal-close" aria-label="Close" onClick={() => setSelected(null)}>×</button>

            <header className="casl__m2-head">
              <span className="casl__m2-roundel" aria-hidden="true">
                <IndustryGlyph name={selected.industry} size={26} />
              </span>
              <div className="casl__m2-head-text">
                <div className="casl__m2-tags">
                  <span className={"casl__phase-tag" + (selected.phase === 2 ? " is-p2" : " is-p1")}>
                    {selected.phase === 2 ? "New · from 2 June 2026" : "Current · in force"}
                  </span>
                  <span className="casl__modal-ind" data-i18n-skip="true">{selected.industry}</span>
                </div>
                <h2 id="casl-modal-title" className="casl__modal-title" data-i18n-skip="true">{selected.title}</h2>
              </div>
            </header>

            <div className="casl__m2-body">
              <div className="casl__m2-main" data-i18n-skip="true">
                <span className="casl__m2-label">Skills description</span>
                <p className="casl__m2-lead">{selected.desc}</p>

                <span className="casl__m2-label">Intended participants</span>
                <div className="casl__m2-chips">
                  {String(selected.participants).split("·").map(p => p.trim()).filter(Boolean).map(p => (
                    <span key={p} className="casl__m2-chip">{p}</span>
                  ))}
                </div>

                <span className="casl__m2-label">Register status</span>
                <div className="casl__m2-line" role="img"
                     aria-label={selected.phase === 1
                       ? "On the register since 30 September 2025, in force until 1 June 2026, carried into the updated register"
                       : "Published 2 May 2026, takes effect 2 June 2026"}>
                  <div className="casl__m2-node is-past">
                    <i className="casl__m2-dot"></i>
                    <span className="casl__m2-node-date">{selected.phase === 1 ? "30 Sep 2025" : "2 May 2026"}</span>
                    <span className="casl__m2-node-cap">{selected.phase === 1 ? "On the register" : "Published"}</span>
                  </div>
                  <i className="casl__m2-rule" aria-hidden="true"></i>
                  <div className={"casl__m2-node" + (selected.phase === 1 ? " is-now" : "")}>
                    <i className="casl__m2-dot"></i>
                    <span className="casl__m2-node-date">{selected.phase === 1 ? "Today" : "2 Jun 2026"}</span>
                    <span className="casl__m2-node-cap">{selected.phase === 1 ? "In force" : "Takes effect"}</span>
                  </div>
                  <i className="casl__m2-rule is-ahead" aria-hidden="true"></i>
                  <div className="casl__m2-node is-ahead">
                    <i className="casl__m2-dot"></i>
                    <span className="casl__m2-node-date">{selected.phase === 1 ? "2 Jun 2026 →" : "Mid-2027 →"}</span>
                    <span className="casl__m2-node-cap">{selected.phase === 1 ? "Carried into the update" : "Next annual refresh"}</span>
                  </div>
                </div>
              </div>

              {selStat && (
                <aside className="casl__m2-rail" data-i18n-skip="true">
                  <span className="casl__signals-kicker">Marketability · read from the register</span>

                  <div className="casl__m2-rank" aria-label={"Ranked " + selRank + " of " + indStats.length + " industries by bench depth"}>
                    <div className="casl__m2-rank-bars" aria-hidden="true">
                      {indStats.map((st) => (
                        <i key={st.name}
                           className={"casl__m2-rank-bar" + (st.name === selStat.name ? " is-sel" : "")}
                           style={{ height: Math.max(8, (st.total / landMax) * 100) + "%" }}></i>
                      ))}
                    </div>
                    <p className="casl__m2-rank-cap">
                      <strong>{selStat.name}</strong> ranks <strong>{selRank} of {indStats.length}</strong> industries
                      by depth of approved skills, a {selRank <= 5 ? "deep" : selRank <= 12 ? "moderate" : "narrow"} bench.
                    </p>
                  </div>

                  <div className="casl__m2-figs">
                    <div className="casl__m2-fig">
                      <span className="casl__signal-num">{selStat.total}</span>
                      <span className="casl__signal-cap">skills in this industry</span>
                    </div>
                    <div className="casl__m2-fig">
                      <span className="casl__signal-num">{selStat.added}</span>
                      <span className="casl__signal-cap">added · Jun 2026</span>
                    </div>
                  </div>
                  <p className="casl__signal-note">
                    {selected.phase === 2
                      ? "This skill is one of the additions, drawn from the Skills Framework 2.0, marking where SkillsFuture Singapore is widening approval."
                      : selStat.added > 0
                        ? "SkillsFuture Singapore widened this industry in the refresh; this skill has held its place since first publication."
                        : "No additions here in the refresh; this skill is an established approval lane."}
                  </p>

                  <p className="casl__signals-foot">
                    A listing is an approval lane, not an audience. Funding tier, employer
                    sponsorship and your delivery capability decide whether the course fills.
                  </p>
                </aside>
              )}
            </div>

            <div className="casl__modal-cta">
              <a
                className="btn btn-primary"
                href={"mailto:hello@2birds.asia" +
                  "?subject=" + encodeURIComponent("Course development enquiry · " + selected.title) +
                  "&body=" + encodeURIComponent(
                    "Dear 2birds,\n\nWe should like to discuss the development of a course against the following CASL skill.\n\n" +
                    "Skill: " + selected.title + "\n" +
                    "Phase: " + selected.phase + "\n" +
                    "Industry: " + selected.industry + "\n" +
                    "Intended participants: " + selected.participants + "\n\n" +
                    "Skills description (as published by SSG):\n" + selected.desc + "\n\n" +
                    "Our organisation: \n" +
                    "Expected timeline: \n" +
                    "A note on the engagement: \n\n" +
                    "Kind regards,\n"
                  )
                }
              >
                Develop this course with 2birds
              </a>
              <button
                type="button"
                className={"btn btn-ghost casl__modal-pin" + (isPinned(selected.title) ? " is-on" : "")}
                onClick={() => togglePin(selected.title)}
              >
                <PinGlyph filled={isPinned(selected.title)} />
                {isPinned(selected.title) ? "On your working list" : "Pin to working list"}
              </button>
            </div>

            <p className="casl__modal-foot">
              We reply to enquiries within two working days during Singapore business hours.
              All proposals are subject to a no-obligation scoping call.
            </p>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

window.CaslDashboard = CaslDashboard;
