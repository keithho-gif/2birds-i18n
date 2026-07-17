/* 2birds — TPQA criteria dashboard: score your practice, or read market best practices */
(function () {
  "use strict";

  var CRITERIA = [
    {
      roman: "I", code: "Criterion 1",
      title: "Course Administration and Corporate Governance",
      intro: "How the operation runs, and how it is governed.",
      items: [
        { id: "1.1", name: "Learner Communication and Management of Feedback, Requests, and Appeals",
          benefit: "A documented appeals channel deflects most disputes before they escalate. The feedback loop becomes your earliest indicator of curriculum drift.",
          practice: "A one-page learner charter, a feedback form linked from every course page, a shared inbox monitored within 24 hours, and a quarterly appeals log read at the management review. Where this is in place, you do not learn about a problem from an SSG complaint." },
        { id: "1.2", name: "Pre-course and Post-course Advisory Service",
          benefit: "The single biggest driver of completion rates and word-of-mouth referral. Pre-course advisory in particular reduces mismatched enrolment.",
          practice: "An eligibility check is run at enquiry, a course-fit conversation is held before any deposit is taken, and a thirty-day post-course check-in is tied to the trainer's continuing development. Every conversation is logged. The same script handles both pre and post." },
        { id: "1.3", name: "Administration Systems",
          benefit: "Operational savings, fewer manual handoffs and cleaner audit trails. Pays back across each cycle rather than at one point.",
          practice: "A single source of truth for enrolment, attendance and assessment, often an LMS integrated with finance, supported by a signed-off SOP for each routine task. The administrative team stops asking the same question twice." },
        { id: "1.4", name: "Corporate Governance",
          benefit: "The foundation on which every other system rests. A board that signs off on policy is a board that enterprise clients can trust to deliver.",
          practice: "A board or governance committee meets quarterly, sees the dashboards, signs off on the policy stack, and records its decisions in writing. The bedrock of every other criterion in this assessment." },
        { id: "1.5", name: "Management of Marketing Activities",
          benefit: "Brand consistency and claim substantiation. Reduces the marginal cost of acquiring each learner and protects against misrepresentation complaints.",
          practice: "A claim-substantiation file sits behind every public statement, brand-style sign-off is documented, and a Code of Advertising compliance log is maintained. Each campaign is auditable backwards from the funnel to the source data." },
        { id: "1.6", name: "Processes for Tracking and Monitoring Organisational Outcomes",
          benefit: "Data is the only honest answer to 'are we improving?'. The systems built here become the dashboard the leadership team actually reads.",
          practice: "KPIs are defined per programme, reviewed monthly, and escalated when they breach. Measure, review and respond becomes routine rather than annual. The same dashboard goes to the board and to the operations meeting." }
      ]
    },
    {
      roman: "II", code: "Criterion 2",
      title: "Course Quality Assurance",
      intro: "How the courseware, the learners and the trainers are kept fit for purpose.",
      items: [
        { id: "2.1", name: "System on Course Quality Assurance",
          benefit: "Your courseware, asset and approval pipeline. Where this is sound, every downstream check tends to take care of itself.",
          practice: "A single QA specification, signed off by the curriculum lead, owns learning outcomes, assessment and trainer reference alignment. It is the artefact every trainer reads before delivering the course." },
        { id: "2.2", name: "System to Screen / Profile Learners to Ensure Course is Fit for Purpose",
          benefit: "Right learner, right course. Reduces refund requests, drop-outs and the reputational tail that follows mis-sold training.",
          practice: "A short pre-enrolment questionnaire is mapped to the course objectives. Learners outside the profile are referred elsewhere with a written note. The drop-out rate falls and the testimonial rate rises." },
        { id: "2.3", name: "System for Adult Educator (AE) Management",
          benefit: "The trainer is the product. A defensible AE roster, properly credentialled and prepared, is the most visible signal of training quality there is.",
          practice: "An onboarded directory of trainers carries credentials, course matches, observation records and continuing professional development. It is renewed annually, audited at every TPQA, and prepared before every cohort." },
        { id: "2.4", name: "Plan-Do-Check-Act (PDCA) System",
          benefit: "Continuous improvement built into the operating rhythm, not bolted on at audit time. Compounds across cycles.",
          practice: "Each cycle carries a plan reviewed quarterly, a do tracked in operations, a check at month-end, and an act recorded as a corrective action that is closed at the next review. The cycle is visible at every level of the operation." }
      ]
    },
    {
      roman: "III", code: "Criterion 3",
      title: "Outcomes",
      intro: "What the learner walks away with, and what the organisation grows into.",
      items: [
        { id: "3.1", name: "Organisational Outcomes",
          benefit: "Commercial sustainability. Without it, the training provider is a one-cycle organisation. With it, the operation scales and attracts repeat enterprise work.",
          practice: "Revenue per learner, gross margin per course, enterprise repeat rate, and three-year retention of the AE roster. These are the metrics that determine whether the business survives the next change in funding." },
        { id: "3.2", name: "Training Outcomes",
          benefit: "What the learner actually leaves with. The metric every other criterion serves, and the only one enterprise clients ever ask about.",
          practice: "Completion rate, assessment pass rate, post-course application such as promotion or deployment, and TRAQOM score. Each is tracked at the course and cohort level, and reported back to the funder and the learner alike." }
      ]
    }
  ];

  var host = document.getElementById("tb-tpqa");
  if (!host) return;

  var active = 0;
  var view = "score"; /* score | market */
  var ratings = {};   /* id -> 1..5 */

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function totals(ci) {
    var c = CRITERIA[ci];
    var got = c.items.reduce(function (a, it) { return a + (ratings[it.id] || 0); }, 0);
    return { got: got, max: c.items.length * 5 };
  }
  function grand() {
    var got = 0, max = 0, rated = 0, count = 0;
    CRITERIA.forEach(function (c) {
      c.items.forEach(function (it) {
        max += 5; count++;
        if (ratings[it.id]) { got += ratings[it.id]; rated++; }
      });
    });
    return { got: got, max: max, rated: rated, count: count };
  }

  function stars(it) {
    var r = ratings[it.id] || 0;
    var out = '<span class="tpqa__stars" data-id="' + it.id + '">';
    for (var i = 1; i <= 5; i++) {
      out += '<button class="tpqa__star' + (i <= r ? " is-on" : "") + '" data-v="' + i + '" aria-label="Rate ' + i + ' of 5">★</button>';
    }
    return out + "</span>";
  }

  function render() {
    var c = CRITERIA[active];
    var g = grand();

    host.innerHTML =
      '<div class="tpqa__tabs">' +
      CRITERIA.map(function (cr, i) {
        var t = totals(i);
        return '<button class="tpqa__tab' + (i === active ? " is-on" : "") + '" data-i="' + i + '">' +
          '<span class="small-caps">' + cr.code + " · " + cr.items.length + " items</span>" +
          '<span class="tpqa__tabtitle">' + esc(cr.title) + "</span>" +
          '<span class="tpqa__tabscore">' + t.got + " / " + t.max + "</span></button>";
      }).join("") +
      "</div>" +
      '<div class="tpqa__viewbar">' +
      '<span class="small-caps">View</span>' +
      '<button class="tpqa__view' + (view === "score" ? " is-on" : "") + '" data-view="score">Score your operation</button>' +
      '<button class="tpqa__view' + (view === "market" ? " is-on" : "") + '" data-view="market">Market best practices</button>' +
      (view === "score" ? '<span class="tpqa__hint">Click the stars to rate where you are today. ' + g.rated + " of " + g.count + " rated.</span>" : "") +
      "</div>" +
      '<p class="tpqa__intro">' + esc(c.intro) + "</p>" +
      '<div class="tpqa__list">' +
      c.items.map(function (it) {
        return '<div class="tpqa__item">' +
          '<div class="tpqa__itemhead">' +
          '<span class="tpqa__id">' + it.id + "</span>" +
          '<h4 class="tpqa__name">' + esc(it.name) + "</h4>" +
          (view === "score" ? stars(it) : "") +
          "</div>" +
          '<p class="tpqa__body">' + esc(view === "score" ? it.benefit : it.practice) + "</p>" +
          "</div>";
      }).join("") +
      "</div>" +
      (view === "score"
        ? '<div class="tpqa__total"><span class="small-caps">Where you are today</span>' +
          '<div class="tpqa__totalrow"><span class="tpqa__totalnum">' + g.got + " / " + g.max + "</span>" +
          '<span class="tpqa__meter"><i style="width:' + Math.round((g.got / g.max) * 100) + '%"></i></span>' +
          '<span class="tpqa__pct">' + Math.round((g.got / g.max) * 100) + "%</span></div>" +
          '<p class="tpqa__note">' + (g.rated === 0 ? "Score yourself by clicking the stars in each row." : g.rated < g.count ? "Keep going. An honest reading beats a kind one." : "A candid baseline. Bring it to the first conversation and we will read it together.") + "</p></div>"
        : "");

    host.querySelectorAll(".tpqa__tab").forEach(function (b) {
      b.addEventListener("click", function () { active = Number(b.dataset.i); render(); });
    });
    host.querySelectorAll(".tpqa__view").forEach(function (b) {
      b.addEventListener("click", function () { view = b.dataset.view; render(); });
    });
    host.querySelectorAll(".tpqa__star").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.parentElement.dataset.id;
        var v = Number(b.dataset.v);
        ratings[id] = ratings[id] === v ? 0 : v;
        render();
      });
    });
  }

  var css = document.createElement("style");
  css.textContent =
    ".tpqa__tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);border:1px solid var(--line);}" +
    "@media(max-width:760px){.tpqa__tabs{grid-template-columns:1fr;}}" +
    ".tpqa__tab{background:var(--ivory);padding:20px 22px;text-align:left;display:grid;gap:8px;transition:background .3s;}" +
    ".tpqa__tab:hover{background:var(--bone);}" +
    ".tpqa__tab.is-on{background:var(--dark);}" +
    ".tpqa__tab.is-on .small-caps{color:var(--olive-bright);}" +
    ".tpqa__tab.is-on .tpqa__tabtitle,.tpqa__tab.is-on .tpqa__tabscore{color:var(--ivory);}" +
    ".tpqa__tabtitle{font-family:var(--serif);font-size:1rem;font-weight:500;line-height:1.3;}" +
    ".tpqa__tabscore{font-family:var(--serif);font-size:1.15rem;color:var(--olive);}" +
    ".tpqa__viewbar{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:28px 0 8px;}" +
    ".tpqa__view{font-size:12px;letter-spacing:.06em;padding:9px 18px;border-radius:999px;box-shadow:inset 0 0 0 1px var(--line);color:var(--ink-soft);transition:all .3s;}" +
    ".tpqa__view.is-on{background:var(--olive);color:var(--ivory);box-shadow:none;}" +
    ".tpqa__hint{font-size:12px;color:var(--ink-faint);}" +
    ".tpqa__intro{color:var(--ink-soft);font-size:14.5px;margin:10px 0 18px;}" +
    ".tpqa__list{border-top:1px solid var(--line);}" +
    ".tpqa__item{padding:22px 0;border-bottom:1px solid var(--line);}" +
    ".tpqa__itemhead{display:flex;align-items:baseline;gap:16px;flex-wrap:wrap;}" +
    ".tpqa__id{font-family:var(--serif);color:var(--olive);font-size:14px;}" +
    ".tpqa__name{font-family:var(--serif);font-weight:500;font-size:1.08rem;flex:1;min-width:220px;}" +
    ".tpqa__stars{white-space:nowrap;}" +
    ".tpqa__star{font-size:18px;color:rgba(35,34,30,.22);padding:0 2px;transition:color .2s,transform .2s;}" +
    ".tpqa__star:hover{transform:scale(1.15);}" +
    ".tpqa__star.is-on{color:var(--olive);}" +
    ".tpqa__body{color:var(--ink-soft);font-size:14px;margin-top:10px;max-width:74ch;}" +
    ".tpqa__total{margin-top:26px;padding:24px 26px;background:var(--sage);}" +
    ".tpqa__totalrow{display:flex;align-items:center;gap:20px;margin-top:10px;}" +
    ".tpqa__totalnum{font-family:var(--serif);font-size:1.6rem;}" +
    ".tpqa__meter{flex:1;height:2px;background:rgba(35,34,30,.15);position:relative;}" +
    ".tpqa__meter i{position:absolute;left:0;top:0;bottom:0;background:var(--olive);transition:width .6s var(--ease);}" +
    ".tpqa__pct{font-size:13px;color:var(--ink-soft);}" +
    ".tpqa__note{font-size:13px;color:var(--ink-soft);margin-top:12px;}";
  document.head.appendChild(css);

  render();
})();
