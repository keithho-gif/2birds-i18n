/* 2birds — VARK learning-style finder (vanilla port) */
(function () {
  "use strict";

  var QUESTIONS = [
    { q: "Getting to grips with a new tool, you would rather…", o: [["V", "Watch a quick demo or see it diagrammed."], ["A", "Have someone talk you through it."], ["R", "Read the written guide, step by step."], ["K", "Jump in and learn by doing."]] },
    { q: "You find a new place most easily with…", o: [["V", "A map, or the look of the route."], ["A", "Spoken directions you can follow."], ["R", "Written, street-by-street notes."], ["K", "A practice run to feel the way."]] },
    { q: "A new idea really lands once you…", o: [["V", "See it sketched or charted."], ["A", "Talk it through with someone."], ["R", "Read it carefully explained."], ["K", "Work through a real example."]] },
    { q: "Given a free afternoon to learn something, you…", o: [["V", "Watch videos and visual guides."], ["A", "Listen to a talk or a podcast."], ["R", "Read articles and take notes."], ["K", "Build or try the thing itself."]] },
    { q: "You tend to remember someone new by…", o: [["V", "Their face and how they looked."], ["A", "Their name and their voice."], ["R", "A note or a card you kept."], ["K", "What you did together."]] },
    { q: "Assembling something new, you reach first for…", o: [["V", "The picture or the diagram."], ["A", "A call to someone who has done it."], ["R", "The written instructions."], ["K", "The parts, to work it out by hand."]] },
    { q: "Explaining a route to a friend, you would…", o: [["V", "Draw them a small map."], ["A", "Tell them, turn by turn."], ["R", "Write the directions down."], ["K", "Walk the first part with them."]] },
    { q: "A lesson stays with you when it is…", o: [["V", "Rich with images and diagrams."], ["A", "Full of discussion and the spoken word."], ["R", "Built on good readings and notes."], ["K", "Hands-on, with things to try."]] },
    { q: "Stuck on a problem, you make headway by…", o: [["V", "Sketching it out where you can see it."], ["A", "Thinking aloud, or asking someone."], ["R", "Listing the steps in writing."], ["K", "Trying things until one works."]] },
    { q: "The instructions you trust most come as…", o: [["V", "Diagrams and labelled pictures."], ["A", "A person explaining as they go."], ["R", "A clear written manual."], ["K", "A worked example to copy."]] },
    { q: "After a good talk or class, you keep…", o: [["V", "The slides and the images."], ["A", "The conversation in your head."], ["R", "The notes you wrote."], ["K", "The exercise you actually did."]] },
    { q: "Choosing how to present an idea, you would…", o: [["V", "Build a chart or a visual."], ["A", "Talk it through with the room."], ["R", "Write a clear handout."], ["K", "Run a live demonstration."]] },
    { q: "Reading a recipe for the first time, you…", o: [["V", "Look for photos of each step."], ["A", "Would rather be talked through it."], ["R", "Follow the written method closely."], ["K", "Start cooking and adjust as you go."]] },
    { q: "To learn a new song, you…", o: [["V", "Watch how it is played."], ["A", "Listen to it over and over."], ["R", "Read the lyrics or the notation."], ["K", "Pick up the instrument and try."]] },
    { q: "In a museum, you get the most from…", o: [["V", "The objects and the displays."], ["A", "The audio guide or a docent."], ["R", "The labels and the wall text."], ["K", "The interactive, hands-on exhibits."]] },
    { q: "Preparing for a test, you rely on…", o: [["V", "Mind maps and colour-coded notes."], ["A", "Reciting aloud or study groups."], ["R", "Re-reading and rewriting notes."], ["K", "Practice papers and worked drills."]] },
    { q: "Someone explains a process. You wish they would…", o: [["V", "Draw it on a whiteboard."], ["A", "Keep talking; you are following."], ["R", "Send it to you in writing."], ["K", "Show you on the real thing."]] },
    { q: "Your ideal set of directions has…", o: [["V", "A clear map with landmarks."], ["A", "A friend on the phone guiding you."], ["R", "Written turn-by-turn steps."], ["K", "A trial run you have done before."]] },
    { q: "Learning new software at work, you prefer…", o: [["V", "Screenshots and short clips."], ["A", "A colleague walking you through it."], ["R", "The written guide."], ["K", "Clicking around to figure it out."]] },
    { q: "A concept finally clicks when you can…", o: [["V", "Picture it clearly in your mind."], ["A", "Explain it to someone out loud."], ["R", "Write a clean summary of it."], ["K", "Put it to use on a real task."]] },
    { q: "If you skip the manual, it is because…", o: [["V", "You would rather see a diagram."], ["A", "You would rather ask a person."], ["R", "Actually, you do read manuals."], ["K", "You would rather just try it."]] },
    { q: "Your notes tend to be…", o: [["V", "Diagrams, arrows and sketches."], ["A", "Sparse; you recall the talk."], ["R", "Full sentences, neatly kept."], ["K", "Scribbled while you did the task."]] },
    { q: "To hold on to a phone number, you…", o: [["V", "Picture the shape of the digits."], ["A", "Say it aloud a few times."], ["R", "Write it down."], ["K", "Tap it out on a keypad."]] },
    { q: "The best workshop you ever attended was…", o: [["V", "Beautifully illustrated throughout."], ["A", "Rich in talk and live questions."], ["R", "Backed by an excellent handout."], ["K", "Mostly hands-on practice."]] },
    { q: "You grasp a chart or a set of figures best when…", o: [["V", "It is plotted as a clear graph."], ["A", "Someone walks you through the trend."], ["R", "The numbers sit in a tidy table."], ["K", "You can sort and play with it yourself."]] }
  ];

  var INFO = {
    V: { name: "Visual", tag: "You learn by seeing",
      blurb: "Diagrams, charts and the shape of an idea on a page tell you more than paragraphs do. You think in pictures, and you remember what you can see.",
      teach: "So we lead with diagrams, flow and clear layout, and let the structure of a course be visible at a glance." },
    A: { name: "Aural", tag: "You learn by hearing",
      blurb: "You make sense of things by hearing them and talking them over. A good explanation aloud, a question answered, and the idea settles.",
      teach: "So we build in narration, discussion and spoken walk-throughs, so the material can be heard as readily as it is read." },
    R: { name: "Read / write", tag: "You learn through words",
      blurb: "Words are your medium. You would rather read it clearly put, then write it back in your own. Notes are how you make a thing yours.",
      teach: "So we write courseware in plain, well-ordered prose, with notes, summaries and definitions that reward a careful reader." },
    K: { name: "Kinaesthetic", tag: "You learn by doing",
      blurb: "You learn with your hands and through experience. Give you a real example to work, a thing to try, and the lesson becomes yours.",
      teach: "So we build practice, worked examples and hands-on tasks into the course, so the learning happens by doing." }
  };

  var MODE_DESC = {
    V: "Seeing. Pictures, diagrams and the shape of an idea.",
    A: "Hearing. Talking it over and explaining aloud.",
    R: "Words. Text, lists, and notes in your own hand.",
    K: "Doing. Practice, real examples and hands-on tasks."
  };

  var host = document.getElementById("tb-vark");
  if (!host) return;

  var idx = 0;
  var answers = [];

  function renderQuestion() {
    var q = QUESTIONS[idx];
    host.innerHTML =
      '<div class="vark__progress"><span>Question ' + (idx + 1) + " of " + QUESTIONS.length + "</span>" +
      '<span class="vark__bar"><i style="width:' + Math.round((idx / QUESTIONS.length) * 100) + '%"></i></span></div>' +
      '<h3 class="vark__q">' + q.q + "</h3>" +
      '<div class="vark__opts">' +
      q.o.map(function (opt, i) {
        return '<button class="vark__opt" data-mode="' + opt[0] + '"><span class="vark__optkey">' + "VARK"[i] + "</span>" + opt[1] + "</button>";
      }).join("") +
      "</div>" +
      (idx > 0 ? '<button class="vark__back">← Previous question</button>' : "");

    host.querySelectorAll(".vark__opt").forEach(function (b) {
      b.addEventListener("click", function () {
        answers[idx] = b.dataset.mode;
        idx++;
        if (idx >= QUESTIONS.length) renderResult();
        else renderQuestion();
      });
    });
    var back = host.querySelector(".vark__back");
    if (back) back.addEventListener("click", function () { idx--; renderQuestion(); });
  }

  function renderResult() {
    var score = { V: 0, A: 0, R: 0, K: 0 };
    answers.forEach(function (m) { score[m]++; });
    var order = Object.keys(score).sort(function (a, b) { return score[b] - score[a]; });
    var top = order[0];
    var info = INFO[top];
    var multi = order.filter(function (k) { return score[k] === score[top]; });

    host.innerHTML =
      '<div class="vark__result">' +
      '<span class="eyebrow">Your result</span>' +
      '<h3 class="vark__rname">' + (multi.length > 1 ? "Multimodal, led by " + info.name : info.name) + "</h3>" +
      '<p class="vark__rtag">' + info.tag + "</p>" +
      '<p class="vark__rblurb">' + info.blurb + "</p>" +
      '<p class="vark__rteach">' + info.teach + "</p>" +
      '<div class="vark__bars">' +
      ["V", "A", "R", "K"].map(function (k) {
        var pct = Math.round((score[k] / QUESTIONS.length) * 100);
        return '<div class="vark__row">' +
          '<span class="vark__rowname">' + INFO[k].name + "</span>" +
          '<span class="vark__rowbar"><i style="width:' + pct + '%"></i></span>' +
          '<span class="vark__rowpct">' + score[k] + "</span>" +
          '<span class="vark__rowdesc">' + MODE_DESC[k] + "</span>" +
          "</div>";
      }).join("") +
      "</div>" +
      '<button class="btn btn--ghost vark__again">Take it again</button>' +
      "</div>";
    host.querySelector(".vark__again").addEventListener("click", function () {
      idx = 0; answers = []; renderQuestion();
      host.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  var css = document.createElement("style");
  css.textContent =
    "#tb-vark{--royal:#16255C;background:var(--ivory);border:1px solid var(--line);padding:clamp(26px,4vw,52px);}" +
    ".vark__progress{display:flex;align-items:center;gap:20px;font-size:10px;font-weight:500;letter-spacing:.24em;text-transform:uppercase;color:var(--ink-faint);}" +
    ".vark__progress span:first-child{white-space:nowrap;color:var(--royal);}" +
    ".vark__bar{flex:1;height:4px;border-radius:4px;background:var(--line);position:relative;overflow:hidden;}" +
    ".vark__bar i{position:absolute;left:0;top:0;bottom:0;border-radius:4px;background:var(--royal);transition:width .45s var(--ease);}" +
    ".vark__q{font-family:var(--serif);font-weight:500;font-size:clamp(1.5rem,2.8vw,2.15rem);line-height:1.22;margin:30px 0 30px;max-width:24ch;}" +
    ".vark__opts{display:grid;gap:12px;}" +
    ".vark__opt{display:flex;align-items:center;gap:18px;text-align:left;padding:17px 22px;border:1px solid var(--line);font-size:15px;color:var(--ink-soft);background:#fff;transition:border-color .3s,background .3s,color .3s;}" +
    ".vark__opt:hover,.vark__opt:focus-visible{border-color:var(--royal);background:rgba(22,37,92,.04);color:var(--ink);outline:none;}" +
    ".vark__optkey{flex:none;width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:50%;font-family:var(--serif);color:var(--royal);font-size:13px;transition:all .3s;}" +
    ".vark__opt:hover .vark__optkey,.vark__opt:focus-visible .vark__optkey{background:var(--royal);border-color:var(--royal);color:#fff;}" +
    ".vark__opt::after{content:'\\2192';margin-left:auto;color:var(--royal);opacity:0;transform:translateX(-6px);transition:opacity .3s,transform .3s;}" +
    ".vark__opt:hover::after,.vark__opt:focus-visible::after{opacity:1;transform:none;}" +
    ".vark__back{margin-top:24px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-faint);transition:color .3s;}" +
    ".vark__back:hover{color:var(--royal);}" +
    ".vark__result .eyebrow{color:var(--royal);}" +
    ".vark__rname{font-family:var(--serif);font-weight:500;font-size:clamp(1.9rem,3.6vw,3rem);margin-top:14px;}" +
    ".vark__rtag{font-size:10px;font-weight:500;letter-spacing:.24em;text-transform:uppercase;color:var(--royal);margin-top:8px;}" +
    ".vark__rblurb{color:var(--ink-soft);max-width:56ch;margin-top:20px;}" +
    ".vark__rteach{color:var(--ink);max-width:56ch;margin-top:14px;font-style:italic;font-family:var(--serif);font-size:1.1rem;line-height:1.5;}" +
    ".vark__bars{margin:36px 0 30px;display:grid;gap:16px;}" +
    ".vark__row{display:grid;grid-template-columns:112px 1fr 34px;gap:16px;align-items:center;font-size:13px;}" +
    ".vark__rowname{color:var(--ink);letter-spacing:.02em;}" +
    ".vark__rowbar{height:4px;border-radius:4px;background:var(--line);position:relative;overflow:hidden;}" +
    ".vark__rowbar i{position:absolute;left:0;top:0;bottom:0;border-radius:4px;background:var(--royal);transition:width 1.2s var(--ease);}" +
    ".vark__rowpct{color:var(--royal);text-align:right;font-family:var(--serif);font-size:15px;}" +
    ".vark__rowdesc{grid-column:1/-1;font-size:12px;color:var(--ink-faint);margin-top:-8px;}";
  document.head.appendChild(css);

  renderQuestion();
})();
