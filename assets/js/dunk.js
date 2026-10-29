/* =========================================================
   SMAÇ SAHNESİ · Kaydırmayla oynayan basketbolcu animasyonu
   İskelet (kalça, diz, dirsek...) kodla tanımlanır, Canvas ile çizilir.
   Dünya birimi metre: zemin y=0, yukarı +y.
   ========================================================= */
(function () {
  'use strict';
  var sec = document.getElementById('dunk');
  var cv = document.getElementById('dunkCanvas');
  if (!sec || !cv) return;
  var ctx = cv.getContext('2d');
  var bar = document.getElementById('dunkBar');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var PI = Math.PI, sin = Math.sin, cos = Math.cos;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };

  // Saha
  var RIM = { x: 8.55, y: 3.05, r: 0.23 };
  var BOARD = { x: 8.98, y0: 2.9, y1: 4.0 };
  var BALL_R = 0.12;
  // İskelet ölçüleri
  var L = { torso: 0.56, neck: 0.1, head: 0.115, ua: 0.31, fa: 0.29, th: 0.45, sh: 0.45, foot: 0.22 };

  // açı: aşağıdan ölçülür, + yön ileri (+x)
  function pt(o, a, len) { return { x: o.x + sin(a) * len, y: o.y - cos(a) * len }; }

  /* ---------- POZLAR ---------- */
  function runPose(ph, x) {
    var p = {
      x: x, y: 0.97 + 0.045 * cos(2 * ph), lean: 0.24, head: 0.1,
      fl: [0.12 + 0.6 * sin(ph), 0.25 + 1.05 * Math.max(0, cos(ph))],
      bl: [0.12 + 0.6 * sin(ph + PI), 0.25 + 1.05 * Math.max(0, cos(ph + PI))],
      fa: [0.42 + 0.12 * sin(2 * ph), 0.55 + 0.35 * sin(2 * ph)],
      ba: [-0.55 * sin(ph) + 0.15, 1.25]
    };
    return p;
  }
  var GATHER = { y: 0.8, lean: 0.38, head: 0.15, fl: [1.0, 1.65], bl: [0.05, 1.25], fa: [1.0, 1.05], ba: [0.95, 1.15] };
  var FLY = { y: 2.02, lean: 0.06, head: -0.1, fl: [1.45, 1.75], bl: [-0.25, 1.15], fa: [2.85, 0.25], ba: [1.3, 0.9] };
  var SLAM = { y: 1.95, lean: 0.12, head: 0.05, fl: [1.0, 1.3], bl: [-0.1, 0.9], fa: [2.45, 0.08], ba: [1.0, 0.8] };
  var HANG = { y: 1.78, lean: -0.08, head: 0.0, fl: [0.42, 0.55], bl: [0.12, 0.35], fa: [2.95, 0.02], ba: [0.35, 0.5] };

  function mixPose(a, b, t) {
    var o = {};
    ['x', 'y', 'lean', 'head'].forEach(function (k) { o[k] = lerp(a[k], b[k], t); });
    ['fl', 'bl', 'fa', 'ba'].forEach(function (k) { o[k] = [lerp(a[k][0], b[k][0], t), lerp(a[k][1], b[k][1], t)]; });
    return o;
  }
  function withX(p, x) { var o = JSON.parse(JSON.stringify(p)); o.x = x; return o; }

  // İleri kinematik
  function joints(p) {
    var hip = { x: p.x, y: p.y };
    var neck = { x: hip.x + sin(p.lean) * L.torso, y: hip.y + cos(p.lean) * L.torso };
    var head = { x: neck.x + sin(p.lean + p.head) * (L.neck + L.head), y: neck.y + cos(p.lean + p.head) * (L.neck + L.head) };
    var sh = { x: neck.x - sin(p.lean) * 0.05, y: neck.y - cos(p.lean) * 0.05 };
    function arm(a) { var e = pt(sh, a[0], L.ua), h = pt(e, a[0] + a[1], L.fa); return [sh, e, h]; }
    function leg(a) {
      var k = pt(hip, a[0], L.th), an = pt(k, a[0] - a[1], L.sh);
      var ft = pt(an, a[0] - a[1] + PI / 2 - 0.15, L.foot);
      return [hip, k, an, ft];
    }
    return { hip: hip, neck: neck, head: head, fa: arm(p.fa), ba: arm(p.ba), fl: leg(p.fl), bl: leg(p.bl) };
  }

  // Zaman çizelgesi: p (0..1) -> poz + top
  var RUN_END = 0.52, GATH_END = 0.6, FLY_END = 0.78, SLAM_END = 0.84;
  var STRIDES = 6.5 * 2 * PI;
  function sceneAt(p) {
    var pose, ball, phase;
    if (p < RUN_END) {
      var q = p / RUN_END, ph = q * STRIDES;
      pose = runPose(ph, 0.4 + q * 5.9);
      var J = joints(pose), hand = J.fa[2];
      var tri = Math.abs(cos(ph));
      ball = { x: hand.x + 0.12, y: BALL_R + (hand.y - 0.1 - BALL_R) * Math.pow(tri, 0.8) };
      phase = 1;
    } else if (p < GATH_END) {
      var q2 = ease((p - RUN_END) / (GATH_END - RUN_END));
      var r = runPose(STRIDES, 6.3);
      pose = mixPose(r, withX(GATHER, 6.95), q2);
      var J2 = joints(pose);
      ball = { x: lerp(J2.fa[2].x + 0.12, (J2.fa[2].x + J2.ba[2].x) / 2 + 0.1, q2), y: lerp(BALL_R + 0.3, (J2.fa[2].y + J2.ba[2].y) / 2, easeOut(q2)) };
      phase = 2;
    } else if (p < FLY_END) {
      var q3 = (p - GATH_END) / (FLY_END - GATH_END);
      pose = mixPose(withX(GATHER, 6.95), withX(FLY, 8.0), ease(q3));
      pose.y = lerp(GATHER.y, FLY.y, Math.sin(q3 * PI / 2));
      var J3 = joints(pose);
      ball = { x: J3.fa[2].x + 0.06, y: J3.fa[2].y + 0.1 };
      phase = 2;
    } else if (p < SLAM_END) {
      var q4 = ease((p - FLY_END) / (SLAM_END - FLY_END));
      pose = mixPose(withX(FLY, 8.0), withX(SLAM, 8.22), q4);
      var J4 = joints(pose);
      var bx = J4.fa[2].x + 0.06, by = J4.fa[2].y + 0.1;
      ball = { x: lerp(bx, RIM.x, q4), y: lerp(by, RIM.y - 0.05, q4) };
      phase = 3;
    } else {
      var q5 = (p - SLAM_END) / (1 - SLAM_END);
      pose = mixPose(withX(SLAM, 8.22), withX(HANG, 8.2), easeOut(clamp(q5 * 2.2, 0, 1)));
      // eli çembere kilitle
      var J5 = joints(pose), tx = RIM.x - RIM.r * 0.7, ty = RIM.y + 0.04;
      var dx = tx - J5.fa[0].x, dy = ty - J5.fa[0].y;
      var lock = clamp(q5 * 3, 0, 1);
      pose.fa = [lerp(pose.fa[0], Math.atan2(dx, -dy), lock), lerp(pose.fa[1], 0.02, lock)];
      // salınım
      var sw = Math.exp(-q5 * 5) * sin(q5 * 22) * 0.12;
      pose.fl[0] += sw; pose.bl[0] += sw * 0.8; pose.lean += sw * 0.3;
      // top: fileden düşer, sekerek yuvarlanır
      var t = q5 * 2.4, fallY;
      var h0 = RIM.y - 0.12, g = 9.8;
      var t1 = Math.sqrt(2 * (h0 - BALL_R) / g);
      if (t < t1) fallY = h0 - 0.5 * g * t * t;
      else { var tb = t - t1, v = Math.sqrt(2 * g * (h0 - BALL_R)) * 0.55, tt = tb % (2 * v / g * 0.9 + 0.001); fallY = BALL_R + Math.max(0, v * tt - 0.5 * g * tt * tt) * Math.exp(-tb * 1.2); }
      ball = { x: RIM.x - 0.05 - Math.max(0, t - t1) * 0.55, y: fallY };
      phase = 4;
    }
    return { pose: pose, ball: ball, phase: phase };
  }

  /* ---------- ÇİZİM ---------- */
  var W, H, DPR, S, camX, floorY, last = -1, target = 0, cur = 0;
  var shake = 0, sparks = [], slammed = false, lastT = performance.now();
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  }
  function view(px) {
    var aspect = W / H;
    var vw = clamp(5.0 * aspect, 4.4, 8.2);
    S = Math.min(W / vw, H / 4.7);
    vw = W / S;
    floorY = H * 0.86;
    var cx = clamp(px + vw * 0.18, vw / 2 - 0.3, 10.1 - vw / 2);
    camX = cx - vw / 2;
  }
  var X = function (x) { return (x - camX) * S; };
  var Y = function (y) { return floorY - y * S; };

  function seg(a, b, w) { ctx.lineWidth = w * S; ctx.beginPath(); ctx.moveTo(X(a.x), Y(a.y)); ctx.lineTo(X(b.x), Y(b.y)); ctx.stroke(); }

  // Konik uzuv (kapsül) çizimi
  function cap(a, b, w1, w2, grow) {
    var ax = X(a.x), ay = Y(a.y), bx = X(b.x), by = Y(b.y);
    var r1 = (w1 / 2 + grow) * S, r2 = (w2 / 2 + grow) * S, an = Math.atan2(by - ay, bx - ax);
    ctx.beginPath();
    ctx.arc(ax, ay, r1, an + PI / 2, an - PI / 2);
    ctx.arc(bx, by, r2, an - PI / 2, an + PI / 2);
    ctx.closePath(); ctx.fill();
  }
  function circ(c, r, grow) { ctx.beginPath(); ctx.arc(X(c.x), Y(c.y), (r + grow) * S, 0, PI * 2); ctx.fill(); }
  function poly(pts, grow) {
    // basit büyütme: merkezden dışa it
    var cx = 0, cy = 0; pts.forEach(function (q) { cx += q.x; cy += q.y; }); cx /= pts.length; cy /= pts.length;
    ctx.beginPath();
    pts.forEach(function (q, i) {
      var dx = q.x - cx, dy = q.y - cy, d = Math.hypot(dx, dy) || 1, k = (d + grow) / d;
      var x = X(cx + dx * k), y = Y(cy + dy * k);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.closePath(); ctx.fill();
  }
  var mid = function (a, b, t) { return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) }; };

  function parts(p) {
    var J = joints(p), lean = p.lean, nx = cos(lean), ny = -sin(lean);
    var torso = [
      { x: J.hip.x - nx * 0.12, y: J.hip.y - ny * 0.12 }, { x: J.hip.x + nx * 0.13, y: J.hip.y + ny * 0.13 },
      { x: J.neck.x + nx * 0.14 - sin(lean) * 0.04, y: J.neck.y + ny * 0.14 - cos(lean) * 0.04 },
      { x: J.neck.x + nx * 0.05, y: J.neck.y + ny * 0.05 },
      { x: J.neck.x - nx * 0.15, y: J.neck.y - ny * 0.15 - 0.0 }
    ];
    function arm(A) { return [[A[0], A[1], 0.115, 0.085], [A[1], A[2], 0.085, 0.062]]; }
    function leg(G) { return [[G[0], G[1], 0.215, 0.13], [G[1], mid(G[1], G[2], 0.35), 0.13, 0.135], [mid(G[1], G[2], 0.35), G[2], 0.135, 0.075]]; }
    return { J: J, torso: torso, ba: arm(J.ba), fa: arm(J.fa), bl: leg(J.bl), fl: leg(J.fl) };
  }

  function silhouette(P, grow) {
    P.ba.concat(P.bl, P.fl, P.fa).forEach(function (c) { cap(c[0], c[1], c[2], c[3], grow); });
    [P.J.ba[2], P.J.fa[2]].forEach(function (h) { circ(h, 0.04, grow); });
    [P.J.bl, P.J.fl].forEach(function (G) { cap(G[2], G[3], 0.11, 0.1, grow); });
    poly(P.torso, grow);
    cap(P.J.neck, P.J.head, 0.11, 0.1, grow);
    circ(P.J.head, L.head, grow);
  }

  function drawPlayer(p, mode) {
    var P = parts(p), J = P.J;
    if (mode === 'ghost' || mode === 'refl') { silhouette(P, mode === 'ghost' ? 0.01 : 0); return J; }

    // 1) dış parıltı
    ctx.save();
    ctx.fillStyle = 'rgba(43,227,111,.9)'; ctx.shadowColor = 'rgba(43,227,111,.8)'; ctx.shadowBlur = 0.3 * S;
    silhouette(P, 0.012);
    ctx.restore();

    var OUT = 0.011;
    function part(caps, fill, rim) {
      ctx.fillStyle = rim; caps.forEach(function (c) { cap(c[0], c[1], c[2], c[3], OUT); });
      ctx.fillStyle = fill; caps.forEach(function (c) { cap(c[0], c[1], c[2], c[3], 0); });
    }
    function shoe(G, fill, rim) {
      var heel = mid(G[2], G[3], -0.15);
      ctx.fillStyle = rim; cap(heel, G[3], 0.12, 0.1, OUT);
      ctx.fillStyle = fill; cap(heel, G[3], 0.12, 0.1, 0);
      ctx.fillStyle = '#0b0f0c'; cap(mid(heel, G[3], 0.05), mid(heel, G[3], 1), 0.03, 0.03, 0);
      ctx.fillStyle = '#00af43'; cap(mid(heel, G[3], 0.25), mid(heel, G[3], 0.7), 0.025, 0.018, 0);
    }
    function sock(G, c) { ctx.fillStyle = c; cap(mid(G[1], G[2], 0.7), G[2], 0.1, 0.085, 0.004); }
    function shorts(G, c) { ctx.fillStyle = c; cap(G[0], mid(G[0], G[1], 0.55), 0.27, 0.22, 0); ctx.fillStyle = 'rgba(255,255,255,.85)'; cap(mid(G[0], G[1], 0.05), mid(G[0], G[1], 0.5), 0.025, 0.025, 0); }

    // 2) arka kol + arka bacak (koyu, derinlik için)
    part(P.ba, '#070a08', '#1fa653');
    ctx.fillStyle = '#070a08'; circ(J.ba[2], 0.04, 0);
    part(P.bl, '#070a08', '#1fa653');
    sock(J.bl, '#c9cecb'); shoe(J.bl, '#c9cecb', '#1fa653');
    shorts(J.bl, '#00752d');

    // 3) gövde + forma
    ctx.fillStyle = '#2be36f'; poly(P.torso, OUT);
    var g = ctx.createLinearGradient(X(J.hip.x - 0.2), 0, X(J.hip.x + 0.25), 0);
    g.addColorStop(0, '#006b29'); g.addColorStop(0.5, '#00a33f'); g.addColorStop(1, '#22d061');
    ctx.fillStyle = g; poly(P.torso, 0);
    // yaka ve kol oyuğu biyesi
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.022 * S; ctx.lineCap = 'round';
    var t = P.torso;
    ctx.beginPath(); ctx.moveTo(X(t[2].x), Y(t[2].y)); ctx.quadraticCurveTo(X(t[3].x), Y(t[3].y - 0.08), X(t[4].x), Y(t[4].y)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X(t[2].x), Y(t[2].y)); ctx.quadraticCurveTo(X(lerp(t[2].x, t[1].x, 0.3) - 0.06), Y(lerp(t[2].y, t[1].y, 0.3)), X(lerp(t[2].x, t[1].x, 0.45)), Y(lerp(t[2].y, t[1].y, 0.45))); ctx.stroke();
    // numara
    ctx.save();
    var mx = lerp(J.hip.x, J.neck.x, 0.55), my = lerp(J.hip.y, J.neck.y, 0.55);
    ctx.translate(X(mx), Y(my)); ctx.rotate(p.lean);
    ctx.fillStyle = '#fff'; ctx.font = 'italic 900 extra-condensed ' + Math.round(0.19 * S) + 'px Archivo, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('14', 0.01 * S, 0);
    ctx.restore();

    // 4) boyun + baş + saç
    part([[J.neck, J.head, 0.11, 0.1]], '#0d120f', '#2be36f');
    ctx.fillStyle = '#2be36f'; circ(J.head, L.head, OUT);
    ctx.fillStyle = '#0d120f'; circ(J.head, L.head, 0);
    ctx.save();
    ctx.beginPath(); ctx.arc(X(J.head.x), Y(J.head.y), (L.head + 0.02) * S, 0, PI * 2); ctx.clip();
    ctx.fillStyle = '#030403';
    var hb = p.lean + p.head;
    ctx.beginPath(); ctx.arc(X(J.head.x - sin(hb) * 0.035 - cos(hb) * 0.02), Y(J.head.y + cos(hb) * 0.035 - sin(hb) * 0.02), L.head * S * 1.02, 0, PI * 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#0d120f'; circ({ x: J.head.x + sin(hb + 1.3) * 0.06, y: J.head.y - cos(hb + 1.3) * 0.06 }, 0.06, 0);

    // 5) ön bacak
    part(P.fl, '#121a15', '#2be36f');
    sock(J.fl, '#ffffff'); shoe(J.fl, '#ffffff', '#2be36f');
    shorts(J.fl, '#00a33f');

    // 6) ön kol + bileklik
    part(P.fa, '#121a15', '#2be36f');
    ctx.fillStyle = '#2be36f'; circ(J.fa[2], 0.042, OUT);
    ctx.fillStyle = '#121a15'; circ(J.fa[2], 0.042, 0);
    ctx.fillStyle = '#fff'; cap(mid(J.fa[1], J.fa[2], 0.68), mid(J.fa[1], J.fa[2], 0.85), 0.075, 0.07, 0);
    return J;
  }

  function drawBall(b, rot) {
    var x = X(b.x), y = Y(b.y), r = BALL_R * S;
    var g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, '#ffa461'); g.addColorStop(0.5, '#ef6a1d'); g.addColorStop(1, '#8e3304');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, PI * 2); ctx.clip();
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.strokeStyle = 'rgba(20,8,2,.85)'; ctx.lineWidth = Math.max(1, r * 0.09);
    ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.moveTo(0, -r); ctx.lineTo(0, r); ctx.stroke();
    ctx.beginPath(); ctx.arc(-r * 1.25, 0, r * 0.95, -0.9, 0.9); ctx.stroke();
    ctx.beginPath(); ctx.arc(r * 1.25, 0, r * 0.95, PI - 0.9, PI + 0.9); ctx.stroke();
    ctx.restore();
  }

  function drawHoop(front, flex, netSwish) {
    var rx = RIM.x, ry = RIM.y - flex;
    if (!front) {
      // direk ve kol
      ctx.strokeStyle = '#1b221e'; ctx.lineCap = 'butt';
      seg({ x: 9.75, y: 0 }, { x: 9.75, y: 3.3 }, 0.16);
      seg({ x: 9.75, y: 3.25 }, { x: BOARD.x + 0.05, y: 3.45 }, 0.1);
      // pano (perspektif)
      ctx.lineCap = 'round';
      var bx = X(BOARD.x), by0 = Y(BOARD.y0), by1 = Y(BOARD.y1), d = 0.55 * S;
      ctx.fillStyle = 'rgba(255,255,255,.06)';
      ctx.beginPath(); ctx.moveTo(bx, by0); ctx.lineTo(bx, by1); ctx.lineTo(bx - d * 0.35, by1 + d * 0.12); ctx.lineTo(bx - d * 0.35, by0 + d * 0.12); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = Math.max(1.5, 0.03 * S); ctx.stroke();
      ctx.strokeStyle = 'rgba(43,227,111,.9)'; ctx.lineWidth = Math.max(1.2, 0.02 * S);
      ctx.strokeRect(bx - d * 0.27, Y(3.42), d * 0.18, (3.42 - 3.1) * S * 0.9);
      // çember bağlantısı
      ctx.strokeStyle = '#c7470f'; seg({ x: BOARD.x - 0.02, y: 3.08 }, { x: rx + RIM.r, y: ry }, 0.04);
      // çemberin arka yarısı
      ctx.strokeStyle = '#b8400d'; ctx.lineWidth = 0.04 * S;
      ctx.beginPath(); ctx.ellipse(X(rx), Y(ry), RIM.r * S, RIM.r * S * 0.26, 0, PI, PI * 2); ctx.stroke();
    } else {
      // file
      ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = Math.max(1, 0.012 * S);
      var n = 7, top = Y(ry), bot = Y(ry - 0.42 - netSwish * 0.12);
      for (var i = 0; i <= n; i++) {
        var u = i / n, a = PI * u;
        var x0 = X(rx) - cos(a) * RIM.r * S, x1 = X(rx) - cos(a) * RIM.r * S * 0.55 + sin(netSwish * 9 + i) * netSwish * 6;
        ctx.beginPath(); ctx.moveTo(x0, top + sin(a) * RIM.r * S * 0.26); ctx.lineTo(x1, bot); ctx.stroke();
      }
      for (var k = 1; k <= 3; k++) {
        var t = k / 4, yy = lerp(top, bot, t), rr = RIM.r * S * lerp(1, 0.55, t);
        ctx.beginPath(); ctx.ellipse(X(rx), yy, rr, rr * 0.22, 0, 0, PI); ctx.stroke();
      }
      // çemberin ön yarısı
      ctx.strokeStyle = '#ef5a12'; ctx.lineWidth = 0.045 * S;
      ctx.beginPath(); ctx.ellipse(X(rx), Y(ry), RIM.r * S, RIM.r * S * 0.26, 0, 0, PI); ctx.stroke();
    }
  }

  function drawFloor() {
    var g = ctx.createLinearGradient(0, floorY, 0, H);
    g.addColorStop(0, 'rgba(43,227,111,.10)'); g.addColorStop(1, 'rgba(5,6,7,0)');
    ctx.fillStyle = g; ctx.fillRect(0, floorY, W, H - floorY);
    ctx.strokeStyle = 'rgba(43,227,111,.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, floorY); ctx.lineTo(W, floorY); ctx.stroke();
    // boya alanı ve üçlük çizgisi işaretleri
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2;
    [[5.8, 0], [3.0, 0]].forEach(function (m) {
      ctx.beginPath(); ctx.moveTo(X(m[0]), floorY); ctx.lineTo(X(m[0]) - 0.25 * S, floorY + 0.35 * S); ctx.stroke();
    });
  }

  function drawStreaks(p, speed) {
    var n = 26;
    for (var i = 0; i < n; i++) {
      var r1 = (i * 0.618) % 1, r2 = (i * 0.377) % 1;
      var y = Y(0.4 + r2 * 3.6);
      var len = (60 + r1 * 220) * (0.4 + speed);
      var x = ((r1 * W * 1.5 - p * W * (3 + r2 * 4)) % (W * 1.5) + W * 1.5) % (W * 1.5) - W * 0.25;
      var g = ctx.createLinearGradient(x, 0, x + len, 0);
      var c = i % 3 === 0 ? '77,64,255' : '43,227,111';
      g.addColorStop(0, 'rgba(' + c + ',0)'); g.addColorStop(1, 'rgba(' + c + ',' + (0.12 + speed * 0.3) + ')');
      ctx.strokeStyle = g; ctx.lineWidth = 1 + r2 * 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
    }
  }

  function render(p, dt) {
    var sc = sceneAt(p);
    var J0 = joints(sc.pose);
    view(sc.pose.x);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (shake > 0.01 && !reduce) { ctx.translate((Math.random() - 0.5) * shake * 18, (Math.random() - 0.5) * shake * 18); }

    var speed = p < FLY_END ? 0.6 + (p > RUN_END ? 0.4 : 0) : Math.max(0, 1 - (p - FLY_END) * 6);
    drawStreaks(p, speed);

    // spot ışığı
    var sx = X(RIM.x), spot = ctx.createRadialGradient(sx, Y(3.4), 10, sx, Y(2), 4.2 * S);
    spot.addColorStop(0, 'rgba(255,255,255,' + (0.1 + (sc.phase >= 3 ? 0.1 : 0)) + ')'); spot.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = spot; ctx.fillRect(0, 0, W, H);

    drawFloor();
    var flex = sc.phase === 4 ? Math.exp(-((p - SLAM_END) / (1 - SLAM_END)) * 6) * 0.09 : (sc.phase === 3 ? 0.04 : 0);
    var swish = sc.phase === 4 ? Math.exp(-((p - SLAM_END) / (1 - SLAM_END)) * 4) : 0;
    drawHoop(false, flex, swish);

    // yansıma
    ctx.save();
    ctx.translate(0, floorY * 2); ctx.scale(1, -1);
    ctx.globalAlpha = 0.12; ctx.fillStyle = '#2be36f';
    drawPlayer(sc.pose, 'refl');
    ctx.restore();

    // gölge
    var shw = clamp(1 - sc.pose.y / 3, 0.25, 1);
    ctx.fillStyle = 'rgba(0,0,0,' + 0.55 * shw + ')';
    ctx.beginPath(); ctx.ellipse(X(sc.pose.x + 0.05), floorY + 3, 0.5 * S * shw, 0.07 * S, 0, 0, PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.beginPath(); ctx.ellipse(X(sc.ball.x), floorY + 2, BALL_R * S * clamp(1.4 - sc.ball.y / 2, 0.3, 1.2), 0.025 * S, 0, 0, PI * 2); ctx.fill();

    // hız izleri (hayalet pozlar)
    if (!reduce) {
      for (var k = 4; k >= 1; k--) {
        var gp = clamp(p - k * 0.0075 * (0.4 + speed), 0, 1);
        var gs = sceneAt(gp);
        ctx.globalAlpha = 0.07 * (5 - k) * (0.3 + speed);
        ctx.fillStyle = k % 2 ? '#2be36f' : '#4d40ff';
        drawPlayer(gs.pose, 'ghost');
      }
      ctx.globalAlpha = 1;
    }

    // oyuncu (kenar ışığı ile)
    var ballBehind = sc.phase === 4;
    if (ballBehind) drawBall(sc.ball, p * 60);
    drawPlayer(sc.pose, 'main');
    if (!ballBehind) drawBall(sc.ball, p * 60);
    drawHoop(true, flex, swish);

    // kıvılcımlar
    if (sparks.length) {
      for (var i = sparks.length - 1; i >= 0; i--) {
        var q = sparks[i]; q.vy -= 9 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt;
        if (q.life <= 0) { sparks.splice(i, 1); continue; }
        ctx.globalAlpha = clamp(q.life, 0, 1);
        ctx.fillStyle = q.c; ctx.beginPath(); ctx.arc(X(q.x), Y(q.y), q.s * S, 0, PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // smaç flaşı
    if (shake > 0.01) {
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.fillStyle = 'rgba(43,227,111,' + shake * 0.18 + ')'; ctx.fillRect(0, 0, W, H);
    }
    return sc;
  }

  function burst() {
    if (reduce) return;
    shake = 1;
    var cols = ['#2be36f', '#ffffff', '#00af43', '#4d40ff', '#f26a1b'];
    for (var i = 0; i < 70; i++) {
      var a = Math.random() * PI * 2, v = 1.5 + Math.random() * 4.5;
      sparks.push({ x: RIM.x, y: RIM.y, vx: cos(a) * v, vy: sin(a) * v + 2, life: 0.7 + Math.random() * 0.8, s: 0.012 + Math.random() * 0.025, c: cols[i % cols.length] });
    }
  }

  var visible = false;
  function progress() {
    var r = sec.getBoundingClientRect();
    return clamp(-r.top / Math.max(1, r.height - window.innerHeight), 0, 1);
  }
  function loop(now) {
    var dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    if (visible && !sec.classList.contains('is-3d')) {
      target = progress();
      cur = reduce ? target : lerp(cur, target, 0.14);
      if (Math.abs(cur - target) < 0.0004) cur = target;
      if (!slammed && cur >= SLAM_END - 0.01) { slammed = true; burst(); }
      if (slammed && cur < FLY_END) slammed = false;
      shake *= 0.9;
      if (cur !== last || sparks.length || shake > 0.01) {
        var sc = render(cur, dt);
        sec.setAttribute('data-phase', sc.phase);
        if (bar) bar.style.transform = 'scaleX(' + cur + ')';
        last = cur;
      }
    }
    requestAnimationFrame(loop);
  }
  resize();
  window.addEventListener('resize', function () { resize(); last = -1; });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { last = -1; });
  new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) last = -1; }).observe(sec);
  requestAnimationFrame(loop);
})();
