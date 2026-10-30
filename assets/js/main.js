/* =========================================================
   DARÜŞŞAFAKA × PACE ACADEMY · GÜZ KAMPI 2026
   ========================================================= */
var CONFIG = {
  whatsapp: '905423991914',               // WhatsApp numarası (ülke koduyla, boşluksuz)
  campStart: '2026-11-16T08:30:00+03:00', // Geri sayım hedefi
  sheetsEndpoint: ''                      // İsteğe bağlı: Google Apps Script web app URL'si (boşsa yalnızca WhatsApp)
};

(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var body = document.body, root = document.documentElement;
  var vh = window.innerHeight, vw = window.innerWidth;

  /* ---------- YUMUŞAK KAYDIRMA (Lenis, yalnız masaüstü) ---------- */
  var lenis = null;
  if (fine && !reduce && window.Lenis && location.search.indexOf('nolenis') < 0) {
    lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true, anchors: { offset: -84 } });
    root.classList.add('has-lenis');
  }
  function scrollToY(y) { if (lenis) lenis.scrollTo(y, { duration: 1.1 }); else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' }); }

  /* ---------- SPLIT TEXT ---------- */
  $$('[data-split]').forEach(function (el) {
    var txt = el.textContent, i = 0;
    el.setAttribute('aria-label', txt);
    // harfler kelime kelime gruplanır: kelime ortasında satır kırılmaz
    el.innerHTML = txt.split(' ').map(function (w) {
      return '<span class="wd">' + w.split('').map(function (c) {
        return '<span class="ch" aria-hidden="true" style="--i:' + (i++) + '">' + c + '</span>';
      }).join('') + '</span>';
    }).join('<span class="sp"> </span>');
  });

  /* ---------- HERO COURT LINES ---------- */
  $$('.hero-court .draw').forEach(function (p) {
    try { p.style.setProperty('--len', Math.ceil(p.getTotalLength())); } catch (e) {}
  });

  /* ---------- PRELOADER ---------- */
  var pre = $('#preloader'), plNum = $('#plNum'), plBar = $('#plBar');
  function revealHero() {
    var hero = $('#hero');
    $$('[data-split]', hero).forEach(function (el, k) { el.style.setProperty('--base', (k * 160) + 'ms'); el.classList.add('in'); });
    $$('[data-reveal]', hero).forEach(function (el, k) { el.style.setProperty('--d', k + 2); el.classList.add('in'); });
  }
  function finishLoad() {
    pre.classList.add('is-done');
    body.classList.remove('is-loading');
    body.classList.add('is-loaded');
    revealHero();
    setTimeout(function () { pre.classList.add('is-gone'); }, 1400);
  }
  if (reduce || root.classList.contains('og-mode')) {
    plNum.textContent = '1914'; finishLoad();
  } else {
    var t0 = performance.now(), D = 1500;
    (function tick(now) {
      var p = clamp((now - t0) / D, 0, 1), e = 1 - Math.pow(1 - p, 4);
      plNum.textContent = String(Math.round(e * 1914)).padStart(4, '0');
      plBar.style.transform = 'scaleX(' + e + ')';
      if (p < 1) requestAnimationFrame(tick);
      else { pre.classList.add('is-slogan'); setTimeout(finishLoad, 750); }
    })(t0);
  }

  /* ---------- REVEAL ON VIEW ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
  $$('[data-reveal], [data-split]').forEach(function (el) { if (!el.closest('#hero')) io.observe(el); });

  /* ---------- COUNTERS ---------- */
  var cio = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      cio.unobserve(en.target);
      var el = en.target, to = +el.getAttribute('data-count'), tr = el.getAttribute('data-format') === 'tr';
      if (reduce) { el.textContent = tr ? to.toLocaleString('tr-TR') : to; return; }
      var s = performance.now(), d = to > 100 ? 2000 : 1200;
      (function step(now) {
        var p = clamp((now - s) / d, 0, 1), v = Math.round(to * (1 - Math.pow(1 - p, 3)));
        el.textContent = tr ? v.toLocaleString('tr-TR') : v;
        if (p < 1) requestAnimationFrame(step);
      })(s);
    });
  }, { threshold: 0.5 });
  $$('[data-count]').forEach(function (el) { if (!el.closest('#hero')) cio.observe(el); });

  /* ---------- COUNTDOWN ---------- */
  var target = new Date(CONFIG.campStart).getTime();
  var cd = { d: $$('[data-cd="d"]'), h: $$('[data-cd="h"]'), m: $$('[data-cd="m"]'), s: $$('[data-cd="s"]') };
  function pad(n) { return String(n).padStart(2, '0'); }
  function countdown() {
    var diff = Math.max(0, target - Date.now());
    var v = { d: Math.floor(diff / 864e5), h: Math.floor(diff / 36e5) % 24, m: Math.floor(diff / 6e4) % 60, s: Math.floor(diff / 1e3) % 60 };
    Object.keys(cd).forEach(function (k) { cd[k].forEach(function (el) { el.textContent = pad(v[k]); }); });
  }
  countdown(); setInterval(countdown, 1000);

  /* ---------- TEMA (gündüz/gece) ---------- */
  var themeBtn = $('#themeBtn');
  function setTheme(t, save) {
    root.classList.add('theme-anim');
    root.setAttribute('data-theme', t);
    var m = $('meta[name="theme-color"]'); if (m) m.content = t === 'light' ? '#f7f6f1' : '#050607';
    if (save) { try { localStorage.setItem('dsk-tema', t); } catch (e) {} }
    window.dispatchEvent(new CustomEvent('temadegisti', { detail: t }));
    setTimeout(function () { root.classList.remove('theme-anim'); }, 650);
  }
  if (false && themeBtn) themeBtn.addEventListener('click', function () { setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light', true); });

  /* ---------- MENU ---------- */
  var menuBtn = $('#menuBtn'), mnav = $('#mnav');
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
    mnav.setAttribute('aria-hidden', !open);
    body.style.overflow = open ? 'hidden' : '';
    if (lenis) { open ? lenis.stop() : lenis.start(); }
  }
  menuBtn.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
  $$('a', mnav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- SCRUB TEXT ---------- */
  var scrub = $('[data-scrub]'), words = [];
  if (scrub) {
    scrub.innerHTML = scrub.textContent.trim().split(/\s+/).map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
    words = $$('.w', scrub);
    if (reduce) words.forEach(function (w) { w.classList.add('on'); });
  }

  /* ---------- TIMELINE ---------- */
  var tl = $('#timeline'), tlFill = $('#tlFill'), tlBall = $('#tlBall'), tlItems = $$('.tl-item');
  var flowArc = $('#flowArc'), flowTime = $('#flowTime'), flowLabel = $('#flowLabel');

  /* ---------- DAYS (horizontal pin) ---------- */
  var days = $('#aktiviteler'), daysVp = $('#daysViewport'), daysTrack = $('#daysTrack'), daysIdx = $('#daysIdx'), daysBar = $('#daysBar');
  var pinned = false, travel = 0;
  function setupDays() {
    var want = vw >= 1000 && vh >= 600 && !reduce;
    pinned = want;
    days.classList.toggle('is-pinned', want);
    if (want) {
      travel = Math.max(0, daysTrack.scrollWidth - vw);
      days.style.height = (vh + travel) + 'px';
    } else {
      days.style.height = '';
      daysTrack.style.transform = '';
    }
  }
  function daysProgress(p) {
    daysBar.style.transform = 'scaleX(' + (0.2 + p * 0.8) + ')';
    daysIdx.textContent = '0' + clamp(Math.round(p * 4) + 1, 1, 5);
  }
  daysVp.addEventListener('scroll', function () {
    if (pinned) return;
    var max = daysVp.scrollWidth - daysVp.clientWidth;
    daysProgress(max > 0 ? daysVp.scrollLeft / max : 0);
  }, { passive: true });

  /* ---------- HEADER / PROGRESS / ACTIVE LINK ---------- */
  var hdr = $('#hdr'), bar = $('#progressBar'), wa = $('.wa-float'), dock = $('.dock');
  var navLinks = $$('.hdr-nav a'), sections = navLinks.map(function (a) { return $(a.getAttribute('href')); });
  var panther = $('.intro-panther');
  var lastY = window.scrollY, dirty = true;

  function onScroll() {
    var y = window.scrollY, docH = document.documentElement.scrollHeight - vh;
    bar.style.transform = 'scaleX(' + (docH > 0 ? y / docH : 0) + ')';
    var tick = parseFloat(getComputedStyle(root).getPropertyValue('--tick')) || 34;
    hdr.classList.toggle('is-scrolled', y > tick);
    if (!root.classList.contains('menu-open')) hdr.classList.toggle('is-hidden', y > lastY && y > vh * 0.9 && y - lastY > 2);
    if (y < lastY - 2) hdr.classList.remove('is-hidden');
    lastY = y;
    var show = y > vh * 0.6;
    wa.classList.toggle('is-show', show);
    dock.classList.toggle('is-show', show);

    // aktif menü
    var cur = -1;
    sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < vh * 0.4) cur = i; });
    navLinks.forEach(function (a, i) { a.classList.toggle('is-active', i === cur); });

    // scrub
    if (scrub && !reduce) {
      var r = scrub.getBoundingClientRect();
      var p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.3), 0, 1);
      var n = Math.round(p * words.length);
      for (var i = 0; i < words.length; i++) words[i].classList.toggle('on', i < n);
    }
    if (panther && !reduce) {
      var pr = panther.parentNode.getBoundingClientRect();
      var pp = clamp(-pr.top / (pr.height || 1), -1, 1);
      panther.style.transform = 'translateY(' + (pp * 120) + 'px) rotate(' + (pp * 25) + 'deg)';
    }

    // timeline
    if (tl) {
      var tr = tl.getBoundingClientRect();
      var tp = clamp((vh * 0.55 - tr.top) / tr.height, 0, 1);
      tlFill.style.transform = 'scaleY(' + tp + ')';
      tlBall.style.transform = 'translateY(' + (tp * (tr.height - 20)) + 'px) rotate(' + (tp * 900) + 'deg)';
      var active = null;
      tlItems.forEach(function (it) {
        var on = it.offsetTop + 30 < tp * tr.height + 10;
        it.classList.toggle('on', on);
        if (on) active = it;
      });
      if (flowArc) flowArc.style.strokeDashoffset = 553 * (1 - tp);
      if (active && flowTime) { flowTime.textContent = active.dataset.time; flowLabel.textContent = active.dataset.label; }
    }

    // days
    if (pinned) {
      var dr = days.getBoundingClientRect();
      var dp = clamp(-dr.top / (dr.height - vh), 0, 1);
      daysTrack.style.transform = 'translate3d(' + (-dp * travel) + 'px,0,0)';
      daysProgress(dp);
    }
  }
  window.addEventListener('scroll', function () { dirty = true; }, { passive: true });

  /* ---------- BANDS (scroll velocity marquee) ---------- */
  var bands = $$('.band-track').map(function (el) { return { el: el, dir: +el.dataset.dir || 1, x: 0, w: el.scrollWidth / 2 }; });
  var bandsOn = true;
  if ($('.bands')) new IntersectionObserver(function (en) { bandsOn = en[0].isIntersecting; }).observe($('.bands'));
  var vel = 0, prevY = window.scrollY;

  /* ---------- CURSOR ---------- */
  var cur = $('.cursor'), ring = $('.cursor-ring'), dot = $('.cursor-dot'), label = $('.cursor-label');
  var mx = vw / 2, my = vh / 2, rx = mx, ry = my;
  if (fine && cur) {
    window.addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; cur.classList.remove('is-hidden'); }, { passive: true });
    document.addEventListener('pointerleave', function () { cur.classList.add('is-hidden'); });
    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest('a, button, label, summary, [data-cursor], .pass');
      cur.classList.toggle('is-hover', !!t);
      var lb = t && t.getAttribute('data-cursor');
      cur.classList.toggle('is-label', !!lb);
      if (lb) label.textContent = lb;
    });
  }

  /* ---------- MAIN LOOP ---------- */
  (function loop(time) {
    if (lenis) lenis.raf(time || performance.now());
    var y = window.scrollY;
    vel = lerp(vel, y - prevY, 0.12); prevY = y;
    if (!reduce && bandsOn) {
      bands.forEach(function (b) {
        b.x -= (1.1 + Math.abs(vel) * 0.35) * b.dir;
        if (b.x <= -b.w) b.x += b.w;
        if (b.x > 0) b.x -= b.w;
        b.el.style.transform = 'translate3d(' + b.x + 'px,0,0) skewX(' + clamp(-vel * 0.25, -10, 10) + 'deg)';
      });
    }
    if (fine && cur) {
      rx = lerp(rx, mx, 0.18); ry = lerp(ry, my, 0.18);
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
    }
    if (dirty) { dirty = false; onScroll(); }
    requestAnimationFrame(loop);
  })();

  /* ---------- RESIZE ---------- */
  var rt;
  function onResize() {
    vh = window.innerHeight; vw = window.innerWidth;
    setupDays();
    bands.forEach(function (b) { b.w = b.el.scrollWidth / 2; });
    placeTokens();
    moveTabPill();
    dirty = true;
  }
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(onResize, 120); });
  window.addEventListener('load', onResize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);

  /* ---------- ROTATION WIDGET ---------- */
  var rot = $('#rot'), session = 0, rotTimer = null, rotPause = 0;
  var tokens = rot ? $$('.rot-tk', rot) : [], stations = rot ? $$('.rot-st', rot) : [], rotBtns = rot ? $$('.rot-ctrl button', rot) : [];
  function placeTokens() {
    if (!rot) return;
    var rr = rot.getBoundingClientRect();
    tokens.forEach(function (tk) {
      var g = +tk.dataset.g, st = stations[(g + session) % 3], slot = $('.rot-slot', st).getBoundingClientRect();
      tk.style.transform = 'translate(' + (slot.left - rr.left) + 'px,' + (slot.top - rr.top) + 'px)';
    });
    rotBtns.forEach(function (b, i) { b.classList.toggle('is-on', i === session); b.setAttribute('aria-selected', i === session); });
  }
  if (rot) {
    rotBtns.forEach(function (b, i) { b.addEventListener('click', function () { session = i; rotPause = Date.now() + 9000; placeTokens(); }); });
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting && !rotTimer && !reduce) {
        rotTimer = setInterval(function () { if (Date.now() < rotPause) return; session = (session + 1) % 3; placeTokens(); }, 2400);
      } else if (!en[0].isIntersecting && rotTimer) { clearInterval(rotTimer); rotTimer = null; }
    }).observe(rot);
  }

  /* ---------- TABS ---------- */
  var tabs = $$('.tabs [role="tab"]'), pill = $('.tabs-pill');
  function moveTabPill() {
    var sel = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0];
    if (!sel || !pill) return;
    pill.style.width = sel.offsetWidth + 'px';
    pill.style.transform = 'translateX(' + (sel.offsetLeft - 6) + 'px)';
  }
  function selectTab(t) {
    tabs.forEach(function (b) {
      var on = b === t, panel = document.getElementById(b.getAttribute('aria-controls'));
      b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1;
      panel.hidden = !on; panel.classList.toggle('is-on', on);
    });
    moveTabPill();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; selectTab(n); n.focus(); }
    });
  });
  moveTabPill();

  /* ---------- RADAR / PLAYER CARD ---------- */
  var radarVal = $('#radarVal'), radarBase = $('#radarBase'), pcOvr = $('#pcOvr');
  var D1 = [44, 40, 30, 36, 34, 48], D5 = [86, 83, 80, 84, 85, 92];
  function valsFor(day) { var t = (day - 1) / 4; return D1.map(function (a, i) { return lerp(a, D5[i], t); }); }
  function pts(v) { return v.map(function (r, i) { var a = (-90 + 60 * i) * Math.PI / 180; return (Math.cos(a) * r).toFixed(1) + ',' + (Math.sin(a) * r).toFixed(1); }).join(' '); }
  var curV = valsFor(1), anim = null;
  function setDay(day, instant) {
    var to = valsFor(day), from = curV.slice(), s = performance.now();
    $$('.pcard-days button').forEach(function (b) { b.classList.toggle('is-on', +b.dataset.day === day); });
    cancelAnimationFrame(anim);
    (function st(now) {
      var p = instant || reduce ? 1 : clamp((now - s) / 700, 0, 1), e = 1 - Math.pow(1 - p, 3);
      curV = from.map(function (f, i) { return lerp(f, to[i], e); });
      radarVal.setAttribute('points', pts(curV));
      pcOvr.textContent = Math.round(curV.reduce(function (a, b) { return a + b; }, 0) / 6 + 6);
      if (p < 1) anim = requestAnimationFrame(st);
    })(s);
  }
  if (radarVal) {
    radarBase.setAttribute('points', pts(D1));
    setDay(1, true);
    var played = false, autoT = [];
    $$('.pcard-days button').forEach(function (b) { b.addEventListener('click', function () { autoT.forEach(clearTimeout); setDay(+b.dataset.day); }); });
    new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting || played) return; played = true;
      [2, 3, 4, 5].forEach(function (d, k) { autoT.push(setTimeout(function () { setDay(d); }, 600 + k * 750)); });
    }, { threshold: 0.5 }).observe($('#pcard'));
  }

  /* ---------- TILT + SHINE ---------- */
  if (fine && !reduce) {
    $$('.tilt').forEach(function (el) {
      var max = el.id === 'ticket' ? 5 : el.id === 'pcard' ? 10 : 7;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.classList.add('is-tilting', 'tilt-on'); clearTimeout(el._tt);
        el.style.setProperty('--ry', ((x - 0.5) * max * 2).toFixed(2) + 'deg');
        el.style.setProperty('--rx', (-(y - 0.5) * max * 2).toFixed(2) + 'deg');
        el.style.setProperty('--mx', (x * 100) + '%'); el.style.setProperty('--my', (y * 100) + '%');
        el.style.setProperty('--sx', (100 - x * 100) + '%');
      });
      el.addEventListener('pointerleave', function () {
        el.classList.remove('is-tilting');
        el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg');
        el._tt = setTimeout(function () { el.classList.remove('tilt-on'); }, 650);
      });
    });
    $$('.magnetic').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.22) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.3) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- BARCODE ---------- */
  var bc = $('#barcode');
  if (bc) {
    var seed = 1914, x = 0, out = '';
    var rnd = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    while (x < 218) { var w = 1 + Math.floor(rnd() * 3.2); if (rnd() > 0.38) out += '<rect x="' + x + '" y="0" width="' + w + '" height="40"/>'; x += w + 1; }
    bc.innerHTML = out;
  }

  /* ---------- FAQ ACCORDION ---------- */
  $$('.acc details').forEach(function (d) {
    var sum = $('summary', d), b = $('.acc-b', d);
    sum.addEventListener('click', function (e) {
      if (reduce || !b.animate) return;
      e.preventDefault();
      if (d.open) {
        var a = b.animate([{ height: b.offsetHeight + 'px' }, { height: '0px' }], { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)' });
        a.onfinish = function () { d.open = false; };
      } else {
        d.open = true;
        var h = b.offsetHeight;
        b.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.16,1,.3,1)' });
      }
    });
  });

  /* ---------- KVKK ---------- */
  var kvkk = $('#kvkk');
  $$('[data-open-kvkk]').forEach(function (b) {
    b.addEventListener('click', function () { if (kvkk.showModal) kvkk.showModal(); else kvkk.setAttribute('open', ''); });
  });
  kvkk.addEventListener('click', function (e) { if (e.target === kvkk) kvkk.close(); });

  $('#yr').textContent = new Date().getFullYear();

  /* ---------- GÜN EKRANLARI (canlı sayaçlar) ---------- */
  var shot = $('[data-shotclock]'), score = $('[data-score]'), shots = $('[data-shots]');
  if (shot && !reduce) {
    var clockV = 24, scoreV = 18, shotN = 16;
    setInterval(function () { clockV = clockV <= 0 ? 24 : clockV - 1; shot.textContent = pad(clockV); }, 250);
    setInterval(function () { scoreV += Math.random() > 0.35 ? 2 : 3; if (scoreV > 60) scoreV = 18; score.textContent = scoreV; }, 2000);
    setInterval(function () { shotN = shotN >= 99 ? 1 : shotN + 1; if (shots) shots.textContent = String(shotN).padStart(4, '0'); }, 2600);
  }

  /* =========================================================
     KAYIT SİHİRBAZI + AKREDİTASYON KARTI
     ========================================================= */
  var form = $('#regForm'), steps = $$('.step', form), stepLis = $$('.steps li', form);
  var prevBtn = $('#prevBtn'), nextBtn = $('#nextBtn'), sendBtn = $('#sendBtn'), stepsBar = $('#stepsBar');
  var idx = 0;

  /* ---------- AKREDİTASYON KARTI ---------- */
  var pass = $('#pass'), rig = $('#passRig');
  var P = { num: $('#pNum'), init: $('#pInit'), first: $('#pFirst'), last: $('#pLast'), birth: $('#pBirth'), exp: $('#pExp'), size: $('#pSize') };
  var swing = { a: 0, v: 0, drag: false, sx: 0, sa: 0 };
  function trUpper(s) { return s.toLocaleUpperCase('tr-TR'); }
  function kick(f) { swing.v += f; }
  function fitLast() {
    P.last.style.fontSize = '';
    var max = P.last.clientWidth, fs = 52;
    while (P.last.scrollWidth > max + 1 && fs > 26) { fs -= 2; P.last.style.fontSize = fs + 'px'; }
  }
  function updatePass(k) {
    var parts = form.sporcu.value.trim().split(/\s+/).filter(Boolean);
    var last = parts.length > 1 ? parts[parts.length - 1] : (parts[0] || '');
    var first = parts.length > 1 ? parts.slice(0, -1).join(' ') : '';
    P.last.textContent = last ? trUpper(last) : 'SOYADIN';
    P.first.textContent = first ? trUpper(first) : (last ? '' : 'ADIN');
    P.init.textContent = parts.length ? trUpper(parts.map(function (w) { return w[0]; }).slice(0, 1).concat(parts.length > 1 ? [parts[parts.length - 1][0]] : []).join('')) : 'DSK';
    var n = form.numara.value === '' ? '14' : String(clamp(parseInt(form.numara.value, 10) || 0, 0, 99));
    if (P.num.textContent !== n) { P.num.textContent = n; P.num.classList.remove('pop'); void P.num.offsetWidth; P.num.classList.add('pop'); }
    P.birth.textContent = form.dogum.value ? fmtDate(form.dogum.value) : '—';
    var ex = form.querySelector('input[name="tecrube"]:checked');
    P.exp.textContent = ex ? ex.value : '—';
    P.size.textContent = n;
    fitLast();
    if (k) kick(k);
  }
  form.sporcu.addEventListener('input', function () { updatePass(0.6); });
  form.dogum.addEventListener('change', function () { updatePass(1.2); });
  form.numara.addEventListener('input', function () {
    if (this.value.length > 2) this.value = this.value.slice(0, 2);
    updatePass(1.6);
  });
  $$('input[name="tecrube"]', form).forEach(function (r) { r.addEventListener('change', function () { updatePass(1.4); }); });

  // barkod
  (function () {
    var seed = 2026, x = 0, out = '';
    var rnd = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    while (x < 88) { var w = 1 + Math.floor(rnd() * 2.6); if (rnd() > 0.35) out += '<rect x="' + x + '" y="0" width="' + w + '" height="34"/>'; x += w + 1; }
    $('#pCode').innerHTML = out;
  })();

  // sallanma fiziği (yay + sönüm), sürükleyerek sallanır
  pass.addEventListener('pointerdown', function (e) {
    swing.drag = true; swing.sx = e.clientX; swing.sa = swing.a;
    pass.setPointerCapture(e.pointerId);
  });
  pass.addEventListener('pointermove', function (e) {
    if (!swing.drag) return;
    var na = clamp(swing.sa + (e.clientX - swing.sx) * 0.12, -35, 35);
    swing.v = (na - swing.a) * 0.6; swing.a = na;
  });
  ['pointerup', 'pointercancel'].forEach(function (ev) { pass.addEventListener(ev, function () { swing.drag = false; }); });
  var passVisible = false;
  new IntersectionObserver(function (en) { passVisible = en[0].isIntersecting; if (passVisible) kick(2.2); }).observe(rig);
  (function swingLoop(now) {
    if (passVisible && !reduce) {
      if (!swing.drag) {
        var breeze = Math.sin(now / 1400) * 0.035;
        swing.v += (-swing.a * 0.045) + breeze;
        swing.v *= 0.94;
        swing.a += swing.v;
      }
      var ry = clamp(swing.v * 6, -25, 25);
      rig.style.transform = 'rotate(' + swing.a.toFixed(2) + 'deg)';
      pass.style.transform = 'rotateY(' + ry.toFixed(2) + 'deg)';
      pass.style.setProperty('--g', (60 - swing.a * 3 - ry * 2) + '%');
      pass.style.setProperty('--h', (swing.a * 8 + ry * 6) + 'deg');
    }
    requestAnimationFrame(swingLoop);
  })(performance.now());

  // telefon maskesi: 05xx xxx xx xx
  form.telefon.addEventListener('input', function () {
    var d = this.value.replace(/\D/g, '');
    if (d[0] === '5') d = '0' + d;
    if (d.indexOf('90') === 0 && d.length > 11) d = '0' + d.slice(2);
    d = d.slice(0, 11);
    var f = d.slice(0, 4);
    if (d.length > 4) f += ' ' + d.slice(4, 7);
    if (d.length > 7) f += ' ' + d.slice(7, 9);
    if (d.length > 9) f += ' ' + d.slice(9, 11);
    this.value = f;
  });

  function setErr(el, on) {
    var box = el.closest('.field, .choice') || el;
    box.classList.toggle('is-err', on);
    if (on) { box.classList.remove('is-shake'); void box.offsetWidth; box.classList.add('is-shake'); }
  }
  function validate(i) {
    var ok = true, first = null;
    function fail(el) { ok = false; setErr(el, true); if (!first) first = el; }
    if (i === 0) {
      if (form.sporcu.value.trim().length < 3) fail(form.sporcu); else setErr(form.sporcu, false);
      if (!form.dogum.value) fail(form.dogum); else setErr(form.dogum, false);
      var tc = $('.choice[data-name="tecrube"]', form);
      if (!form.querySelector('input[name="tecrube"]:checked')) { ok = false; tc.classList.add('is-err'); if (!first) first = tc; } else tc.classList.remove('is-err');
    }
    if (i === 1) {
      if (form.veli.value.trim().length < 3) fail(form.veli); else setErr(form.veli, false);
      var tel = form.telefon.value.replace(/\D/g, '');
      if (!/^05\d{9}$/.test(tel)) fail(form.telefon); else setErr(form.telefon, false);
      var em = form.eposta.value.trim();
      if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) fail(form.eposta); else setErr(form.eposta, false);
    }
    if (i === 2) {
      var ek = $('.err-kvkk', form);
      if (!form.kvkk.checked) { ok = false; ek.classList.add('is-show'); first = form.kvkk.closest('.check'); first.classList.remove('is-shake'); void first.offsetWidth; first.classList.add('is-shake'); }
      else ek.classList.remove('is-show');
    }
    if (first && first.focus && first.tagName !== 'DIV' && first.tagName !== 'LABEL') first.focus();
    return ok;
  }
  $$('input, textarea', form).forEach(function (el) {
    el.addEventListener('input', function () { var b = el.closest('.field, .choice'); if (b) b.classList.remove('is-err'); });
    el.addEventListener('change', function () { var b = el.closest('.choice'); if (b) b.classList.remove('is-err'); if (el.name === 'kvkk') $('.err-kvkk', form).classList.remove('is-show'); });
  });

  function fmtDate(v) { if (!v) return ''; var p = v.split('-'); return p[2] + '.' + p[1] + '.' + p[0]; }
  function data() {
    var g = function (n) { var el = form.querySelector('[name="' + n + '"]:checked') || form[n]; return el && el.value ? String(el.value).trim() : ''; };
    return {
      sporcu: g('sporcu'), dogum: fmtDate(form.dogum.value), okul: g('okul'), tecrube: g('tecrube'), numara: form.numara.value,
      veli: g('veli'), telefon: g('telefon'), eposta: g('eposta'), saglik: g('saglik'), not: g('not'),
      kvkk: form.kvkk.checked ? 'Evet' : 'Hayır', medya: form.medya.checked ? 'Evet' : 'Hayır'
    };
  }
  var LABELS = [['sporcu', 'Sporcu'], ['dogum', 'Doğum tarihi'], ['okul', 'Okul / Kulüp'], ['tecrube', 'Tecrübe'], ['numara', 'Forma no'], ['veli', 'Veli'], ['telefon', 'Telefon'], ['eposta', 'E-posta'], ['saglik', 'Sağlık notu'], ['not', 'Not']];
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function renderSummary() {
    var d = data();
    $('#summary').innerHTML = LABELS.filter(function (l) { return d[l[0]]; }).map(function (l) { return '<div><dt>' + l[1] + '</dt><dd>' + esc(d[l[0]]) + '</dd></div>'; }).join('');
  }
  function message() {
    var d = data(), L = ['Merhaba, Güz Kampı 2026 için ön kayıt yaptırmak istiyorum. 🏀', ''];
    var add = function (k, v) { if (v) L.push('*' + k + ':* ' + v); };
    add('Sporcu', d.sporcu); add('Doğum tarihi', d.dogum); add('Okul/Kulüp', d.okul); add('Tecrübe', d.tecrube); add('Forma numarası', d.numara);
    L.push('');
    add('Veli', d.veli); add('Telefon', d.telefon); add('E-posta', d.eposta); add('Sağlık/alerji notu', d.saglik); add('Not', d.not);
    L.push(''); L.push('KVKK onayı: ' + d.kvkk); L.push('Fotoğraf/video izni: ' + d.medya);
    return L.join('\n');
  }
  function waUrl() { return 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(message()); }

  function go(i, back) {
    idx = clamp(i, 0, steps.length - 1);
    steps.forEach(function (s, k) { s.classList.toggle('is-on', k === idx); s.classList.toggle('is-back', k === idx && !!back); });
    stepLis.forEach(function (li, k) { li.classList.toggle('is-on', k === idx); li.classList.toggle('is-done', k < idx); });
    stepsBar.style.transform = 'scaleX(' + ((idx + 1) / steps.length) + ')';
    prevBtn.hidden = idx === 0;
    nextBtn.hidden = idx === steps.length - 1;
    sendBtn.hidden = idx !== steps.length - 1;
    if (idx === 2) renderSummary();
    var top = form.getBoundingClientRect().top;
    if (top < 60 || top > vh * 0.6) scrollToY(window.scrollY + top - 90);
  }
  nextBtn.addEventListener('click', function () { if (validate(idx)) go(idx + 1); });
  prevBtn.addEventListener('click', function () { go(idx - 1, true); });
  form.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && idx < steps.length - 1) { e.preventDefault(); nextBtn.click(); }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.website.value) return; // spam
    if (!validate(0)) return go(0);
    if (!validate(1)) return go(1);
    if (!validate(2)) return;
    var url = waUrl();
    window.open(url, '_blank', 'noopener');
    if (CONFIG.sheetsEndpoint) {
      try {
        var d = data(); d.zaman = new Date().toLocaleString('tr-TR');
        fetch(CONFIG.sheetsEndpoint, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(d) });
      } catch (err) {}
    }
    $('#waAgain').href = url;
    form.hidden = true; $('#regDone').hidden = false;
    kick(4);
    confetti();
  });
  $('#regReset').addEventListener('click', function () {
    form.reset(); form.hidden = false; $('#regDone').hidden = true; updatePass(1); go(0);
  });

  /* ---------- CONFETTI ---------- */
  function confetti() {
    if (reduce) return;
    var c = $('#confetti'), x = c.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = vw * dpr; c.height = vh * dpr; x.scale(dpr, dpr);
    var cols = ['#2be36f', '#00af43', '#ffffff', '#1e0fc8', '#f26a1b', '#050607'];
    var P = []; for (var i = 0; i < 180; i++) {
      var fromLeft = i % 2 === 0;
      P.push({ x: fromLeft ? -10 : vw + 10, y: vh * (0.55 + Math.random() * 0.3), vx: (fromLeft ? 1 : -1) * (6 + Math.random() * 10), vy: -(10 + Math.random() * 12),
        w: 6 + Math.random() * 8, h: 8 + Math.random() * 12, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: cols[i % cols.length] });
    }
    var s = performance.now();
    (function f(now) {
      x.clearRect(0, 0, vw, vh);
      P.forEach(function (p) {
        p.vy += 0.38; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2))); x.restore();
      });
      if (now - s < 4200) requestAnimationFrame(f); else x.clearRect(0, 0, vw, vh);
    })(s);
  }

  setupDays();
  onScroll();
})();
