// CASL Dashboard, interactive Course Approval Skills List directory for ATOs.
// Renders inside a host page that has already loaded React + window.TB_CASL.

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

function CaslDashboard() {
  const all = (typeof window !== "undefined" && window.TB_CASL) || [];
  const industries = (typeof window !== "undefined" && window.TB_CASL_INDUSTRIES) || ["All industries"];

  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("All industries");
  const [phase, setPhase] = useState("all");
  const [sort, setSort] = useState("az");
  const [selected, setSelected] = useState(null); // skill object | null
  const [shown, setShown] = useState(24);          // pagination cap
  const resultsRef = useRef(null);                 // scroll anchor for the result list

  // Reset shown count when filters change.
  useEffect(() => { setShown(24); }, [query, industry, phase, sort]);

  const counts = useMemo(() => ({
    current: all.filter(s => s.phase === 1).length,
    added: all.filter(s => s.phase === 2).length,
    total: all.length,
  }), [all]);

  // "The shape of the register" — industries ranked by their bench of approved
  // skills, split into the current register (phase 1) and the June 2026
  // additions (phase 2).
  const industryStats = useMemo(() => {
    const map = {};
    for (const s of all) {
      const ind = s.industry || "Unclassified";
      if (!map[ind]) map[ind] = { industry: ind, current: 0, added: 0, total: 0 };
      if (s.phase === 2) map[ind].added += 1; else map[ind].current += 1;
      map[ind].total += 1;
    }
    return Object.values(map).sort((a, b) =>
      b.total - a.total || a.industry.localeCompare(b.industry));
  }, [all]);
  const maxIndustryTotal = industryStats.length ? industryStats[0].total : 1;

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

  // Switching the view from a control high up the page should bring the
  // results into view, rather than silently changing them far below.
  const applyView = (id) => {
    const el = resultsRef.current;
    setPhase(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 88;
      smoothScrollTo(Math.max(0, y));
    }
  };

  // Selecting an industry from the ranking filters the register below.
  const selectIndustry = (ind) => {
    setIndustry(industry === ind ? "All industries" : ind);
    const el = resultsRef.current;
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 88;
      smoothScrollTo(Math.max(0, y));
    }
  };

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

  const cardKey = (fn) => (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); }
  };

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

      {/* ---- The shape of the register: industries ranked, current vs added ---- */}
      <div className="casl__shape">
        <div className="casl__shape-head">
          <span className="casl__shape-eyebrow">The shape of the register</span>
          <div className="casl__shape-legend" aria-hidden="true">
            <span className="casl__legend-item">
              <span className="casl__legend-sw casl__legend-sw--current" /> Current register
            </span>
            <span className="casl__legend-item">
              <span className="casl__legend-sw casl__legend-sw--added" /> Added · Jun 2026
            </span>
          </div>
        </div>
        <p className="casl__shape-note">
          Industries ranked by their bench of approved skills. The June 2026 additions mark
          where SkillsFuture Singapore is widening approval, a first signal of demand when
          weighing what to develop. Select an industry to filter the register below.
        </p>
        <ul className="casl__shape-list">
          {industryStats.map((row) => (
            <li key={row.industry}>
              <button
                type="button"
                className={"casl__bar" + (industry === row.industry ? " is-active" : "")}
                onClick={() => selectIndustry(row.industry)}
                aria-pressed={industry === row.industry}
                aria-label={row.industry + ": " + row.total + " skills" + (row.added > 0 ? ", " + row.added + " added in June 2026" : "")}
              >
                <span className="casl__bar-name">{row.industry}</span>
                <span className="casl__bar-track" aria-hidden="true">
                  <span className="casl__bar-seg casl__bar-seg--current"
                        style={{ width: (row.current / maxIndustryTotal * 100) + "%" }} />
                  <span className="casl__bar-seg casl__bar-seg--added"
                        style={{ width: (row.added / maxIndustryTotal * 100) + "%" }} />
                </span>
                <span className="casl__bar-count">
                  {row.total}{row.added > 0 ? <em> +{row.added}</em> : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
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

        <div className="casl__count" aria-live="polite">
          <span className="casl__count-num">{filtered.length}</span>
          <span className="casl__count-text">
            {filtered.length === 1 ? "skill" : "skills"} shown
            {filtered.length !== all.length && <> · of <em>{all.length}</em> in the register</>}
          </span>
        </div>
      </div>

      {/* ---- Active filter chips ---- */}
      {chips.length > 0 && (
        <div className="casl__chips">
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
              className="casl__card"
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
                <span className="casl__card-ind">{s.industry}</span>
              </div>
              <h3 className="casl__card-title">{highlight(s.title, query)}</h3>
              <p className="casl__card-desc">{highlight(s.desc, query)}</p>
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
          <span className="casl__loadmore-meta">Showing {Math.min(shown, filtered.length)} of {filtered.length}</span>
        </div>
      )}

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
            The “industry” and “intended participants” fields represent the editorial
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

      {/* ---- Detail modal (portalled to body so position:fixed is viewport-relative) ---- */}
      {selected && ReactDOM.createPortal(
        <div
          className="casl__modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="casl-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div className="casl__modal-card">
            <button type="button" className="casl__modal-close" aria-label="Close" onClick={() => setSelected(null)}>×</button>

            <div className="casl__modal-head">
              <span className={"casl__phase-tag" + (selected.phase === 2 ? " is-p2" : " is-p1")}>
                {selected.phase === 2 ? "New · from 2 June 2026" : "Current · in force"}
              </span>
              <span className="casl__modal-ind">{selected.industry}</span>
            </div>

            <h2 id="casl-modal-title" className="casl__modal-title">{selected.title}</h2>

            <dl className="casl__modal-meta">
              <dt>Skills description</dt>
              <dd>{selected.desc}</dd>
              <dt>Industry</dt>
              <dd>{selected.industry}</dd>
              <dt>Intended participants</dt>
              <dd>{selected.participants}</dd>
              <dt>Register status</dt>
              <dd>
                {selected.phase === 1
                  ? "Part of the current CASL, in force until 1 June 2026."
                  : "Added in the updated CASL, effective from 2 June 2026."}
              </dd>
            </dl>

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
              <button type="button" className="btn btn-ghost" onClick={() => setSelected(null)}>Cancel</button>
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
