// CASL backdrop — an elegant engraved labyrinth behind the CASL section header.
// A perfect maze is drawn in fine olive lines on the royal-deep ground, with a
// slow diagonal sheen sweeping across the lines like light catching engraved
// metal. 2D canvas, decorative only (pointer-events: none).
//
// Exposes window.CaslFieldBackdrop, a React component that renders the
// container div (class "tb-casl-section__field", already styled + masked in
// casl-explore.css) and owns the canvas lifecycle. Plain JS (no Babel).
//
//   · Under prefers-reduced-motion the maze is drawn once, no sheen.
//   · The loop pauses entirely while the section is off-screen.

(function () {
  "use strict";

  var OLIVE = "196, 191, 160";   // brand olive-light, as rgb for rgba()
  var BASE_ALPHA = 0.14;          // resting line opacity (subtle)
  var SWEEP_MS = 8200;            // one diagonal sheen pass

  function mountMaze(container) {
    if (!container) return function () {};
    var reduce = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    if (!ctx) return function () {};
    container.appendChild(canvas);

    // Offscreen buffer holding the rendered maze, so each frame is a cheap
    // drawImage + a single composited sheen rectangle.
    var buf = document.createElement("canvas");
    var bctx = buf.getContext("2d");

    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var W = 1, H = 1, cw = 1, ch = 1;
    var start = Date.now();
    var rafId = 0, running = false, disposed = false;

    function buildMaze() {
      W = container.clientWidth || 1;
      H = container.clientHeight || 1;
      cw = Math.max(1, Math.round(W * DPR));
      ch = Math.max(1, Math.round(H * DPR));
      canvas.width = cw; canvas.height = ch;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      buf.width = cw; buf.height = ch;

      // Generous cells read as refined rather than busy; ~30 columns wide.
      var cell = Math.max(30, Math.round(W / 30));
      var cols = Math.ceil(W / cell) + 1;
      var rows = Math.ceil(H / cell) + 1;
      var N = cols * rows;

      // Perfect maze via iterative recursive-backtracker. Each cell keeps its
      // right and bottom wall; carving removes the wall between neighbours.
      var visited = new Uint8Array(N);
      var rightWall = new Uint8Array(N); rightWall.fill(1);
      var bottomWall = new Uint8Array(N); bottomWall.fill(1);
      var stack = [];
      var cur = 0, count = 1;
      visited[0] = 1;
      while (count < N) {
        var c = cur % cols, r = (cur / cols) | 0;
        var nb = [];
        if (c > 0 && !visited[cur - 1]) nb.push([cur - 1, 0]);             // left
        if (c < cols - 1 && !visited[cur + 1]) nb.push([cur + 1, 1]);      // right
        if (r > 0 && !visited[cur - cols]) nb.push([cur - cols, 2]);       // up
        if (r < rows - 1 && !visited[cur + cols]) nb.push([cur + cols, 3]); // down
        if (nb.length) {
          var pick = nb[(Math.random() * nb.length) | 0];
          var nx = pick[0], dir = pick[1];
          if (dir === 1) rightWall[cur] = 0;
          else if (dir === 0) rightWall[nx] = 0;
          else if (dir === 3) bottomWall[cur] = 0;
          else bottomWall[nx] = 0;
          stack.push(cur);
          visited[nx] = 1; count++;
          cur = nx;
        } else if (stack.length) {
          cur = stack.pop();
        } else {
          break;
        }
      }

      // Draw the remaining walls into the offscreen buffer.
      bctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      bctx.clearRect(0, 0, W, H);
      bctx.strokeStyle = "rgba(" + OLIVE + "," + BASE_ALPHA + ")";
      bctx.lineWidth = 1;
      bctx.lineCap = "round";
      bctx.lineJoin = "round";
      bctx.beginPath();
      for (var rr = 0; rr < rows; rr++) {
        for (var ccx = 0; ccx < cols; ccx++) {
          var i = rr * cols + ccx;
          var x = ccx * cell, y = rr * cell;
          if (rightWall[i]) { bctx.moveTo(x + cell, y); bctx.lineTo(x + cell, y + cell); }
          if (bottomWall[i]) { bctx.moveTo(x, y + cell); bctx.lineTo(x + cell, y + cell); }
        }
      }
      // Top and left borders close the figure.
      bctx.moveTo(0, 0); bctx.lineTo(W, 0);
      bctx.moveTo(0, 0); bctx.lineTo(0, H);
      bctx.stroke();
    }

    function frame() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(buf, 0, 0);
      if (!reduce) {
        // A bright diagonal band sweeps across, brightening only the lines
        // (source-atop), like light travelling over an engraving.
        var t = ((Date.now() - start) % SWEEP_MS) / SWEEP_MS;
        var span = cw * 0.45;
        var x0 = -span + (cw + span * 2) * t;
        var grad = ctx.createLinearGradient(x0 - span, 0, x0 + span, ch);
        grad.addColorStop(0.0, "rgba(232, 228, 200, 0)");
        grad.addColorStop(0.5, "rgba(236, 232, 206, 0.5)");
        grad.addColorStop(1.0, "rgba(232, 228, 200, 0)");
        ctx.globalCompositeOperation = "source-atop";
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, cw, ch);
        ctx.globalCompositeOperation = "source-over";
      }
    }

    function tick() {
      if (disposed) return;
      frame();
      rafId = requestAnimationFrame(tick);
    }

    buildMaze();
    frame();

    // Resize — rebuild the maze, then repaint.
    var ro = null;
    function resize() { buildMaze(); frame(); }
    if (window.ResizeObserver) { ro = new ResizeObserver(resize); ro.observe(container); }
    else window.addEventListener("resize", resize);

    // Run only while visible (the sheen has nothing to do off-screen).
    var io = null;
    if (!reduce && window.IntersectionObserver) {
      io = new IntersectionObserver(function (entries) {
        var vis = entries[0] && entries[0].isIntersecting;
        if (vis && !running) { running = true; rafId = requestAnimationFrame(tick); }
        else if (!vis && running) { running = false; cancelAnimationFrame(rafId); }
      }, { threshold: 0.01 });
      io.observe(container);
    } else if (!reduce) {
      running = true;
      rafId = requestAnimationFrame(tick);
    }

    return function dispose() {
      disposed = true;
      running = false;
      cancelAnimationFrame(rafId);
      if (io) io.disconnect();
      if (ro) ro.disconnect(); else window.removeEventListener("resize", resize);
      if (canvas.parentNode === container) container.removeChild(canvas);
    };
  }

  // React wrapper — renders the absolutely-positioned backdrop div and owns the
  // canvas lifecycle.
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
