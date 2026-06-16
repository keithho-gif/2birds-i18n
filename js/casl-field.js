// CASL backdrop — a 3D flyover of an endless labyrinth behind the CASL section
// header. Extruded olive walls recede into royal-deep fog while the camera
// glides forward forever (the maze is tiled twice and scrolled by one tile, so
// the loop is seamless). Subtle mouse parallax. Three.js, decorative only.
//
// Exposes window.CaslFieldBackdrop — a React component that renders the masked
// container div (class "tb-casl-section__field", styled in casl-explore.css)
// and owns the WebGL lifecycle. Plain JS (no Babel).
//
//   · Under prefers-reduced-motion the scene renders one still frame.
//   · The render loop pauses entirely while the section is off-screen.

(function () {
  "use strict";

  var NAVY = 0x14264A;   // royal-deep, matches the section ground + fog
  var OLIVE = 0xC4BFA0;  // brand olive-light

  // Maze footprint (grid cells) and wall dimensions in world units.
  var COLS = 42, ROWS = 40, CELL = 1.0, WALL_H = 0.5, WALL_T = 0.1;
  var SPEED = 1.5;       // forward glide, world units / second

  function buildWalls() {
    // Perfect maze via iterative recursive-backtracker; returns the list of
    // remaining walls as { x, z, horiz } centres (one tile, z in [0, -depth]).
    var N = COLS * ROWS;
    var visited = new Uint8Array(N);
    var rightWall = new Uint8Array(N); rightWall.fill(1);
    var bottomWall = new Uint8Array(N); bottomWall.fill(1);
    var stack = [], cur = 0, count = 1;
    visited[0] = 1;
    while (count < N) {
      var c = cur % COLS, r = (cur / COLS) | 0, nb = [];
      if (c > 0 && !visited[cur - 1]) nb.push([cur - 1, 0]);
      if (c < COLS - 1 && !visited[cur + 1]) nb.push([cur + 1, 1]);
      if (r > 0 && !visited[cur - COLS]) nb.push([cur - COLS, 2]);
      if (r < ROWS - 1 && !visited[cur + COLS]) nb.push([cur + COLS, 3]);
      if (nb.length) {
        var p = nb[(Math.random() * nb.length) | 0], nx = p[0], dir = p[1];
        if (dir === 1) rightWall[cur] = 0;
        else if (dir === 0) rightWall[nx] = 0;
        else if (dir === 3) bottomWall[cur] = 0;
        else bottomWall[nx] = 0;
        stack.push(cur); visited[nx] = 1; count++; cur = nx;
      } else if (stack.length) { cur = stack.pop(); }
      else break;
    }
    var walls = [];
    var offX = -(COLS * CELL) / 2;
    for (var rr = 0; rr < ROWS; rr++) {
      for (var cc = 0; cc < COLS; cc++) {
        var i = rr * COLS + cc, x = cc * CELL + offX, z = -(rr * CELL);
        if (rightWall[i]) walls.push({ x: x + CELL, z: z - CELL / 2, horiz: false });
        if (bottomWall[i]) walls.push({ x: x + CELL / 2, z: z - CELL, horiz: true });
      }
    }
    // Near (z = 0) and left (x = offX) borders.
    for (var cb = 0; cb < COLS; cb++) walls.push({ x: cb * CELL + offX + CELL / 2, z: 0, horiz: true });
    for (var rb = 0; rb < ROWS; rb++) walls.push({ x: offX, z: -(rb * CELL) - CELL / 2, horiz: false });
    return walls;
  }

  function mountField(container) {
    if (!container || !window.THREE) return function () {};
    var THREE = window.THREE;
    var reduce = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch (e) { return function () {}; }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(NAVY, 8, 38);

    var camera = new THREE.PerspectiveCamera(60, 1, 0.1, 120);
    var camY = 6.0;
    camera.position.set(0, camY, 6);
    camera.lookAt(0, 0.2, -10);

    scene.add(new THREE.AmbientLight(0x8294b8, 0.65));
    var key = new THREE.DirectionalLight(0xfff1cf, 0.95);
    key.position.set(-7, 11, 5);
    scene.add(key);
    var rim = new THREE.DirectionalLight(0x9db4dd, 0.35);
    rim.position.set(6, 4, -8);
    scene.add(rim);

    // ---- Walls as one InstancedMesh, the maze tiled twice along z ----
    var walls = buildWalls();
    var depth = ROWS * CELL;
    var geo = new THREE.BoxGeometry(1, 1, 1);
    var mat = new THREE.MeshStandardMaterial({
      color: OLIVE, roughness: 0.62, metalness: 0.12,
      emissive: 0x39381f, emissiveIntensity: 0.5,
    });
    var inst = new THREE.InstancedMesh(geo, mat, walls.length * 2);
    var m = new THREE.Matrix4(), k = 0;
    for (var tile = 0; tile < 2; tile++) {
      var zoff = -tile * depth;
      for (var w = 0; w < walls.length; w++) {
        var ww = walls[w];
        var sx = ww.horiz ? CELL : WALL_T;
        var sz = ww.horiz ? WALL_T : CELL;
        m.makeScale(sx, WALL_H, sz);
        m.setPosition(ww.x, WALL_H / 2, ww.z + zoff);
        inst.setMatrixAt(k++, m);
      }
    }
    inst.instanceMatrix.needsUpdate = true;
    scene.add(inst);

    // ---- Pointer parallax ----
    var mx = 0, my = 0;
    function onMove(e) {
      mx = (e.clientX / window.innerWidth - 0.5);
      my = (e.clientY / window.innerHeight - 0.5);
    }
    window.addEventListener("mousemove", onMove);

    function resize() {
      var w = container.clientWidth || 1, h = container.clientHeight || 1;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = w + "px";
      renderer.domElement.style.height = h + "px";
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();

    var start = Date.now(), rafId = 0, running = false, disposed = false;
    function render() {
      var t = (Date.now() - start) / 1000;
      inst.position.z = (t * SPEED) % depth;             // seamless scroll
      camera.position.x = mx * 1.2;
      camera.position.y = camY + Math.sin(t * 0.28) * 0.18 - my * 0.5;
      camera.lookAt(mx * 0.6, 0.2, -10);
      renderer.render(scene, camera);
    }
    function tick() {
      if (disposed) return;
      render();
      rafId = requestAnimationFrame(tick);
    }
    render();

    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(resize); ro.observe(container); }
    else window.addEventListener("resize", resize);

    var io = null;
    if (!reduce && window.IntersectionObserver) {
      io = new IntersectionObserver(function (entries) {
        var vis = entries[0] && entries[0].isIntersecting;
        if (vis && !running) { running = true; rafId = requestAnimationFrame(tick); }
        else if (!vis && running) { running = false; cancelAnimationFrame(rafId); }
      }, { threshold: 0.01 });
      io.observe(container);
    } else if (!reduce) {
      running = true; rafId = requestAnimationFrame(tick);
    }

    return function dispose() {
      disposed = true; running = false;
      cancelAnimationFrame(rafId);
      if (io) io.disconnect();
      if (ro) ro.disconnect(); else window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      geo.dispose(); mat.dispose(); renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }

  function CaslFieldBackdrop() {
    var ref = React.useRef(null);
    React.useEffect(function () { return mountField(ref.current); }, []);
    return React.createElement("div", {
      className: "tb-casl-section__field",
      "aria-hidden": "true",
      ref: ref,
    });
  }

  window.CaslFieldBackdrop = CaslFieldBackdrop;
})();
