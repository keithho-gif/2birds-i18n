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

  // CASL industry "vectors" — skill counts drive each vector's height + glow;
  // each carries the same line glyph the dashboard uses (IND_GLYPHS), shown
  // floating above the pole the moment the orb reaches it.
  var INDUSTRIES = [
    { name: "Cross-Industry", count: 92 },
    { name: "Healthcare", count: 42 },
    { name: "Manufacturing", count: 37 },
    { name: "Financial Services", count: 31 },
    { name: "Media, Design & Creative", count: 31 },
    { name: "Infocomm Technology", count: 20 },
    { name: "Legal & Compliance", count: 20 },
    { name: "Leadership & Management", count: 16 },
    { name: "Built Environment", count: 15 },
    { name: "Marine & Offshore", count: 12 },
    { name: "Human Resource", count: 11 },
    { name: "Logistics & Supply Chain", count: 11 },
    { name: "Wholesale Trade", count: 7 },
    { name: "Training & Adult Education", count: 6 },
    { name: "Energy & Power", count: 5 },
    { name: "Food Services & Hospitality", count: 5 },
    { name: "Security & Defence", count: 4 },
    { name: "Aerospace", count: 2 },
    { name: "Biopharma & Life Sciences", count: 2 }
  ];

  // Inner SVG markup for each glyph (24px grid, stroked), mirrored from the
  // dashboard's IND_GLYPHS so the two stay visually identical.
  var ICONS = {
    "Cross-Industry": '<circle cx="9" cy="9.5" r="4.5"/><circle cx="15" cy="14.5" r="4.5"/>',
    "Healthcare": '<circle cx="12" cy="12" r="8"/><path d="M12 8.5v7M8.5 12h7"/>',
    "Manufacturing": '<circle cx="12" cy="12" r="3.2"/><path d="M12 4.5v2.3M12 17.2v2.3M4.5 12h2.3M17.2 12h2.3M6.7 6.7l1.6 1.6M15.7 15.7l1.6 1.6M17.3 6.7l-1.6 1.6M8.3 15.7l-1.6 1.6"/>',
    "Financial Services": '<path d="M4 19h16M6 19v-6M10.5 19V9M15 19v-8.5M19.5 19V6"/><path d="M5 8.5L11 5l4 3 4.5-3.5" opacity="0.6"/>',
    "Media, Design & Creative": '<path d="M14.5 4.5l5 5L9 20H4v-5z"/><path d="M12 7l5 5M4 20l4.5-1"/>',
    "Infocomm Technology": '<rect x="5" y="5" width="14" height="14" rx="1"/><path d="M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2"/><rect x="9.5" y="9.5" width="5" height="5"/>',
    "Legal & Compliance": '<path d="M12 4v15M8.5 19h7M12 6.5l-5.5 1M12 6.5l5.5 1M6.5 7.5L4 13a2.6 2.6 0 0 0 5 0zM17.5 7.5L15 13a2.6 2.6 0 0 0 5 0z"/>',
    "Leadership & Management": '<path d="M7 21V4M7 4h11l-2.5 3.5L18 11H7"/>',
    "Built Environment": '<path d="M4 20h16M6 20V8l5-3v15M11 20V9h7v11"/><path d="M14 12h1.5M14 15h1.5M8 9h1M8 12h1M8 15h1" opacity="0.7"/>',
    "Marine & Offshore": '<circle cx="12" cy="5.8" r="2"/><path d="M12 7.8V19M12 19c-3.8 0-6.8-2.4-7.5-5.5L7 14M12 19c3.8 0 6.8-2.4 7.5-5.5L17 14M8.5 10.5h7"/>',
    "Human Resource": '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c.5-3.4 2.8-5.2 5.5-5.2s5 1.8 5.5 5.2"/><circle cx="16.5" cy="9.5" r="2.4"/><path d="M16 13.8c2.4.1 4.1 1.7 4.6 4.6"/>',
    "Logistics & Supply Chain": '<path d="M4 8.5l8-4 8 4v7l-8 4-8-4z"/><path d="M4 8.5l8 4 8-4M12 12.5v7"/>',
    "Wholesale Trade": '<rect x="4" y="12" width="7" height="7"/><rect x="13" y="12" width="7" height="7"/><rect x="8.5" y="5" width="7" height="7"/>',
    "Training & Adult Education": '<path d="M12 5L3 9l9 4 9-4z"/><path d="M7 11v5c0 1.2 2.2 2.5 5 2.5s5-1.3 5-2.5v-5M21 9v5"/>',
    "Energy & Power": '<path d="M13 3L5.5 13.5H11L9.5 21 18 10h-5.5z"/>',
    "Food Services & Hospitality": '<path d="M4 16h16M5.5 16a6.5 6.5 0 0 1 13 0M12 9.5V8"/><path d="M9 19h6" opacity="0.7"/>',
    "Security & Defence": '<path d="M12 3.5l7 2.5v5.5c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6z"/><path d="M9 11.8l2.2 2.2 4-4.2"/>',
    "Aerospace": '<path d="M12 3v7.2M12 10.2L4 15l8-1.4 8 1.4-8-4.8zM12 13.6V19M9.4 19h5.2"/>',
    "Biopharma & Life Sciences": '<path d="M10 3.5h4M11 3.5V10l-5 8.5a1.6 1.6 0 0 0 1.4 2.5h9.2a1.6 1.6 0 0 0 1.4-2.5L13 10V3.5"/><path d="M8.2 15.5h7.6" opacity="0.7"/>'
  };

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

  function ringTexture(THREE) {
    var cv = document.createElement("canvas"); cv.width = cv.height = 64;
    var g = cv.getContext("2d");
    g.translate(32, 32);
    g.shadowColor = "rgba(255,250,235,0.9)";
    g.shadowBlur = 7;
    g.strokeStyle = "rgba(255,250,235,0.95)";
    g.lineWidth = 4;
    g.beginPath(); g.arc(0, 0, 18, 0, 6.2832); g.stroke();
    return new THREE.CanvasTexture(cv);
  }

  // Rasterise one industry glyph into a sprite texture (drawn when the SVG
  // image decodes; the sprite is invisible until a pop reveals it).
  function iconTexture(THREE, inner) {
    var size = 80;
    var cv = document.createElement("canvas"); cv.width = cv.height = size;
    var tex = new THREE.CanvasTexture(cv);
    var c2 = cv.getContext("2d");
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="' + size +
      '" height="' + size + '" fill="none" stroke="#FBF6E9" stroke-width="1.5" ' +
      'stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
    var img = new Image();
    img.onload = function () { c2.clearRect(0, 0, size, size); c2.drawImage(img, 0, 0, size, size); tex.needsUpdate = true; };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    return tex;
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
    var ringTex = ringTexture(THREE);
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
      var ind = INDUSTRIES[k];
      var cnt = ind.count;
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
      var rg = new THREE.Sprite(new THREE.SpriteMaterial({
        map: ringTex, color: GOLD, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
      rg.scale.set(s, s, 1); rg.position.set(x, h, z);
      group.add(rg);
      var icon = new THREE.Sprite(new THREE.SpriteMaterial({
        map: iconTexture(THREE, ICONS[ind.name] || ""), transparent: true, opacity: 0, depthWrite: false
      }));
      icon.scale.set(1.6, 1.6, 1); icon.position.set(x, h + 1.0, z);
      group.add(icon);
      nodes.push({ cell: cell, x: x, z: z, baseH: h, pillar: pv, sprite: sp, ring: rg, icon: icon, base: s, pop: 0, phase: Math.random() * 6.28 });
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

    // The orb runs a nearest-neighbour tour: from where it stands it heads to
    // the closest vector it has not visited yet (by true maze distance), covers
    // them all, then resets and tours again.
    var visited = new Array(nodes.length);
    for (var vi = 0; vi < visited.length; vi++) visited[vi] = false;
    var curNode = 0; visited[0] = true;
    var path = [], pseg = 0, pt = 0, target = 0;
    function chooseNext() {
      var anyLeft = false;
      for (var u = 0; u < nodes.length; u++) { if (!visited[u]) { anyLeft = true; break; } }
      if (!anyLeft) { for (var r2 = 0; r2 < nodes.length; r2++) visited[r2] = false; visited[curNode] = true; }
      var fromCell = nodes[curNode].cell, bestLen = Infinity, bestIdx = -1, bestPath = null;
      for (var n = 0; n < nodes.length; n++) {
        if (visited[n]) continue;
        var p = bfs(fromCell, nodes[n].cell);
        if (p.length > 1 && p.length < bestLen) { bestLen = p.length; bestIdx = n; bestPath = p; }
      }
      if (bestIdx < 0) { bestIdx = (curNode + 1) % nodes.length; bestPath = bfs(fromCell, nodes[bestIdx].cell); }
      target = bestIdx; path = bestPath; pseg = 0; pt = 0;
    }
    chooseNext();

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
          visited[target] = true;
          curNode = target;
          chooseNext();
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
        if (nd.pop > 0) nd.pop = Math.max(0, nd.pop - dt * 0.7);
        var popH = Math.sin(nd.pop * Math.PI / 2);          // 1 at the hit, eases to 0
        var curH = nd.baseH * (1 + popH * 1.15);            // pole springs up, then settles
        var pa = nd.pillar.attributes.position.array;
        pa[4] = curH; nd.pillar.attributes.position.needsUpdate = true;
        var pulse = 1 + Math.sin(tsec * 1.4 + nd.phase) * 0.12;
        var sc = nd.base * pulse * (1 + popH * 1.7);
        nd.sprite.scale.set(sc, sc, 1);
        nd.sprite.position.y = curH;
        nd.sprite.material.opacity = 0.7 + popH * 0.3;
        // shockwave ring bursting out of the tip as the pole pops
        var rs = nd.base * (1 + (1 - nd.pop) * 3.4);
        nd.ring.scale.set(rs, rs, 1);
        nd.ring.position.y = curH;
        nd.ring.material.opacity = nd.pop * 0.85;
        // industry glyph floats up over the tip while the pop holds
        nd.icon.position.y = curH + 1.1 + (1 - nd.pop) * 0.7;
        nd.icon.material.opacity = Math.min(1, nd.pop * 1.4);
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
