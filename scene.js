/* Staffora – 3D-Hintergrund „Rangstufen“ für die Startseite (Three.js, selbst gehostet unter /assets/vendor).
 *
 * Idee: sechs gläserne Platten übereinander, unten die größte, oben die kleinste – wie die Ranglaufbahn im Bot.
 * Ein Lichtpunkt steigt beim Scrollen durch die Stufen nach oben und lässt jede Platte aufleuchten.
 * Bewusst ruhig: Linien statt Partikelwolke, der Stapel steht neben dem Text und verdeckt ihn nicht.
 *
 * - buildStack(), tierY(), markerY(), tierLit(), buildDust(): reine Funktionen (ohne WebGL), einzeln testbar.
 * - startScene(): zeichnet sie. Rücksicht auf Geräte: gedeckelte Pixeldichte, weniger Staub/halbe Bildrate auf schwachen
 *   Geräten, Pause bei unsichtbarem Tab, Standbild bei „Bewegung reduzieren“, eigener Ein/Aus-Schalter, Rückfall ohne WebGL.
 */

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const VIOLET = [0.45, 0.35, 0.96]; // unterste Stufe
const BLUE = [0.29, 0.64, 1.0];    // oberste Stufe
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/** Beschreibt den Stapel: je Stufe Kantenlänge und Farbe. Höhe der Stufe i siehe tierY(). */
export function buildStack(opts) {
  const o = Object.assign({ tiers: 6, size: 4.0, shrink: 0.11, gap: 0.62 }, opts || {});
  const tiers = [];
  for (let i = 0; i < o.tiers; i++) {
    const t = o.tiers > 1 ? i / (o.tiers - 1) : 0;
    tiers.push({ index: i, size: o.size * (1 - o.shrink * i), color: mix(VIOLET, BLUE, t) });
  }
  return { tiers, gap: o.gap, size: o.size };
}

/** Höhe der Stufe i (Stapel ist um y = 0 zentriert) */
export function tierY(i, n, gap) { return (i - (n - 1) / 2) * gap; }

/** Höhe des Lichtpunkts bei Fortschritt p (0 = unterste, 1 = oberste Stufe) */
export function markerY(p, n, gap) { return tierY(0, n, gap) + clamp01(p) * (n - 1) * gap; }

/** Wie stark eine Platte leuchtet (0..1): sie geht an, sobald der Lichtpunkt sie erreicht, und bleibt an */
export function tierLit(my, ty, gap) { return smooth(ty - gap * 0.5, ty, my); }

/** Weit verteilte, sehr wenige Staubkörner für Tiefe (Positionen, 3 Werte je Korn) */
export function buildDust(count, seed) {
  const rnd = mulberry32(seed || 11);
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = rnd() * Math.PI * 2, r = 5.5 + rnd() * 9;
    pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = (rnd() - 0.5) * 12; pos[i * 3 + 2] = Math.sin(a) * r - 2;
  }
  return pos;
}

/** Einstufung des Geräts: reduced = „Bewegung reduzieren“ gewünscht, low = schwaches Gerät/Datensparmodus, mobile = schmaler Bildschirm */
export function deviceProfile(win) {
  const w = win || window;
  const nav = w.navigator || {};
  const c = nav.connection || {};
  const reduced = !!(w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const low = !!(c.saveData || (nav.deviceMemory && nav.deviceMemory <= 2) || (nav.hardwareConcurrency && nav.hardwareConcurrency <= 2));
  const mobile = (w.innerWidth || 1200) < 760;
  return { reduced, low, mobile };
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
  } catch (_) {
    return false;
  }
}

/** Pixeldichte mit Obergrenze und festem Pixel-Budget (≈ 3,2 Mio. Pixel), damit auch große/hochauflösende Bildschirme flüssig bleiben */
export function pixelRatioFor(w, h, dpr, max) {
  const budget = Math.sqrt(3.2e6 / Math.max(1, w * h));
  return Math.max(1, Math.min(dpr || 1, max, budget));
}

export function dustBudget(p) {
  if (p.low) return 0;
  if (p.mobile) return 70;
  return 150;
}

const PLATE_VERT = `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

// Abgerundetes Quadrat per Distanzfeld: scharfe, kantengeglättete Linie + weiches Leuchten nach innen + zarte Innenkontur
const PLATE_FRAG = `
varying vec2 vUv; uniform vec3 uColor; uniform float uLit; uniform float uAlpha;
float sdRound(vec2 p, float r){ vec2 q = abs(p) - 1.0 + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main(){
  vec2 p = (vUv - 0.5) * 2.0;
  float d = sdRound(p, 0.22);
  float aa = max(fwidth(d), 0.0015);
  float inside = 1.0 - smoothstep(-aa, aa, d);
  float edge = 1.0 - smoothstep(0.0, aa * 1.6 + 0.010, abs(d + 0.006));
  float halo = exp(-abs(d) * 6.5) * inside;
  float inner = 1.0 - smoothstep(0.0, aa * 1.6 + 0.008, abs(d + 0.30));
  float a = edge * (0.50 + 0.50 * uLit) + halo * (0.10 + 0.34 * uLit) + inside * (0.022 + 0.05 * uLit) + inner * inside * (0.10 + 0.16 * uLit);
  gl_FragColor = vec4(uColor * (0.85 + 0.45 * uLit), clamp(a, 0.0, 1.0) * uAlpha);
}`;

const MARK_VERT = `
uniform float uSize;
void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_PointSize = uSize; }`;
const MARK_FRAG = `
uniform float uAlpha;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float core = 1.0 - smoothstep(0.0, 0.22, d);
  float glow = pow(1.0 - clamp(d, 0.0, 1.0), 2.4);
  gl_FragColor = vec4(mix(vec3(0.45, 0.62, 1.0), vec3(1.0), core), clamp(glow * 0.85 + core, 0.0, 1.0) * uAlpha);
}`;

const POOL_FRAG = `
varying vec2 vUv; uniform float uAlpha;
void main(){
  float r = length((vUv - 0.5) * 2.0);
  float a = pow(clamp(1.0 - r, 0.0, 1.0), 2.6) * 0.34 * uAlpha;
  gl_FragColor = vec4(0.45, 0.35, 0.96, a);
}`;

/**
 * Startet die Szene in canvas. Gibt { supported, tiers, dust, stop, setMotion(bool) } zurück.
 * Wirft nie: ohne WebGL (oder bei Fehlern) ist supported=false und die Seite zeigt ihren CSS-Hintergrund.
 */
export async function startScene(canvas, options) {
  const opt = Object.assign({ motion: true }, options || {});
  const profile = deviceProfile();
  // Three.js (r160) braucht WebGL 2. Vorher prüfen: spart den Download (670 KB) und vermeidet Fehlermeldungen in der Konsole.
  if (!webglAvailable()) return { supported: false, reason: 'webgl', stop() {}, setMotion() {} };
  let THREE;
  try {
    THREE = await import('./assets/vendor/three.module.min.js');
  } catch (e) {
    return { supported: false, reason: 'three', stop() {}, setMotion() {} };
  }
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: profile.low ? 'low-power' : 'default' });
  } catch (e) {
    return { supported: false, reason: 'webgl', stop() {}, setMotion() {} };
  }
  try {
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const FOV = 38, DIST = 12, ELEV = 0.46; // Blick von schräg oben, damit die Platten als Rauten-Scheiben erscheinen
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
    const stack = buildStack();
    const n = stack.tiers.length;
    const group = new THREE.Group();
    scene.add(group);

    const additive = { transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide };
    const planeGeo = new THREE.PlaneGeometry(1, 1);
    const plates = stack.tiers.map((tier) => {
      const mat = new THREE.ShaderMaterial(Object.assign({
        vertexShader: PLATE_VERT, fragmentShader: PLATE_FRAG,
        uniforms: { uColor: { value: new THREE.Color(tier.color[0], tier.color[1], tier.color[2]) }, uLit: { value: 0 }, uAlpha: { value: 1 } }
      }, additive));
      const mesh = new THREE.Mesh(planeGeo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.scale.set(tier.size, tier.size, 1);
      group.add(mesh);
      return mesh;
    });

    // Boden-Leuchten unter dem Stapel
    const poolMat = new THREE.ShaderMaterial(Object.assign({ vertexShader: PLATE_VERT, fragmentShader: POOL_FRAG, uniforms: { uAlpha: { value: 1 } } }, additive));
    const pool = new THREE.Mesh(planeGeo, poolMat);
    pool.rotation.x = -Math.PI / 2; pool.scale.set(8.4, 8.4, 1);
    group.add(pool);

    // Achse durch die Mitte (schwach) und der „erreichte“ Teil davon (heller, wächst mit dem Lichtpunkt)
    const axisGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 1, 0], 3));
    const axisDim = new THREE.Line(axisGeo, new THREE.LineBasicMaterial({ color: 0x7358f5, transparent: true, opacity: 0.30, depthTest: false, blending: THREE.AdditiveBlending }));
    const axisLit = new THREE.Line(axisGeo, new THREE.LineBasicMaterial({ color: 0x8fb6ff, transparent: true, opacity: 0.85, depthTest: false, blending: THREE.AdditiveBlending }));
    group.add(axisDim, axisLit);

    // Lichtpunkt
    const markGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3));
    const markMat = new THREE.ShaderMaterial({ vertexShader: MARK_VERT, fragmentShader: MARK_FRAG, uniforms: { uSize: { value: 40 }, uAlpha: { value: 1 } }, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
    const marker = new THREE.Points(markGeo, markMat);
    group.add(marker);

    // Wenig Staub für Tiefe (nicht auf schwachen Geräten)
    const dustN = dustBudget(profile);
    let dust = null;
    if (dustN > 0) {
      const g = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(buildDust(dustN), 3));
      dust = new THREE.Points(g, new THREE.PointsMaterial({ color: 0x9fb2ff, size: 0.05, sizeAttenuation: true, transparent: true, opacity: 0.45, depthWrite: false }));
      scene.add(dust);
    }

    const STILL = 0.62; // Standbild: Lichtpunkt auf der vierten Stufe
    let motion = !!opt.motion && !profile.reduced;
    let running = false, raf = 0, last = 0, lastDraw = 0, t = 0, mx = 0, my = 0, cx = 0, cy = 0, scroll = 0, sScroll = 0, lost = false;
    let aspect = 1.6, pr = 1;
    const maxDpr = profile.low ? 1 : profile.mobile ? 1.5 : 2;

    function resize() {
      const w = Math.max(1, canvas.clientWidth || window.innerWidth), h = Math.max(1, canvas.clientHeight || window.innerHeight);
      pr = pixelRatioFor(w, h, window.devicePixelRatio, maxDpr);
      renderer.setPixelRatio(pr);
      renderer.setSize(w, h, false);
      aspect = w / h; camera.aspect = aspect; camera.updateProjectionMatrix();
      markMat.uniforms.uSize.value = 40 * pr;
      draw();
    }
    function readScroll() {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scroll = clamp01(window.scrollY / max);
    }
    function draw() {
      const k = motion ? sScroll : STILL;
      if (motion) { sScroll += (scroll - sScroll) * 0.07; cx += (mx - cx) * 0.045; cy += (my - cy) * 0.045; }

      // Platzierung: breit → Stapel rechts neben dem Text, schmal → mittig und blasser, damit der Text lesbar bleibt
      const halfH = Math.tan((FOV * Math.PI) / 360) * DIST, halfW = halfH * aspect;
      const wide = aspect >= 1.2;
      const fit = Math.min(1, (halfW * 2 * 0.92) / (stack.size * 1.42));
      const sway = motion ? 0.38 + 0.08 * Math.cos(k * Math.PI * 2) : 0.46; // bleibt rechts, rückt beim Scrollen nur leicht ein und aus
      group.scale.setScalar(fit);
      group.position.set(wide ? halfW * sway : 0, wide ? 0 : halfH * 0.34, 0);
      const dim = (wide ? 1 : 0.42) * (motion ? 1 - 0.64 * smooth(0.0, 0.1, k) : 1); // im Hero kräftig, danach nur noch als zarter Hintergrund

      const gap = stack.gap * (1 + 0.4 * k);
      const my_ = markerY(k, n, gap) + (motion ? Math.sin(t * 1.4) * 0.035 : 0);
      for (let i = 0; i < n; i++) {
        const ty = tierY(i, n, gap);
        plates[i].position.y = ty;
        const u = plates[i].material.uniforms;
        u.uLit.value = tierLit(my_, ty, gap);
        u.uAlpha.value = dim;
      }
      const bottom = tierY(0, n, gap), top = tierY(n - 1, n, gap);
      pool.position.y = bottom - 0.5; poolMat.uniforms.uAlpha.value = dim;
      axisDim.position.y = bottom - 0.2; axisDim.scale.y = top - bottom + 0.55;
      axisLit.position.y = bottom - 0.2; axisLit.scale.y = Math.max(0.001, my_ - bottom + 0.2);
      axisDim.material.opacity = 0.30 * dim; axisLit.material.opacity = 0.85 * dim;
      marker.position.y = my_; markMat.uniforms.uAlpha.value = dim;

      group.rotation.y = 0.62 + (motion ? t * 0.06 + k * Math.PI * 1.4 : 0);
      if (dust) { dust.rotation.y = motion ? t * 0.012 : 0; dust.material.opacity = 0.45 * (wide ? 1 : 0.6); }
      camera.position.set(cx * 0.9, Math.sin(ELEV) * DIST - cy * 0.5, Math.cos(ELEV) * DIST);
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    }
    function loop(now) {
      raf = 0;
      if (!running) return;
      const dt = Math.min(0.1, (now - (last || now)) / 1000); last = now;
      if (profile.low && now - lastDraw < 33) { raf = requestAnimationFrame(loop); return; } // schwache Geräte: ca. halbe Bildrate
      lastDraw = now; t += dt; draw();
      raf = requestAnimationFrame(loop);
    }
    function start() { if (running || !motion || lost || document.hidden) return; running = true; last = 0; raf = requestAnimationFrame(loop); }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('scroll', readScroll, { passive: true });
    if (!profile.low && !profile.mobile) window.addEventListener('pointermove', (e) => { mx = (e.clientX / window.innerWidth - 0.5) * 2; my = (e.clientY / window.innerHeight - 0.5) * 2; }, { passive: true });
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); lost = true; stop(); document.documentElement.classList.add('no-webgl'); });
    canvas.addEventListener('webglcontextrestored', () => { lost = false; document.documentElement.classList.remove('no-webgl'); resize(); start(); });

    readScroll(); sScroll = scroll; resize();
    if (motion) start();
    return {
      supported: true,
      profile,
      tiers: n,
      dust: dustN,
      stop,
      setMotion(on) { motion = !!on && !profile.reduced; if (motion) { readScroll(); start(); } else { stop(); draw(); } }
    };
  } catch (e) {
    try { renderer.dispose(); } catch (_) {}
    return { supported: false, reason: 'error', error: String((e && e.message) || e), stop() {}, setMotion() {} };
  }
}
