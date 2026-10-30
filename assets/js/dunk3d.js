/* =========================================================
   SMAÇ SAHNESİ 3D · three.js
   Sporcu: Quaternius Universal Animation Library mankeni (CC0)
   Kaydırma ilerlemesi animasyonu sahne sahne oynatır.
   ========================================================= */
// three.js ve eklentiler yalnızca sahneye yaklaşıldığında indirilir (ilk açılışı hızlandırır)
let THREE, GLTFLoader, RoomEnvironment;

const sec = document.getElementById('dunk');
const pin = sec && sec.querySelector('.dunk-pin');
const bar = document.getElementById('dunkBar');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);

let RIM;
const BALL_R = 0.12;

function hasWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
}

// Ağır kurulum adımları arasında tarayıcıya nefes aldır: her adım tarayıcı boştayken çalışır
// Kaydırma sürerken kurulum hiç çalışmaz; kullanıcı durunca ya da sahneye yaklaşınca (acil) devam eder.
let urgent = false, lastScroll = 0;
window.addEventListener('scroll', () => { lastScroll = performance.now(); }, { passive: true });
const idleYield = () => new Promise((r) => {
  const tryRun = () => {
    if (urgent || performance.now() - lastScroll > 450) {
      if (window.requestIdleCallback) requestIdleCallback(() => r(), { timeout: urgent ? 200 : 1200 }); else setTimeout(r, 30);
    } else setTimeout(tryRun, 150);
  };
  tryRun();
});

async function init() {
  THREE = await import('three');
  await idleYield();
  ({ GLTFLoader } = await import('../vendor/three/addons/loaders/GLTFLoader.js'));
  ({ RoomEnvironment } = await import('../vendor/three/addons/environments/RoomEnvironment.js'));
  RIM = new THREE.Vector3(0, 3.05, 0);
  const canvas = document.createElement('canvas');
  canvas.className = 'dunk-3d';
  canvas.setAttribute('aria-hidden', 'true');
  pin.insertBefore(canvas, pin.querySelector('.dunk-hint'));

  const mobile = window.innerWidth < 761;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.35));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x050607, 11, 24);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

  /* ---------- IŞIKLAR ---------- */
  const hemi = new THREE.HemisphereLight(0xbfffe0, 0x05070a, 0.45);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(-4, 7, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -3, near: 1, far: 30 });
  key.shadow.bias = -0.0004; key.shadow.radius = 4;
  scene.add(key, key.target);
  const rimG = new THREE.SpotLight(0x2be36f, 26, 14, 0.32, 0.8, 1.6);
  const rimB = new THREE.SpotLight(0x5a4dff, 22, 14, 0.32, 0.8, 1.6);
  scene.add(rimG, rimG.target, rimB, rimB.target);
  const hoopSpot = new THREE.SpotLight(0xffffff, 120, 14, 0.42, 0.7, 1.3);
  hoopSpot.position.set(-0.8, 8, 2.5); hoopSpot.target.position.copy(RIM);
  scene.add(hoopSpot, hoopSpot.target);

  /* ---------- ZEMİN + SAHA ÇİZGİLERİ ---------- */
  const cw = 2048, ch = 1024, cc = document.createElement('canvas'); cc.width = cw; cc.height = ch;
  const g = cc.getContext('2d');
  const X0 = -16, X1 = 4, Z0 = -8, Z1 = 8;           // doku kapsamı (metre)
  const px = (x) => (x - X0) / (X1 - X0) * cw, pz = (z) => (z - Z0) / (Z1 - Z0) * ch;
  const sx = (cw / (X1 - X0)), sz = (ch / (Z1 - Z0));
  function paintFloor(light) {
    const grd = g.createRadialGradient(px(0), pz(0), 10, px(0), pz(0), cw * 0.6);
    grd.addColorStop(0, light ? '#f4f1e6' : '#0e1a13'); grd.addColorStop(1, light ? '#ddd6c4' : '#050706');
    g.globalAlpha = 1; g.fillStyle = grd; g.fillRect(0, 0, cw, ch);
    // parke çizgileri
    g.globalAlpha = light ? 0.08 : 0.05; g.strokeStyle = light ? '#7a5a2a' : '#ffffff'; g.lineWidth = 2;
    for (let z = Z0; z < Z1; z += 0.18) { g.beginPath(); g.moveTo(0, pz(z)); g.lineTo(cw, pz(z)); g.stroke(); }
    g.globalAlpha = 1;
    g.fillStyle = light ? 'rgba(0,175,67,.32)' : 'rgba(0,175,67,.16)'; g.fillRect(px(-4.6), pz(-2.45), px(1.2) - px(-4.6), pz(2.45) - pz(-2.45));
    g.strokeStyle = light ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.55)'; g.lineWidth = light ? 7 : 5;
    g.strokeRect(px(-4.6), pz(-2.45), px(1.2) - px(-4.6), pz(2.45) - pz(-2.45));
    g.beginPath(); g.moveTo(px(1.2), pz(Z0)); g.lineTo(px(1.2), pz(Z1)); g.stroke();
    g.beginPath(); g.ellipse(px(-4.6), pz(0), 1.8 * sx, 1.8 * sz, 0, Math.PI / 2, Math.PI * 1.5); g.stroke();
    g.beginPath(); g.ellipse(px(0), pz(0), 6.75 * sx, 6.75 * sz, 0, Math.PI / 2 + 0.12, Math.PI * 1.5 - 0.12); g.stroke();
    g.strokeStyle = light ? 'rgba(0,140,55,.9)' : 'rgba(43,227,111,.8)'; g.lineWidth = 6;
    g.beginPath(); g.ellipse(px(0), pz(0), 1.25 * sx, 1.25 * sz, 0, Math.PI / 2, Math.PI * 1.5); g.stroke();
  }
  paintFloor(false);
  const floorTex = new THREE.CanvasTexture(cc);
  floorTex.colorSpace = THREE.SRGBColorSpace; floorTex.anisotropy = 8;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0),
    new THREE.MeshStandardMaterial({ map: floorTex, color: 0x454c48, roughness: 0.5, metalness: 0.2, envMapIntensity: 0.12 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set((X0 + X1) / 2, 0, (Z0 + Z1) / 2);
  floor.receiveShadow = true;
  scene.add(floor);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({ color: 0x050607 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.002; scene.add(ground);

  // oyuncu altı ışıltı
  const glowC = document.createElement('canvas'); glowC.width = glowC.height = 128;
  const gg = glowC.getContext('2d'), rg = gg.createRadialGradient(64, 64, 0, 64, 64, 64);
  rg.addColorStop(0, 'rgba(43,227,111,.55)'); rg.addColorStop(1, 'rgba(43,227,111,0)');
  gg.fillStyle = rg; gg.fillRect(0, 0, 128, 128);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(glowC), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.rotation.x = -Math.PI / 2; glow.position.y = 0.01;
  scene.add(glow);

  /* ---------- POTA ---------- */
  const hoop = new THREE.Group(); scene.add(hoop);
  const dark = new THREE.MeshStandardMaterial({ color: 0x141a17, roughness: 0.5, metalness: 0.6 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 3.7, 20), dark);
  pole.position.set(2.5, 1.85, 0); pole.castShadow = true; hoop.add(pole);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.1, 0.12), dark);
  arm.position.set(1.45, 3.52, 0); arm.rotation.z = -0.08; hoop.add(arm);
  const pad = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.25, 0.9), new THREE.MeshStandardMaterial({ color: 0x0d1210, roughness: 0.8 }));
  pad.position.set(2.5, 0.125, 0); pad.castShadow = true; hoop.add(pad);
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.07, 1.8),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0, transmission: 0 }));
  board.position.set(0.4, 3.4, 0); hoop.add(board);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(board.geometry), new THREE.LineBasicMaterial({ color: 0xffffff }));
  edge.position.copy(board.position); hoop.add(edge);
  const sq = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.59, 0.45)), new THREE.LineBasicMaterial({ color: 0x2be36f }));
  sq.rotation.y = Math.PI / 2; sq.position.set(0.37, 3.3, 0); hoop.add(sq);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xff5a14, roughness: 0.35, metalness: 0.55, emissive: 0x5a1600 });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.018, 14, 56), rimMat);
  rim.rotation.x = Math.PI / 2; rim.position.copy(RIM); rim.castShadow = true; hoop.add(rim);
  const brace = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.03, 0.12), rimMat);
  brace.position.set(0.3, 3.04, 0); hoop.add(brace);

  // file: elmas örgü çizgileri
  const NS = 14, NL = 5, netTop = 0.23, netBot = 0.13, netH = 0.44;
  const netPos = new Float32Array(NS * NL * 2 * 3 * 2);
  const netGeo = new THREE.BufferGeometry();
  netGeo.setAttribute('position', new THREE.BufferAttribute(netPos, 3));
  const net = new THREE.LineSegments(netGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }));
  hoop.add(net);
  function updateNet(swish, t) {
    let k = 0;
    const node = (i, l) => {
      const v = l / (NL - 1);
      const r = lerp(netTop, netBot, v) * (1 - swish * 0.25 * Math.sin(v * Math.PI));
      const a = (i + (l % 2) * 0.5) / NS * Math.PI * 2 + Math.sin(t * 9 + l) * swish * 0.08;
      return [RIM.x + Math.cos(a) * r, RIM.y - v * netH * (1 + swish * 0.35), RIM.z + Math.sin(a) * r];
    };
    for (let l = 0; l < NL - 1; l++) for (let i = 0; i < NS; i++) {
      const a = node(i, l), b1 = node(i, l + 1), b2 = node((i + NS - 1) % NS, l + 1);
      const push = (p) => { netPos[k++] = p[0]; netPos[k++] = p[1]; netPos[k++] = p[2]; };
      if (l % 2 === 0) { push(a); push(b1); push(a); push(node((i + 1) % NS, l + 1)); }
      else { push(a); push(b1); push(a); push(b2); }
    }
    netGeo.attributes.position.needsUpdate = true;
  }
  updateNet(0, 0);

  /* ---------- TOP ---------- */
  const texL = new THREE.TextureLoader();
  await idleYield();
  const ballMap = await texL.loadAsync('assets/3d/top-renk.jpg');
  await idleYield();
  const ballNrm = await texL.loadAsync('assets/3d/top-normal.jpg');
  await idleYield();
  ballMap.colorSpace = THREE.SRGBColorSpace; ballMap.anisotropy = 8;
  const ball = new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 64, 48),
    new THREE.MeshStandardMaterial({ map: ballMap, normalMap: ballNrm, normalScale: new THREE.Vector2(1.1, 1.1), roughness: 0.62, metalness: 0 }));
  ball.castShadow = true;
  scene.add(ball);

  /* ---------- HIZ ÇİZGİLERİ ---------- */
  const streaks = new THREE.Group(); scene.add(streaks);
  for (let i = 0; i < 30; i++) {
    const len = 0.6 + Math.random() * 2.6;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.012 + Math.random() * 0.02),
      new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? 0x5a4dff : 0x2be36f, transparent: true, opacity: 0.12 + Math.random() * 0.25, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.position.set(-15 + Math.random() * 17, 0.4 + Math.random() * 3.4, -3 - Math.random() * 6);
    m.userData.base = m.position.x;
    streaks.add(m);
  }

  /* ---------- KIVILCIMLAR ---------- */
  const SPN = 160, spPos = new Float32Array(SPN * 3), spCol = new Float32Array(SPN * 3), spVel = new Float32Array(SPN * 3), spLife = new Float32Array(SPN);
  const spGeo = new THREE.BufferGeometry();
  spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3));
  spGeo.setAttribute('color', new THREE.BufferAttribute(spCol, 3));
  const sparkMat = new THREE.PointsMaterial({ size: 0.05, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const sparks = new THREE.Points(spGeo, sparkMat);
  sparks.frustumCulled = false; scene.add(sparks);
  const palette = [new THREE.Color(0x2be36f), new THREE.Color(0xffffff), new THREE.Color(0x5a4dff), new THREE.Color(0xff7a2a)];
  let sparkOn = 0;
  function burst() {
    if (reduce) return;
    for (let i = 0; i < SPN; i++) {
      const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI - Math.PI / 2, v = 1.5 + Math.random() * 4;
      spPos.set([RIM.x, RIM.y, RIM.z], i * 3);
      spVel.set([Math.cos(a) * Math.cos(b) * v, Math.abs(Math.sin(b)) * v + 1, Math.sin(a) * Math.cos(b) * v], i * 3);
      const c = palette[i % palette.length]; spCol.set([c.r, c.g, c.b], i * 3);
      spLife[i] = 0.6 + Math.random() * 0.9;
    }
    sparkOn = 1.6;
  }
  function updateSparks(dt) {
    if (sparkOn <= 0) { sparks.visible = false; return; }
    sparks.visible = true; sparkOn -= dt;
    for (let i = 0; i < SPN; i++) {
      if (spLife[i] <= 0) { spPos[i * 3 + 1] = -99; continue; }
      spLife[i] -= dt; spVel[i * 3 + 1] -= 9 * dt;
      spPos[i * 3] += spVel[i * 3] * dt; spPos[i * 3 + 1] += spVel[i * 3 + 1] * dt; spPos[i * 3 + 2] += spVel[i * 3 + 2] * dt;
      const f = clamp(spLife[i], 0, 1); spCol[i * 3] *= 0.985; spCol[i * 3 + 1] *= 0.985; spCol[i * 3 + 2] *= 0.985; void f;
    }
    spGeo.attributes.position.needsUpdate = true; spGeo.attributes.color.needsUpdate = true;
  }

  /* ---------- SPORCU ---------- */
  const loader = new GLTFLoader();
  // dosyalar paralel indirilir, ama ayrıştırma tek tek ve aralarda boşta beklenerek yapılır
  const bufs = await Promise.all(['sporcu-govde', 'sporcu-sac', 'sporcu-anim', 'sporcu-ek'].map((n) => fetch('assets/3d/' + n + '.glb').then((r) => r.arrayBuffer())));
  const parsed = [];
  for (const b of bufs) { await idleYield(); parsed.push(await loader.parseAsync(b, 'assets/3d/')); }
  const [body, hairG, main, extra] = parsed;
  await idleYield();
  const model = body.scene;
  // Forma baskısı (göğüs: DAÇKA 14, sırt: 14) — bağlama pozunda düzlemsel izdüşüm
  const jc = document.createElement('canvas'); jc.width = 1024; jc.height = 512;
  const jx = jc.getContext('2d');
  jx.textAlign = 'center'; jx.textBaseline = 'middle'; jx.fillStyle = '#fff';
  jx.font = 'italic 900 extra-condensed 112px Archivo, Impact, sans-serif'; jx.fillText('DAÇKA', 256, 170);
  jx.font = '800 extra-condensed 170px Archivo, Impact, sans-serif';
  jx.lineWidth = 10; jx.strokeStyle = '#0b0f0c'; jx.strokeText('14', 256, 330); jx.fillText('14', 256, 330);
  jx.font = '800 extra-condensed 260px Archivo, Impact, sans-serif'; jx.strokeText('14', 768, 290); jx.fillText('14', 768, 290);
  jx.font = '800 extra-condensed 64px Archivo, Impact, sans-serif'; jx.fillText('GÜZ KAMPI', 768, 120);
  const jTex = new THREE.CanvasTexture(jc); jTex.colorSpace = THREE.SRGBColorSpace;
  const redrawJersey = () => { jTex.needsUpdate = true; };
  if (document.fonts) document.fonts.ready.then(() => {
    jx.clearRect(0, 0, 1024, 512);
    jx.font = 'italic 900 extra-condensed 112px Archivo, Impact, sans-serif'; jx.fillText('DAÇKA', 256, 170);
    jx.font = '800 extra-condensed 170px Archivo, Impact, sans-serif'; jx.strokeText('14', 256, 330); jx.fillText('14', 256, 330);
    jx.font = '800 extra-condensed 260px Archivo, Impact, sans-serif'; jx.strokeText('14', 768, 290); jx.fillText('14', 768, 290);
    jx.font = '800 extra-condensed 64px Archivo, Impact, sans-serif'; jx.fillText('GÜZ KAMPI', 768, 120);
    redrawJersey();
  });
  // Gövde: Quaternius UBC (CC0) ten dokusu korunur, forma/şort/çorap/ayakkabı bölgeleri gölgelendiricide giydirilir
  let skinSrc = null;
  model.traverse((o) => { if (o.isMesh && o.material && o.material.name === 'MI_Superhero_Male') skinSrc = o.material; });
  const bodyMat = new THREE.MeshStandardMaterial({
    map: skinSrc.map, normalMap: skinSrc.normalMap, roughnessMap: skinSrc.roughnessMap,
    roughness: 1, metalness: 0
  });
  bodyMat.onBeforeCompile = (sh) => {
    sh.uniforms.uPrint = { value: jTex };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vBind;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBind = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vBind;\nuniform sampler2D uPrint;\nfloat gCloth;\nfloat gRough;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 b = vBind; float ax = abs(b.x);
        vec3 green = vec3(0.0, 0.36, 0.06), greenD = vec3(0.0, 0.27, 0.05), white = vec3(0.88);
        vec3 c = diffuseColor.rgb; gCloth = 0.0; gRough = 0.6;
        bool arm = ax > 0.19 && b.y > 1.2;
        float neckV = 1.41 + ax * 1.25;
        bool strap = ax < 0.145 || b.y < 1.33;
        bool jersey = !arm && b.y > 0.9 && b.y < 1.53 && strap && !(b.z > -0.02 && b.y > neckV) && !(b.z <= -0.02 && b.y > 1.48);
        if (jersey) {
          c = green; gCloth = 1.0; gRough = 0.66;
          float trim = 0.0;
          trim += step(1.33, b.y) * (1.0 - smoothstep(0.004, 0.012, abs(ax - 0.137)));
          trim += step(-0.02, b.z) * (1.0 - smoothstep(0.005, 0.014, abs(b.y - neckV))) * step(1.36, b.y);
          trim += (1.0 - step(-0.02, b.z)) * (1.0 - smoothstep(0.004, 0.012, abs(b.y - 1.475)));
          trim += (1.0 - smoothstep(0.004, 0.012, abs(ax - 0.17))) * step(b.y, 1.33) * step(1.05, b.y);
          c = mix(c, white, clamp(trim, 0.0, 1.0));
          if (ax < 0.15 && b.y > 1.02 && b.y < 1.42) {
            vec2 uv = vec2((b.x + 0.15) / 0.30, (b.y - 1.02) / 0.40);
            uv = b.z > -0.02 ? vec2(uv.x * 0.5, uv.y) : vec2(0.5 + (1.0 - uv.x) * 0.5, uv.y);
            vec4 pr = texture2D(uPrint, uv);
            c = mix(c, pr.rgb, pr.a);
          }
        } else if (!arm && b.y > 0.57 && b.y <= 0.94) {
          c = greenD; gCloth = 1.0; gRough = 0.62;
          float band = 1.0 - smoothstep(0.008, 0.016, abs(b.y - 0.915));
          float side = (1.0 - smoothstep(0.008, 0.02, abs(ax - 0.2))) * step(0.62, b.y);
          float hem = 1.0 - smoothstep(0.004, 0.012, abs(b.y - 0.59));
          c = mix(c, white, clamp(band + side + hem, 0.0, 1.0));
        } else if (b.y < 0.3 && b.y > 0.095) {
          c = white * 0.95; gCloth = 1.0; gRough = 0.85;
          c = mix(c, green, 1.0 - smoothstep(0.004, 0.01, abs(b.y - 0.275)));
        } else if (b.y <= 0.095) {
          c = b.y < 0.02 ? vec3(0.025) : white; gCloth = 1.0; gRough = 0.4;
          c = mix(c, green, (1.0 - smoothstep(0.006, 0.014, abs(b.y - 0.05))));
        } else if (arm && ax > 0.6 && ax < 0.66) {
          c = white * 0.92; gCloth = 1.0; gRough = 0.8;
        }
        diffuseColor.rgb = c;`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, gRough, gCloth);')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = normalize(mix(normal, nonPerturbedNormal, gCloth * 0.55));')
      .replace('#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\n float frs = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 3.0);\n totalEmissiveRadiance += vec3(0.10, 0.85, 0.38) * frs * 0.55;');
  };
  model.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true; o.frustumCulled = false;
      if (o.material && o.material.name === 'MI_Superhero_Male') o.material = bodyMat;
      else if (o.material && o.material.name === 'MI_Hair_1') { o.material = o.material.clone(); o.material.color.setHex(0x2a1c12); }
    }
  });
  // saç: kendi iskeletini sporcunun iskeletine bağla
  hairG.scene.traverse((o) => {
    if (o.isSkinnedMesh) {
      const bones = o.skeleton.bones.map((bn) => model.getObjectByName(bn.name) || bn);
      const hair = o.clone();
      hair.material = o.material.clone(); hair.material.color.setHex(0x24170e); hair.material.roughness = 0.7;
      hair.bind(new THREE.Skeleton(bones, o.skeleton.boneInverses), o.bindMatrix);
      hair.castShadow = true; hair.frustumCulled = false;
      const sm = model.getObjectByName('SuperHero_Male');
      (sm && sm.parent ? sm.parent : model).add(hair);
    }
  });
  const box = new THREE.Box3().setFromObject(model);
  const sc = 1.93 / (box.max.y - box.min.y);
  const holder = new THREE.Group();
  model.scale.setScalar(sc);
  model.position.y = -box.min.y * sc;
  holder.add(model);
  scene.add(holder);
  const handR = model.getObjectByName('hand_r'), handL = model.getObjectByName('hand_l');
  const upR = model.getObjectByName('upperarm_r'), loR = model.getObjectByName('lowerarm_r');
  const _P = new THREE.Vector3(), _E = new THREE.Vector3(), _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3();
  const _qd = new THREE.Quaternion(), _qw = new THREE.Quaternion(), _qp = new THREE.Quaternion();
  function aimBone(bone, eff, target, w) {
    bone.getWorldPosition(_P); eff.getWorldPosition(_E);
    _v1.subVectors(_E, _P).normalize(); _v2.subVectors(target, _P).normalize();
    _qd.setFromUnitVectors(_v1, _v2);
    bone.getWorldQuaternion(_qw); _qd.multiply(_qw);
    bone.parent.getWorldQuaternion(_qp); _qp.invert().multiply(_qd);
    bone.quaternion.slerp(_qp, w);
    bone.updateMatrixWorld(true);
  }
  function reach(target, w) {
    if (w <= 0.001) return;
    for (let i = 0; i < 3; i++) { aimBone(loR, handR, target, w); aimBone(upR, handR, target, w); }
  }
  const ikT = new THREE.Vector3();

  // animasyon katmanları
  // Katmanlama: yalnız sağ kol ayrı oynar (smaç/fırlatma), gövde ve sol kol zıplama animasyonundan gelir
  const UPPER = /^(clavicle_r|upperarm_r|lowerarm_r|hand_r|(thumb|index|middle|ring|pinky)_\d+(_leaf)?_r)$/;
  const clips = {};
  main.animations.concat(extra.animations).forEach((c) => { clips[c.name] = c; });
  const part = (c, upper) => new THREE.AnimationClip(c.name + (upper ? '_U' : '_L'), c.duration,
    c.tracks.filter((t) => UPPER.test(t.name.split('.')[0]) === upper && !/^root\.position/.test(t.name)));
  const full = (c) => new THREE.AnimationClip(c.name + '_F', c.duration, c.tracks.filter((t) => !/^root\.position/.test(t.name)));
  const mixer = new THREE.AnimationMixer(model);
  const A = {};
  const mk = (name, clip) => { const a = mixer.clipAction(clip); a.play(); a.paused = true; a.setEffectiveWeight(0); A[name] = a; return a; };
  mk('run', full(clips.Sprint_Loop));
  mk('startL', part(clips.Jump_Start, false)); mk('startU', part(clips.Jump_Start, true));
  mk('airL', part(clips.Jump_Loop, false));
  mk('throwU', part(clips.OverhandThrow, true));
  mk('landL', part(clips.Jump_Land, false)); mk('landU', part(clips.Jump_Land, true));
  mk('idleU', part(clips.Idle_Loop, true));

  function setA(name, w, t01) {
    const a = A[name]; a.setEffectiveWeight(w); a.time = clamp(t01, 0, 0.999) * a.getClip().duration;
  }

  /* ---------- ZAMAN ÇİZELGESİ ---------- */
  const RUN_END = 0.36, GATH_END = 0.47, AIR_END = 0.74, SLAM_T = 0.8, LAND_T = 0.9;
  const RUN_CYC = 5;
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  let phase = 1;

  function pose(p) {
    Object.keys(A).forEach((k) => A[k].setEffectiveWeight(0));
    let x, y = 0, ik = 0, ikY = RIM.y;
    if (p < RUN_END) {
      const q = p / RUN_END;
      x = lerp(-7.2, -3.3, q);
      setA('run', 1, (q * RUN_CYC) % 1);
      phase = 1;
    } else if (p < GATH_END) {
      const q = seg(p, RUN_END, GATH_END);
      x = lerp(-3.3, -2.15, Math.sin(q * Math.PI / 2));
      const wR = 1 - smooth(0, 0.35, q);
      setA('run', wR, (RUN_CYC + q * 0.4) % 1);
      setA('startL', 1 - wR, q * 0.6); setA('startU', 1 - wR, q * 0.6);
      phase = 2;
    } else if (p < AIR_END) {
      const q = seg(p, GATH_END, AIR_END);
      x = lerp(-2.15, -0.5, q);
      y = 1.15 * Math.sin(q * Math.PI / 2);
      const wS = 1 - smooth(0, 0.3, q);
      setA('startL', wS, 0.6 + q * 0.4); setA('airL', 1 - wS, q * 0.5);
      setA('startU', 1 - smooth(0, 0.25, q), 0.6 + q * 0.4);
      setA('throwU', smooth(0, 0.25, q), q * 0.21);
      ik = smooth(0.35, 1, q); ikY = RIM.y + 0.4;
      phase = 2;
    } else if (p < LAND_T) {
      const q = seg(p, AIR_END, LAND_T);
      x = lerp(-0.5, -0.12, q);
      y = 1.15 * (1 - Math.pow(smooth(0.42, 1, q), 1.6));
      setA('airL', 1, 0.5 + q * 0.3);
      setA('throwU', 1, lerp(0.21, 0.36, smooth(SLAM_T - 0.01, SLAM_T + 0.05, p)));
      ik = 1 - smooth(SLAM_T, SLAM_T + 0.045, p);
      ikY = lerp(RIM.y + 0.4, RIM.y + 0.06, smooth(AIR_END, SLAM_T, p));
      phase = p < SLAM_T ? 3 : 4;
    } else {
      const q = seg(p, LAND_T, 1);
      x = lerp(-0.1, 0.05, q);
      y = 0;
      setA('landL', 1, q * 0.95);
      const wT = 1 - smooth(0, 0.6, q);
      setA('throwU', wT, 0.78 + q * 0.2);
      setA('landU', (1 - wT) * 0.5, q * 0.95); setA('idleU', (1 - wT) * 0.5, q * 0.5);
      phase = 4;
    }
    mixer.update(0);
    holder.position.set(x, y, 0);
    holder.rotation.y = lerp(1.25, 1.45, smooth(GATH_END, AIR_END, p));
    holder.updateMatrixWorld(true);
    ikT.set(RIM.x - 0.12, ikY, RIM.z + 0.04);
    reach(ikT, ik);

    // top
    handR.getWorldPosition(tmp);
    if (p < RUN_END) {
      const q = p / RUN_END, cyc = q * RUN_CYC * 2;
      const tri = Math.abs(Math.cos(Math.PI * cyc));
      ball.position.set(tmp.x + 0.16, lerp(BALL_R, tmp.y - 0.1, Math.pow(tri, 0.75)), tmp.z + 0.06);
    } else if (p < GATH_END) {
      const q = seg(p, RUN_END, GATH_END);
      handL.getWorldPosition(tmp2);
      const cx = (tmp.x + tmp2.x) / 2 + 0.12, cy = (tmp.y + tmp2.y) / 2, cz = (tmp.z + tmp2.z) / 2;
      ball.position.set(lerp(tmp.x + 0.16, cx, smooth(0, 0.6, q)), lerp(BALL_R + 0.4, cy, smooth(0, 0.6, q)), cz);
    } else if (p < SLAM_T) {
      const toRim = smooth(SLAM_T - 0.035, SLAM_T, p);
      tmp.add(tmp2.set(0.06, 0.1, 0.02));
      ball.position.lerpVectors(tmp, tmp2.set(RIM.x, RIM.y + 0.02, RIM.z), toRim);
    } else {
      const s = seg(p, SLAM_T, 1) * 1.9, h0 = RIM.y - 0.05, gv = 9.8;
      const t1 = Math.sqrt(2 * (h0 - BALL_R) / gv);
      let yy;
      if (s < t1) yy = h0 - 0.5 * gv * s * s;
      else {
        let v = Math.sqrt(2 * gv * (h0 - BALL_R)) * 0.58, tb = s - t1;
        yy = BALL_R;
        for (let k = 0; k < 6; k++) { const T = 2 * v / gv; if (tb < T) { yy = BALL_R + v * tb - 0.5 * gv * tb * tb; break; } tb -= T; v *= 0.58; }
      }
      ball.position.set(RIM.x - 0.05 + Math.max(0, s - t1) * 0.5, yy, RIM.z + Math.max(0, s - t1) * 0.25);
    }
    ball.rotation.set(p * 40, p * 25, 0);

    glow.position.x = x + 0.1;
    glow.material.opacity = 1 - clamp(y / 1.2, 0, 0.7);
    return { x, y };
  }

  /* ---------- TEMA ---------- */
  function applyTheme() {
    const light = document.documentElement.getAttribute('data-theme') === 'light';
    paintFloor(light); floorTex.needsUpdate = true;
    floor.material.color.setHex(light ? 0xffffff : 0x454c48);
    floor.material.envMapIntensity = light ? 0.35 : 0.12;
    ground.material.color.setHex(light ? 0xe7e9e3 : 0x050607);
    scene.fog.color.setHex(light ? 0xeef1ec : 0x050607);
    hemi.intensity = light ? 1.25 : 0.45; hemi.groundColor.setHex(light ? 0x9aa39c : 0x05070a);
    key.intensity = light ? 2.8 : 2.4;
    rimG.intensity = light ? 14 : 26; rimB.intensity = light ? 10 : 22;
    renderer.toneMappingExposure = light ? 1.0 : 1.15;
    streaks.children.forEach((m, i) => {
      m.material.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
      m.material.color.setHex(light ? (i % 3 === 0 ? 0x3b2fd6 : 0x00a33f) : (i % 3 === 0 ? 0x5a4dff : 0x2be36f));
      m.material.needsUpdate = true;
    });
    sparkMat.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending; sparkMat.size = light ? 0.06 : 0.05; sparkMat.needsUpdate = true;
    glow.material.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending; glow.material.needsUpdate = true;
    last = -1;
  }
  window.addEventListener('temadegisti', applyTheme);

  /* ---------- KAMERA ---------- */
  let W = 0, H = 0;
  function size() {
    W = pin.clientWidth; H = pin.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
  }
  size();
  window.addEventListener('resize', size);
  const camPos = new THREE.Vector3(-8, 2, 10), camLook = new THREE.Vector3(-8, 1.3, 0);
  let shake = 0;
  function frameCam(p, st, snap) {
    const a = W / H;
    const tw = lerp(3.2, 6.4, clamp((a - 0.45) / 1.25, 0, 1));
    const d = tw / (2 * Math.tan(THREE.MathUtils.degToRad(16)) * a);
    const air = smooth(RUN_END, AIR_END, p) * (1 - smooth(LAND_T, 1, p) * 0.6);
    const end = smooth(LAND_T, 1, p);
    const fx = lerp(lerp(st.x + (a < 0.8 ? 0.4 : 1.2), lerp(st.x, RIM.x, 0.5) - 0.2, air), st.x - (a < 0.8 ? 0.2 : 0.7), end);
    const port = a < 0.8;
    const ty = lerp(port ? 1.75 : 1.15, port ? 2.4 : 2.15, air), cy = lerp(port ? 1.35 : 0.95, port ? 1.7 : 1.45, air);
    tmp.set(fx + 0.5, cy, d * lerp(1, 0.9, air));
    tmp2.set(fx, ty, 0);
    if (snap) { camPos.copy(tmp); camLook.copy(tmp2); }
    else { camPos.lerp(tmp, 0.12); camLook.lerp(tmp2, 0.12); }
    camera.position.copy(camPos);
    if (shake > 0.01) camera.position.add(tmp.set((Math.random() - 0.5) * shake * 0.12, (Math.random() - 0.5) * shake * 0.12, 0));
    camera.lookAt(camLook);
    // ışıklar oyuncuyu takip eder
    rimG.position.set(st.x + 2.6, 2.4 + st.y, -3.2); rimG.target.position.set(st.x, 1.25 + st.y, 0);
    rimB.position.set(st.x - 2.6, 2.2 + st.y, -3.0); rimB.target.position.set(st.x, 1.25 + st.y, 0);
    key.position.set(st.x - 4, 7, 7); key.target.position.set(st.x, 0.8, 0);
  }

  /* ---------- DÖNGÜ ---------- */
  let visible = false, cur = 0, target = 0, last = -1, slammed = false, prevT = performance.now(), first = true, dbg = null;
  if (location.search.indexOf('debug') > -1) window.__dunk = (v) => { dbg = v; last = -1; first = true; };
  function progress() {
    const r = sec.getBoundingClientRect();
    return clamp(-r.top / Math.max(1, r.height - window.innerHeight), 0, 1);
  }
  function loop(now) {
    const dt = Math.min(0.05, (now - prevT) / 1000); prevT = now;
    if (visible) {
      target = dbg !== null ? dbg : progress();
      cur = reduce || dbg !== null ? target : lerp(cur, target, 0.12);
      if (Math.abs(cur - target) < 0.0003) cur = target;
      if (!slammed && cur >= SLAM_T - 0.005) { slammed = true; burst(); shake = 1; }
      if (slammed && cur < AIR_END) slammed = false;
      shake *= 0.9;
      const swish = cur > SLAM_T ? Math.exp(-seg(cur, SLAM_T, 1) * 9) : 0;
      if (cur !== last || sparkOn > 0 || shake > 0.01 || swish > 0.01) {
        const st = pose(cur);
        updateNet(swish, now / 1000);
        updateSparks(dt);
        streaks.children.forEach((m, i) => { m.position.x = m.userData.base + cur * (6 + (i % 5) * 2); m.scale.x = 1 + (cur < AIR_END ? 1.5 : 0.2); });
        frameCam(cur, st, first); first = false;
        renderer.render(scene, camera);
        sec.setAttribute('data-phase', phase);
        if (bar) bar.style.transform = 'scaleX(' + cur + ')';
        last = cur;
      }
    }
    requestAnimationFrame(loop);
  }
  new IntersectionObserver((en) => {
    visible = en[0].isIntersecting;
    canvas.style.visibility = visible ? '' : 'hidden';
    if (visible) last = -1;
  }).observe(sec);
  await idleYield();
  if (renderer.compileAsync) { try { await renderer.compileAsync(scene, camera); } catch (e) {} }
  await idleYield();
  sec.classList.add('is-3d');
  applyTheme();
  last = -1; visible = true;
  requestAnimationFrame(loop);
}

if (sec && pin && hasWebGL()) {
  // Sahne, kullanıcı oraya kaydırmadan önce tarayıcı boştayken hazırlanır (kaydırmada takılma olmasın).
  let started = false;
  const go = () => { if (started) return; started = true; init().catch((e) => { console.warn('3D sahne yüklenemedi, 2B sürüm kullanılıyor.', e); sec.classList.remove('is-3d'); }); };
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1500));
  // masaüstünde sayfa yüklenince boşta hazırla; mobilde veri harcamamak için sahneye yaklaşınca
  const later = () => setTimeout(() => idle(go, { timeout: 4000 }), window.innerWidth > 760 ? 0 : 2500);
  if (document.readyState === 'complete') later(); else window.addEventListener('load', later);
  const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { io.disconnect(); urgent = true; go(); } }, { rootMargin: '1200px 0px' });
  io.observe(sec);
}
