// CASL field backdrop — a slow, undulating landscape of light points behind
// the CASL section header. Three.js, decorative only (pointer-events: none).
//
// Exposes window.CaslFieldBackdrop, a React component that renders the
// container div and manages the WebGL lifecycle. Plain JS (no Babel) —
// uses React.createElement directly.
//
// Behaviour notes:
//   · Colors are the brand's olive-light with a scattering of royal blue,
//     echoing the register's "current / added in update" reading.
//   · Gentle mouse parallax on the camera; no interaction beyond that.
//   · Under prefers-reduced-motion the field renders one still frame.
//   · The loop pauses entirely while the section is off-screen.

(function () {
  "use strict";

  function makeDotTexture(THREE) {
    const c = document.createElement("canvas");
    c.width = 64; c.height = 64;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.8)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  function mountField(container) {
    if (!container || !window.THREE) return function () {};
    const THREE = window.THREE;
    const reduce = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch (e) { return function () {}; }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    const camBase = { x: 0, y: 2.3, z: 7.6 };
    camera.position.set(camBase.x, camBase.y, camBase.z);
    camera.lookAt(0, -0.2, 0);

    // ---- Point field ----
    const COLS = 130, ROWS = 36;
    const W = 26, D = 10;
    const N = COLS * ROWS;
    const basePos = new Float32Array(N * 3);
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const olive = new THREE.Color(0xC4BFA0);
    const blue = new THREE.Color(0x7E9CD0);
    let i = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = (c / (COLS - 1) - 0.5) * W;
        const z = (r / (ROWS - 1) - 0.5) * D;
        basePos[i * 3] = x;
        basePos[i * 3 + 1] = 0;
        basePos[i * 3 + 2] = z;
        const tint = Math.random() < 0.16 ? blue : olive;
        const f = 0.45 + Math.random() * 0.55;
        col[i * 3] = tint.r * f;
        col[i * 3 + 1] = tint.g * f;
        col[i * 3 + 2] = tint.b * f;
        i++;
      }
    }
    pos.set(basePos);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.075,
      map: makeDotTexture(THREE),
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    // ---- Wave ----
    function wave(t) {
      const p = geo.attributes.position.array;
      for (let k = 0; k < N; k++) {
        const x = basePos[k * 3];
        const z = basePos[k * 3 + 2];
        p[k * 3 + 1] =
          0.42 * Math.sin(x * 0.5 + t) * Math.cos(z * 0.75 + t * 0.7) +
          0.18 * Math.sin((x + z) * 0.32 + t * 0.55);
      }
      geo.attributes.position.needsUpdate = true;
    }

    // ---- Sizing ----
    function resize() {
      const r = container.getBoundingClientRect();
      const w = Math.max(1, r.width);
      const h = Math.max(1, r.height);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
    }
    resize();
    let ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(function () { resize(); render(); });
      ro.observe(container);
    } else {
      window.addEventListener("resize", resize);
    }

    // ---- Mouse parallax ----
    const mouse = { x: 0, y: 0 };
    function onMove(e) {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    }
    if (!reduce) window.addEventListener("mousemove", onMove, { passive: true });

    function render() { renderer.render(scene, camera); }

    // ---- Loop, paused while off-screen ----
    let running = false;
    let rafId = 0;
    let disposed = false;
    const t0 = Date.now();
    function tick() {
      if (!running || disposed) return;
      const t = (Date.now() - t0) / 1000;
      wave(t * 0.45);
      points.rotation.y = Math.sin(t * 0.05) * 0.06;
      camera.position.x += (mouse.x * 0.5 - (camera.position.x - camBase.x)) * 0.04;
      camera.position.y += (camBase.y - mouse.y * 0.3 - camera.position.y) * 0.04;
      camera.lookAt(0, -0.2, 0);
      render();
      rafId = requestAnimationFrame(tick);
    }

    // First frame immediately, so something shows even where rAF is throttled.
    wave(1.3);
    render();

    let io = null;
    if (!reduce && window.IntersectionObserver) {
      io = new IntersectionObserver(function (entries) {
        const vis = entries[0] && entries[0].isIntersecting;
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
      window.removeEventListener("mousemove", onMove);
      geo.dispose();
      mat.map && mat.map.dispose();
      mat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }

  // React wrapper — renders the absolutely-positioned backdrop div and
  // owns the WebGL lifecycle.
  function CaslFieldBackdrop() {
    const ref = React.useRef(null);
    React.useEffect(function () { return mountField(ref.current); }, []);
    return React.createElement("div", {
      className: "tb-casl-section__field",
      "aria-hidden": "true",
      ref: ref,
    });
  }

  window.CaslFieldBackdrop = CaslFieldBackdrop;
})();
