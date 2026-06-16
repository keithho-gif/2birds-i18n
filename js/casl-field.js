// CASL backdrop — a top-down labyrinth seen from directly overhead. Scattered
// through the maze are faint nodes, one per CASL industry, sized by how many
// skills that industry holds. A glowing orb threads the corridors, finding its
// way from node to node; each node it reaches flares and fades. 2D canvas,
// decorative only.
//
// Exposes window.CaslFieldBackdrop — a React component that renders the masked
// container div (class "tb-casl-section__field", styled in casl-explore.css)
// and owns the canvas lifecycle. Plain JS (no Babel).
//
//   · Under prefers-reduced-motion the maze + nodes render as one still frame.
//   · The render loop pauses entirely while the section is off-screen.

(function () {
  "use strict";

  var OLIVE = "196, 191, 160";   // --olive-light
  var GOLD = "228, 214, 156";    // warm core of the orb / a node's flare
  var WALL_A = 0.13;             // wall line opacity (kept subtle)
  var SPEED = 4.0;               // orb travel, cells / second
  var TRAIL = 24;                // trail sample count

  // The CASL industry "vectors" the orb visits — skill counts drive node size.
  var INDUSTRIES = [
    92, 42, 37, 31, 31, 20, 20, 16, 15, 12,
    11, 11, 7, 6, 5, 5, 4, 2, 2
  ];

  function mountMaze(container) {
    if (!container) return function () {};
    var reduce = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var canvas = document.createElement("canvas");
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    container.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    if (!ctx) return function () {};

    var buf = document.createElement("canvas");
    var bctx = buf.getContext("2d");

    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, cell = 28, cols = 0, rows = 0, N = 0;
    var openR, openB;                 // passages (wall absent) to right / bottom
    var nodes = [];                   // { cell, r, flare }
    var orb = { path: [], seg: 0, t: 0, target: 0 };
    var trail = [];

    // ---- maze generation (recursive backtracker) ------------------------
    function generate() {
      N = cols * rows;
      openR = new Uint8Array(N);
      openB = new Uint8Array(N);
      var visited = new Uint8Array(N);
      var stack = [], cur = 0, count = 1; visited[0] = 1;
      while (count < N) {
        var c = cur % cols, r = (cur / cols) | 0, nb = [];
        if (c > 0 && !visited[cur - 1]) nb.push([cur - 1, 0]);
        if (c < cols - 1 && !visited[cur + 1]) nb.push([cur + 1, 1]);
        if (r > 0 && !visited[cur - cols]) nb.push([cur - cols, 2]);
        if (r < rows - 1 && !visited[cur + cols]) nb.push([cur + cols, 3]);
        if (nb.length) {
          var p = nb[(Math.random() * nb.length) | 0], nx = p[0], dir = p[1];
          if (dir === 1) openR[cur] = 1;
          else if (dir === 0) openR[nx] = 1;
          else if (dir === 3) openB[cur] = 1;
          else openB[nx] = 1;
          stack.push(cur); visited[nx] = 1; count++; cur = nx;
        } else if (stack.length) { cur = stack.pop(); } else break;
      }
    }

    // ---- shortest path between two cells through the passages ------------
    function bfs(a, b) {
      var prev = new Int32Array(N); prev.fill(-2);
      var q = [a], head = 0; prev[a] = -1;
      while (head < q.length) {
        var i = q[head++]; if (i === b) break;
        var c = i % cols, r = (i / cols) | 0;
        if (c < cols - 1 && openR[i] && prev[i + 1] === -2) { prev[i + 1] = i; q.push(i + 1); }
        if (c > 0 && openR[i - 1] && prev[i - 1] === -2) { prev[i - 1] = i; q.push(i - 1); }
        if (r < rows - 1 && openB[i] && prev[i + cols] === -2) { prev[i + cols] = i; q.push(i + cols); }
        if (r > 0 && openB[i - cols] && prev[i - cols] === -2) { prev[i - cols] = i; q.push(i - cols); }
      }
      var path = [], n = b;
      while (n >= 0) { path.push(n); n = prev[n]; }
      path.reverse();
      return path;
    }

    function cx(i) { return ((i % cols) + 0.5) * cell; }
    function cy(i) { return (((i / cols) | 0) + 0.5) * cell; }

    // ---- place one node per industry, spread across the maze ------------
    function placeNodes() {
      nodes = [];
      var minGap = Math.max(2, Math.floor(Math.min(cols, rows) / 6));
      for (var k = 0; k < INDUSTRIES.length; k++) {
        var best = -1;
        for (var tries = 0; tries < 30; tries++) {
          var cand = (Math.random() * N) | 0;
          var cc = cand % cols, cr = (cand / cols) | 0, ok = true;
          for (var j = 0; j < nodes.length; j++) {
            var oc = nodes[j].cell % cols, orr = (nodes[j].cell / cols) | 0;
            if (Math.abs(oc - cc) + Math.abs(orr - cr) < minGap) { ok = false; break; }
          }
          if (ok) { best = cand; break; }
          if (best < 0) best = cand;
        }
        nodes.push({
          cell: best,
          r: 2.2 + Math.log(INDUSTRIES[k] + 1) * 1.7,
          flare: 0
        });
      }
    }

    function nextLeg(from) {
      orb.path = bfs(from, nodes[orb.target].cell);
      orb.seg = 0; orb.t = 0;
    }

    // ---- draw the static maze once into the buffer ----------------------
    function drawMaze() {
      buf.width = Math.max(1, (W * DPR) | 0);
      buf.height = Math.max(1, (H * DPR) | 0);
      bctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      bctx.clearRect(0, 0, W, H);
      bctx.strokeStyle = "rgba(" + OLIVE + "," + WALL_A + ")";
      bctx.lineWidth = 1;
      bctx.lineCap = "round";
      bctx.beginPath();
      for (var i = 0; i < N; i++) {
        var c = i % cols, r = (i / cols) | 0, x = c * cell, y = r * cell;
        if (!openR[i]) { bctx.moveTo(x + cell, y); bctx.lineTo(x + cell, y + cell); }
        if (!openB[i]) { bctx.moveTo(x, y + cell); bctx.lineTo(x + cell, y + cell); }
      }
      bctx.moveTo(0, 0); bctx.lineTo(W, 0);   // top border
      bctx.moveTo(0, 0); bctx.lineTo(0, H);   // left border
      bctx.stroke();
    }

    function build() {
      W = container.clientWidth || 1;
      H = container.clientHeight || 1;
      canvas.width = Math.max(1, (W * DPR) | 0);
      canvas.height = Math.max(1, (H * DPR) | 0);
      cell = Math.max(22, Math.round(W / 44));
      cols = Math.max(6, Math.ceil(W / cell) + 1);
      rows = Math.max(6, Math.ceil(H / cell) + 1);
      generate();
      drawMaze();
      placeNodes();
      trail = [];
      orb.target = 1 % nodes.length;
      nextLeg(nodes[0].cell);
    }

    // ---- node layer (drawn additively over the maze) --------------------
    function drawNodes() {
      for (var k = 0; k < nodes.length; k++) {
        var nd = nodes[k], nx = cx(nd.cell), ny = cy(nd.cell);
        // resting dot
        var bg = ctx.createRadialGradient(nx, ny, 0, nx, ny, nd.r);
        bg.addColorStop(0, "rgba(" + OLIVE + ",0.30)");
        bg.addColorStop(1, "rgba(" + OLIVE + ",0)");
        ctx.fillStyle = bg;
        ctx.beginPath(); ctx.arc(nx, ny, nd.r, 0, 6.2832); ctx.fill();
        // flare after a visit
        if (nd.flare > 0.01) {
          var fr = nd.r * (1.5 + nd.flare * 3.5);
          var fg = ctx.createRadialGradient(nx, ny, 0, nx, ny, fr);
          fg.addColorStop(0, "rgba(" + GOLD + "," + (0.5 * nd.flare) + ")");
          fg.addColorStop(0.5, "rgba(" + OLIVE + "," + (0.18 * nd.flare) + ")");
          fg.addColorStop(1, "rgba(" + OLIVE + ",0)");
          ctx.fillStyle = fg;
          ctx.beginPath(); ctx.arc(nx, ny, fr, 0, 6.2832); ctx.fill();
        }
      }
    }

    // ---- per-frame render -----------------------------------------------
    var last = 0;
    function render(now) {
      var dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;

      // advance the orb along the current leg
      if (orb.path.length > 1) {
        orb.t += dt * SPEED;
        while (orb.t >= 1 && orb.seg < orb.path.length - 2) { orb.t -= 1; orb.seg++; }
        if (orb.seg >= orb.path.length - 2 && orb.t >= 1) {
          var arrived = nodes[orb.target];
          arrived.flare = 1;
          orb.target = (orb.target + 1) % nodes.length;
          nextLeg(arrived.cell);
        }
      }
      var a = orb.path[orb.seg];
      var b = orb.path[Math.min(orb.seg + 1, orb.path.length - 1)];
      var tt = Math.min(orb.t, 1);
      var ox = cx(a) + (cx(b) - cx(a)) * tt;
      var oy = cy(a) + (cy(b) - cy(a)) * tt;

      // decay flares
      for (var k = 0; k < nodes.length; k++) {
        if (nodes[k].flare > 0) nodes[k].flare = Math.max(0, nodes[k].flare - dt * 0.6);
      }

      trail.push(ox, oy);
      if (trail.length > TRAIL * 2) trail.splice(0, trail.length - TRAIL * 2);

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(buf, 0, 0, W, H);

      // everything glowing is drawn additively so it lifts the walls beneath
      ctx.globalCompositeOperation = "lighter";

      drawNodes();

      // trail
      var pts = trail.length / 2;
      for (var p = 0; p < pts; p++) {
        var f = p / pts;
        var txp = trail[p * 2], typ = trail[p * 2 + 1], tr = (2 + f * 3) * 3;
        var tg = ctx.createRadialGradient(txp, typ, 0, txp, typ, tr);
        tg.addColorStop(0, "rgba(" + OLIVE + "," + (0.16 * f) + ")");
        tg.addColorStop(1, "rgba(" + OLIVE + ",0)");
        ctx.fillStyle = tg;
        ctx.beginPath(); ctx.arc(txp, typ, tr, 0, 6.2832); ctx.fill();
      }

      // orb halo
      var halo = cell * 2.6;
      var hg = ctx.createRadialGradient(ox, oy, 0, ox, oy, halo);
      hg.addColorStop(0, "rgba(" + GOLD + ",0.42)");
      hg.addColorStop(0.4, "rgba(" + OLIVE + ",0.16)");
      hg.addColorStop(1, "rgba(" + OLIVE + ",0)");
      ctx.fillStyle = hg;
      ctx.beginPath(); ctx.arc(ox, oy, halo, 0, 6.2832); ctx.fill();

      // orb core
      var core = ctx.createRadialGradient(ox, oy, 0, ox, oy, 5);
      core.addColorStop(0, "rgba(255,250,235,0.95)");
      core.addColorStop(1, "rgba(" + GOLD + ",0)");
      ctx.fillStyle = core;
      ctx.beginPath(); ctx.arc(ox, oy, 5, 0, 6.2832); ctx.fill();

      ctx.globalCompositeOperation = "source-over";
    }

    function renderStill() {
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(buf, 0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      drawNodes();
      ctx.globalCompositeOperation = "source-over";
    }

    // ---- lifecycle ------------------------------------------------------
    var rafId = 0, running = false, disposed = false;
    function tick(now) { if (disposed) return; render(now || 0); rafId = requestAnimationFrame(tick); }

    build();
    if (reduce) renderStill();

    function resize() { last = 0; build(); if (reduce) renderStill(); }
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(resize); ro.observe(container); }
    else window.addEventListener("resize", resize);

    var io = null;
    if (!reduce && window.IntersectionObserver) {
      io = new IntersectionObserver(function (entries) {
        var vis = entries[0] && entries[0].isIntersecting;
        if (vis && !running) { running = true; last = 0; rafId = requestAnimationFrame(tick); }
        else if (!vis && running) { running = false; cancelAnimationFrame(rafId); }
      }, { threshold: 0.01 });
      io.observe(container);
    } else if (!reduce) { running = true; rafId = requestAnimationFrame(tick); }

    return function dispose() {
      disposed = true; running = false; cancelAnimationFrame(rafId);
      if (io) io.disconnect();
      if (ro) ro.disconnect(); else window.removeEventListener("resize", resize);
      if (canvas.parentNode === container) container.removeChild(canvas);
    };
  }

  function CaslFieldBackdrop() {
    var ref = React.useRef(null);
    React.useEffect(function () { return mountMaze(ref.current); }, []);
    return React.createElement("div", {
      className: "tb-casl-section__field",
      "aria-hidden": "true",
      ref: ref,
    });
  }

  window.CaslFieldBackdrop = CaslFieldBackdrop;
})();
