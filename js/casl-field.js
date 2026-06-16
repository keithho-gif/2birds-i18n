// CASL backdrop — an overhead labyrinth rendered in 3D. The maze floor is a
// wireframe seen from above and slightly tilted, so it has real depth. One
// luminous "vector" stands up out of the maze for each CASL industry: its
// height and glow scale with how many skills that industry holds, and the
// tips are wired into a faint constellation. A glowing orb threads the
// corridors, finding its way from vector to vector and flaring each as it
// arrives. A starfield drifts behind for layered depth. Three.js, decorative.
//
// Exposes window.CaslFieldBackdrop — a React component that renders the masked
// container div (class "tb-casl-section__field", styled in casl-explore.css)
// and owns the WebGL lifecycle. Plain JS (no Babel).
//
//   · Under prefers-reduced-motion the scene renders one still frame.
//   · The render loop pauses entirely while the section is off-screen.

(function () {
  "use strict";

  var NAVY = 0x14264A;     // royal-deep, matches the section + fog
  var OLIVE = 0xC4BFA0;    // brand olive-light
  var GOLD = 0xEDE0B0;     // warm glow
  var COLS = 32, ROWS = 18, CELL = 1.0;
  var SPEED = 5.0;         // orb travel, cells / second

  // CASL industry "vectors" — skill counts drive each vector's height + glow.
  var INDUSTRIES = [92, 42, 37, 31, 31, 20, 20, 16, 15, 12, 11, 11, 7, 6, 5, 5, 4, 2, 2];

  function genMaze() {
    var N = COLS * ROWS;
    var openR = new Uint8Array(N), openB = new Uint8Array(N);
    var visited = new Uint8Array(N);
    var stack = [], cur = 0, count = 1; visited[0] = 1;
    while (count < N) {
      var c = cur % COLS, r = (cur / COLS) | 0, nb = [];
      if (c > 0 && !visited[cur - 1]) nb.push([cur - 1, 0]);
      if (c < COLS - 1 && !visited[cur + 1]) nb.push([cur + 1, 1]);
      if (r > 0 && !visited[cur - COLS]) nb.push([cur - COLS, 2]);
      if (r < ROWS - 1 && !visited[cur + COLS]) nb.push([cur + COLS, 3]);
      if (nb.length) {
        var p = nb[(Math.random() * nb.length) | 0], nx = p[0], dir = p[1];
        if (dir === 1) openR[cur] = 1; else if (dir === 0) openR[nx] = 1;
        else if (dir === 3) openB[cur] = 1; else openB[nx] = 1;
        stack.push(cur); visited[nx] = 1; count++; cur = nx;
      } else if (stack.length) { cur = stack.pop(); } else break;
    }
    return { openR: openR, openB: openB };
  }

  function makeBfs(openR, openB) {
    var N = COLS * ROWS;
    return function (a, b) {
      var prev = new Int32Array(N); prev.fill(-2);
      var q = [a], head = 0; prev[a] = -1;
      while (head < q.length) {
        var i = q[head++]; if (i === b) break;
        var c = i % COLS, r = (i / COLS) | 0;
        if (c < COLS - 1 && openR[i] && prev[i + 1] === -2) { prev[i + 1] = i; q.push(i + 1); }
        if (c > 0 && openR[i - 1] && prev[i - 1] === -2) { prev[i - 1] = i; q.push(i - 1); }
        if (r < ROWS - 1 && openB[i] && prev[i + COLS] === -2) { prev[i + COLS] = i; q.push(i + COLS); }
        if (r > 0 && openB[i - COLS] && prev[i - COLS] === -2) { prev[i - COLS] = i; q.push(i - COLS); }
      }
      var path = [], n = b; while (n >= 0) { path.push(n); n = prev[n]; } path.reverse(); return path;
    };
  }

  function glowTexture(THREE) {
    var cv = document.createElement("canvas"); cv.width = cv.height = 64;
    var g = cv.getContext("2d");
    var grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.2, "rgba(255,252,240,0.9)");
    grd.addColorStop(0.55, "rgba(255,250,235,0.35)");
    grd.addColorStop(1, "rgba(255,250,235,0)");
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(cv);
  }

  function mountField(container) {
    if (!container || !window.THREE) return function () {};
    var THREE = window.THREE;
    var reduce = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var renderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); }
    catch (e) { return function () {}; }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(NAVY, 20, 52);
    var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
    camera.position.set(0, 24, 12);     // high + tilted = overhead with depth
    camera.lookAt(0, 0, 0);

    var group = new THREE.Group(); scene.add(group);
    var offX = -(COLS * CELL) / 2, offZ = -(ROWS * CELL) / 2;
    function wx(c) { return offX + (c + 0.5) * CELL; }
    function wz(r) { return offZ + (r + 0.5) * CELL; }

    // ---- maze floor (wireframe) ----
    var maze = genMaze(), openR = maze.openR, openB = maze.openB;
    var bfs = makeBfs(openR, openB);
    var N = COLS * ROWS, verts = [];
    for (var i = 0; i < N; i++) {
      var c = i % COLS, r = (i / COLS) | 0;
      var x0 = offX + c * CELL, z0 = offZ + r * CELL, x1 = x0 + CELL, z1 = z0 + CELL;
      if (!openR[i]) verts.push(x1, 0, z0, x1, 0, z1);
      if (!openB[i]) verts.push(x0, 0, z1, x1, 0, z1);
    }
    verts.push(offX, 0, offZ, offX + COLS * CELL, 0, offZ);          // top border
    verts.push(offX, 0, offZ, offX, 0, offZ + ROWS * CELL);          // left border
    var mazeGeo = new THREE.BufferGeometry();
    mazeGeo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    group.add(new THREE.LineSegments(mazeGeo,
      new THREE.LineBasicMaterial({ color: OLIVE, transparent: true, opacity: 0.22 })));

    // ---- industry vectors (standing glow pillars) ----
    var glow = glowTexture(THREE);
    var nodes = [], minGap = 4;
    for (var k = 0; k < INDUSTRIES.length; k++) {
      var cell = -1, best = -1;
      for (var tr = 0; tr < 40; tr++) {
        var cand = (Math.random() * N) | 0, cc = cand % COLS, cr = (cand / COLS) | 0, ok = true;
        for (var j = 0; j < nodes.length; j++) {
          var oc = nodes[j].cell % COLS, orr = (nodes[j].cell / COLS) | 0;
          if (Math.abs(oc - cc) + Math.abs(orr - cr) < minGap) { ok = false; break; }
        }
        if (ok) { cell = cand; break; }
        if (best < 0) best = cand;
      }
      if (cell < 0) cell = best;
      var cnt = INDUSTRIES[k];
      var h = 0.7 + Math.log(cnt + 1) * 0.55;
      var x = wx(cell % COLS), z = wz((cell / COLS) | 0);
      var pv = new THREE.BufferGeometry();
      pv.setAttribute("position", new THREE.Float32BufferAttribute([x, 0, z, x, h, z], 3));
      group.add(new THREE.Line(pv,
        new THREE.LineBasicMaterial({ color: OLIVE, transparent: true, opacity: 0.4 })));
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glow, color: GOLD, transparent: true, opacity: 0.85,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
      var s = 0.5 + Math.log(cnt + 1) * 0.28;
      sp.scale.set(s, s, 1); sp.position.set(x, h, z);
      group.add(sp);
      nodes.push({ cell: cell, x: x, z: z, baseH: h, pillar: pv, sprite: sp, base: s, pop: 0, phase: Math.random() * 6.28 });
    }

    // ---- constellation between nearby vector tips ----
    var netV = [];
    for (var a2 = 0; a2 < nodes.length; a2++) {
      var d = [];
      for (var b2 = 0; b2 < nodes.length; b2++) {
        if (b2 === a2) continue;
        var dx = nodes[a2].x - nodes[b2].x, dz = nodes[a2].z - nodes[b2].z;
        d.push([dx * dx + dz * dz, b2]);
      }
      d.sort(function (p, q) { return p[0] - q[0]; });
      for (var nn = 0; nn < 2 && nn < d.length; nn++) {
        if (d[nn][1] > a2) {
          var nb2 = nodes[d[nn][1]];
          netV.push(nodes[a2].x, nodes[a2].baseH, nodes[a2].z, nb2.x, nb2.baseH, nb2.z);
        }
      }
    }
    if (netV.length) {
      var ng = new THREE.BufferGeometry();
      ng.setAttribute("position", new THREE.Float32BufferAttribute(netV, 3));
      group.add(new THREE.LineSegments(ng,
        new THREE.LineBasicMaterial({ color: OLIVE, transparent: true, opacity: 0.1 })));
    }

    // ---- starfield (depth layer) ----
    var SN = 200, star = new Float32Array(SN * 3);
    for (var s2 = 0; s2 < SN; s2++) {
      star[s2 * 3] = (Math.random() - 0.5) * 90;
      star[s2 * 3 + 1] = 2 + Math.random() * 22;
      star[s2 * 3 + 2] = -30 + Math.random() * 50;
    }
    var starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.Float32BufferAttribute(star, 3));
    var stars = new THREE.Points(starGeo,
      new THREE.PointsMaterial({ color: OLIVE, size: 0.12, transparent: true, opacity: 0.5 }));
    scene.add(stars);

    // ---- orb + trail ----
    var orb = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glow, color: 0xFFFFFF, transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    orb.scale.set(1.4, 1.4, 1); group.add(orb);
    var TN = 22, trailPos = new Float32Array(TN * 3);
    var trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute("position", new THREE.Float32BufferAttribute(trailPos, 3));
    group.add(new THREE.Line(trailGeo, new THREE.LineBasicMaterial({
      color: GOLD, transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false
    })));
    var history = [];

    var path = [], pseg = 0, pt = 0, target = 1 % nodes.length;
    function nextLeg(from) { path = bfs(from, nodes[target].cell); pseg = 0; pt = 0; }
    nextLeg(nodes[0].cell);

    // ---- pointer parallax ----
    var mx = 0, my = 0;
    function onMove(e) { mx = (e.clientX / window.innerWidth - 0.5); my = (e.clientY / window.innerHeight - 0.5); }
    window.addEventListener("mousemove", onMove);

    var camBaseY = 24, camBaseZ = 12;
    function resize() {
      var w = container.clientWidth || 1, h = container.clientHeight || 1;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = w + "px";
      renderer.domElement.style.height = h + "px";
      camera.aspect = w / h; camera.updateProjectionMatrix();
      // pull the camera back on narrow / portrait screens so the wide maze fits
      var fit = camera.aspect < 1.5 ? (1 + (1.5 - camera.aspect) * 0.9) : 1;
      camBaseY = 24 * fit; camBaseZ = 12 * fit;
      camera.position.set(mx * 3, camBaseY, camBaseZ);
      camera.lookAt(0, 0, 0);
    }
    resize();

    var last = 0, rafId = 0, running = false, disposed = false, tsec = 0;
    function frame(now) {
      var dt = last ? Math.min((now - last) / 1000, 0.05) : 0; last = now; tsec += dt;

      if (path.length > 1) {
        pt += dt * SPEED;
        while (pt >= 1 && pseg < path.length - 2) { pt -= 1; pseg++; }
        if (pseg >= path.length - 2 && pt >= 1) {
          nodes[target].pop = 1;
          var arr = nodes[target].cell;
          target = (target + 1) % nodes.length;
          nextLeg(arr);
        }
      }
      var a = path[pseg], b = path[Math.min(pseg + 1, path.length - 1)];
      var ax = wx(a % COLS), az = wz((a / COLS) | 0);
      var bx = wx(b % COLS), bz = wz((b / COLS) | 0);
      var tt = Math.min(pt, 1);
      var ox = ax + (bx - ax) * tt, oz = az + (bz - az) * tt;
      orb.position.set(ox, 0.2, oz);

      history.push(ox, oz);
      if (history.length > TN * 2) history.splice(0, history.length - TN * 2);
      var cnt = history.length / 2;
      for (var p3 = 0; p3 < TN; p3++) {
        var idx = p3 < cnt ? p3 : cnt - 1;
        trailPos[p3 * 3] = history[idx * 2];
        trailPos[p3 * 3 + 1] = 0.17;
        trailPos[p3 * 3 + 2] = history[idx * 2 + 1];
      }
      trailGeo.attributes.position.needsUpdate = true;
      trailGeo.setDrawRange(0, Math.max(2, cnt));

      for (var k2 = 0; k2 < nodes.length; k2++) {
        var nd = nodes[k2];
        if (nd.pop > 0) nd.pop = Math.max(0, nd.pop - dt * 1.1);
        var popH = Math.sin(nd.pop * Math.PI / 2);          // 1 at the hit, eases to 0
        var curH = nd.baseH * (1 + popH * 1.15);            // pole springs up, then settles
        var pa = nd.pillar.attributes.position.array;
        pa[4] = curH; nd.pillar.attributes.position.needsUpdate = true;
        var pulse = 1 + Math.sin(tsec * 1.4 + nd.phase) * 0.12;
        var sc = nd.base * pulse * (1 + popH * 1.7);
        nd.sprite.scale.set(sc, sc, 1);
        nd.sprite.position.y = curH;
        nd.sprite.material.opacity = 0.7 + popH * 0.3;
      }

      stars.rotation.y = tsec * 0.01;
      group.rotation.y = mx * 0.15;
      camera.position.x = mx * 3;
      camera.position.y = camBaseY - my * 2;
      camera.position.z = camBaseZ;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    }
    function tick(now) { if (disposed) return; frame(now || 0); rafId = requestAnimationFrame(tick); }
    frame(0);

    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(resize); ro.observe(container); }
    else window.addEventListener("resize", resize);

    var io = null;
    if (!reduce && window.IntersectionObserver) {
      io = new IntersectionObserver(function (en) {
        var vis = en[0] && en[0].isIntersecting;
        if (vis && !running) { running = true; last = 0; rafId = requestAnimationFrame(tick); }
        else if (!vis && running) { running = false; cancelAnimationFrame(rafId); }
      }, { threshold: 0.01 });
      io.observe(container);
    } else if (!reduce) { running = true; rafId = requestAnimationFrame(tick); }

    return function dispose() {
      disposed = true; running = false; cancelAnimationFrame(rafId);
      if (io) io.disconnect();
      if (ro) ro.disconnect(); else window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
    };
  }

  function CaslFieldBackdrop() {
    var ref = React.useRef(null);
    React.useEffect(function () { return mountField(ref.current); }, []);
    return React.createElement("div", {
      className: "tb-casl-section__field", "aria-hidden": "true", ref: ref
    });
  }
  window.CaslFieldBackdrop = CaslFieldBackdrop;
})();
