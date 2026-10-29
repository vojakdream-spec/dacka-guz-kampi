/* =========================================================
   DİJİTAL AKREDİTASYON · Instagram hikâyesi (1080×1920) üretici
   ========================================================= */
(function () {
  'use strict';
  var box = document.getElementById('storyGen');
  if (!box) return;
  var nameIn = document.getElementById('sgName'), noIn = document.getElementById('sgNo');
  var makeBtn = document.getElementById('sgMake'), prev = document.getElementById('sgPrev');
  var img = document.getElementById('sgImg'), dl = document.getElementById('sgDl'), shareBtn = document.getElementById('sgShare');
  var form = document.getElementById('regForm');
  var W = 1080, H = 1920, lastBlob = null, lastUrl = null;

  function up(s) { return (s || '').toLocaleUpperCase('tr-TR'); }
  function loadImg(src) {
    return new Promise(function (res) { var i = new Image(); i.onload = function () { res(i); }; i.onerror = function () { res(null); }; i.src = src; });
  }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function fit(c, text, font, size, maxW, min) { var s = size; do { c.font = font.replace('{s}', s); if (c.measureText(text).width <= maxW) break; s -= 4; } while (s > min); return s; }

  // form ile karşılıklı eşitleme
  function syncFromForm() { if (form && document.activeElement !== nameIn) nameIn.value = form.sporcu.value; if (form && document.activeElement !== noIn) noIn.value = form.numara.value; }
  if (form) {
    form.sporcu.addEventListener('input', syncFromForm); form.numara.addEventListener('input', syncFromForm);
    nameIn.addEventListener('input', function () { form.sporcu.value = nameIn.value; form.sporcu.dispatchEvent(new Event('input', { bubbles: true })); });
    noIn.addEventListener('input', function () { noIn.value = noIn.value.replace(/\D/g, '').slice(0, 2); form.numara.value = noIn.value; form.numara.dispatchEvent(new Event('input', { bubbles: true })); });
  }

  async function draw() {
    var parts = nameIn.value.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) { nameIn.focus(); nameIn.closest('.sg-field').classList.add('is-err'); return null; }
    nameIn.closest('.sg-field').classList.remove('is-err');
    var last = up(parts.length > 1 ? parts[parts.length - 1] : parts[0]);
    var first = parts.length > 1 ? up(parts.slice(0, -1).join(' ')) : '';
    var init = up(parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : ''));
    var no = noIn.value === '' ? '14' : String(Math.min(99, parseInt(noIn.value, 10) || 0));

    if (document.fonts) {
      await Promise.all([
        document.fonts.load('italic 900 100px Archivo'), document.fonts.load('900 100px Archivo'),
        document.fonts.load('700 30px "JetBrains Mono"'), document.fonts.load('700 30px Satoshi')
      ]).catch(function () {});
    }
    var crest = await loadImg('assets/img/dsk-arma.svg'), pace = await loadImg('assets/img/pace-beyaz.svg'), paceDark = await loadImg('assets/img/pace-mavi.svg');

    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var c = cv.getContext('2d');
    var D = 'italic 900 extra-condensed {s}px Archivo, Impact, sans-serif';
    var M = '700 {s}px "JetBrains Mono", monospace';

    // zemin
    var bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#04110a'); bg.addColorStop(0.55, '#050607'); bg.addColorStop(1, '#0a0a2a');
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    var gl = c.createRadialGradient(880, 420, 20, 880, 420, 760); gl.addColorStop(0, 'rgba(43,227,111,.38)'); gl.addColorStop(1, 'rgba(43,227,111,0)');
    c.fillStyle = gl; c.fillRect(0, 0, W, H);
    var gb = c.createRadialGradient(120, 1700, 20, 120, 1700, 700); gb.addColorStop(0, 'rgba(77,64,255,.35)'); gb.addColorStop(1, 'rgba(77,64,255,0)');
    c.fillStyle = gb; c.fillRect(0, 0, W, H);
    // ışık izleri
    var seed = 1914; function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var i = 0; i < 70; i++) {
      var y = rnd() * H, x = rnd() * W * 1.2 - 100, len = 120 + rnd() * 420, blue = rnd() > 0.7;
      var lg = c.createLinearGradient(x, 0, x + len, 0);
      lg.addColorStop(0, blue ? 'rgba(77,64,255,0)' : 'rgba(43,227,111,0)'); lg.addColorStop(1, blue ? 'rgba(77,64,255,.55)' : 'rgba(43,227,111,.5)');
      c.strokeStyle = lg; c.lineWidth = 1 + rnd() * 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x + len, y - len * 0.08); c.stroke();
    }
    // saha çizgileri
    c.strokeStyle = 'rgba(255,255,255,.06)'; c.lineWidth = 3;
    c.beginPath(); c.arc(W / 2, 1980, 460, Math.PI, 0); c.stroke();
    c.beginPath(); c.arc(W / 2, 1980, 180, Math.PI, 0); c.stroke();

    // üst bant: logolar
    if (crest) c.drawImage(crest, 80, 86, 120, 120);
    c.fillStyle = 'rgba(255,255,255,.5)'; c.font = '600 44px Satoshi, sans-serif'; c.fillText('×', 222, 162);
    if (pace) c.drawImage(pace, 272, 90, 170, 115);
    c.textAlign = 'right'; c.fillStyle = '#2be36f'; c.font = M.replace('{s}', 26); c.fillText('GÜZ KAMPI 2026', W - 80, 130);
    c.fillStyle = 'rgba(255,255,255,.6)'; c.fillText('16–20 KASIM', W - 80, 172); c.textAlign = 'left';

    // askı ipi
    var cx = W / 2;
    var strap = c.createLinearGradient(cx - 40, 0, cx + 40, 0); strap.addColorStop(0, '#007a2f'); strap.addColorStop(0.5, '#2be36f'); strap.addColorStop(1, '#007a2f');
    c.fillStyle = strap; c.fillRect(cx - 38, 230, 76, 150);
    c.save(); c.translate(cx + 12, 236); c.rotate(Math.PI / 2); c.fillStyle = '#050607'; c.font = D.replace('{s}', 30); c.fillText('DAÇKA ✦ DAÇKA', 0, 0); c.restore();
    var clip = c.createLinearGradient(cx - 36, 0, cx + 36, 0); clip.addColorStop(0, '#8b9290'); clip.addColorStop(0.45, '#eef2f0'); clip.addColorStop(1, '#6c7371');
    c.fillStyle = clip; rr(c, cx - 36, 368, 72, 74, 14); c.fill();

    // kart
    var kx = 150, ky = 430, kw = W - 300, kh = 1040;
    c.save();
    c.shadowColor = 'rgba(43,227,111,.45)'; c.shadowBlur = 80;
    rr(c, kx, ky, kw, kh, 54); c.fillStyle = '#060807'; c.fill();
    c.restore();
    c.save(); rr(c, kx, ky, kw, kh, 54); c.clip();
    // kart başlığı
    var hg = c.createLinearGradient(kx, ky, kx + kw, ky + 260); hg.addColorStop(0, '#2be36f'); hg.addColorStop(0.45, '#00af43'); hg.addColorStop(1, '#00692a');
    c.fillStyle = hg; c.fillRect(kx, ky, kw, 250);
    c.strokeStyle = 'rgba(255,255,255,.13)'; c.lineWidth = 5;
    for (var s = -300; s < kw + 300; s += 40) { c.beginPath(); c.moveTo(kx + s, ky + 250); c.lineTo(kx + s + 140, ky); c.stroke(); }
    c.fillStyle = '#f2f0e8'; rr(c, cx - 70, ky + 26, 140, 26, 13); c.fill();
    if (crest) c.drawImage(crest, kx + 50, ky + 80, 96, 96);
    c.fillStyle = 'rgba(5,6,7,.6)'; c.font = '600 36px Satoshi, sans-serif'; c.fillText('×', kx + 166, ky + 142);
    if (paceDark) { c.save(); c.filter = 'brightness(0)'; c.drawImage(paceDark, kx + 206, ky + 86, 130, 88); c.restore(); }
    c.fillStyle = '#050607'; c.font = M.replace('{s}', 24); c.fillText('SPORCU AKREDİTASYONU', kx + 50, ky + 222);
    // gövde dokusu
    var bd = c.createRadialGradient(kx + kw, ky + 250, 10, kx + kw, ky + 250, 700); bd.addColorStop(0, 'rgba(43,227,111,.22)'); bd.addColorStop(1, 'rgba(43,227,111,0)');
    c.fillStyle = bd; c.fillRect(kx, ky + 250, kw, kh - 250);
    var bb = c.createRadialGradient(kx, ky + kh, 10, kx, ky + kh, 600); bb.addColorStop(0, 'rgba(30,15,200,.35)'); bb.addColorStop(1, 'rgba(30,15,200,0)');
    c.fillStyle = bb; c.fillRect(kx, ky + 250, kw, kh - 250);
    // büyük numara
    c.textAlign = 'right'; c.font = D.replace('{s}', 300); c.lineWidth = 4; c.strokeStyle = 'rgba(43,227,111,.55)';
    c.strokeText(no, kx + kw - 46, ky + 560); c.textAlign = 'left';
    // avatar
    c.fillStyle = '#101a14'; rr(c, kx + 50, ky + 300, 190, 190, 46); c.fill();
    c.strokeStyle = 'rgba(43,227,111,.7)'; c.lineWidth = 4; rr(c, kx + 50, ky + 300, 190, 190, 46); c.stroke();
    c.fillStyle = '#2be36f'; c.textAlign = 'center'; fit(c, init, D, 96, 160, 40); c.fillText(init, kx + 145, ky + 432); c.textAlign = 'left';
    // rol
    c.fillStyle = '#2be36f'; c.beginPath(); c.arc(kx + 62, ky + 586, 9, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,.65)'; c.font = M.replace('{s}', 24); c.fillText("SPORCU · GÜZ KAMPI '26", kx + 84, ky + 594);
    // isim
    c.fillStyle = 'rgba(255,255,255,.8)'; fit(c, first || ' ', '800 {s}px Satoshi, sans-serif', 42, kw - 100, 26); if (first) c.fillText(first, kx + 50, ky + 676);
    c.fillStyle = '#fff'; fit(c, last, D, 150, kw - 100, 60); c.fillText(last, kx + 50, ky + (first ? 820 : 780));
    // meta
    c.strokeStyle = 'rgba(255,255,255,.2)'; c.setLineDash([10, 10]); c.lineWidth = 2; c.beginPath(); c.moveTo(kx + 50, ky + 870); c.lineTo(kx + kw - 50, ky + 870); c.stroke(); c.setLineDash([]);
    var meta = [['TARİH', '16–20 KASIM'], ['SAAT', '08:30–18:00'], ['NO', no]];
    var cols = [0, 0.44, 0.86];
    meta.forEach(function (m, k) {
      var mx = kx + 50 + cols[k] * (kw - 100);
      c.fillStyle = 'rgba(255,255,255,.5)'; c.font = M.replace('{s}', 20); c.fillText(m[0], mx, ky + 916);
      c.fillStyle = '#fff'; c.font = '800 32px Satoshi, sans-serif'; c.fillText(m[1], mx, ky + 958);
    });
    // hologram mühür
    var hx = kx + kw - 120, hy = ky + 680, hr = 68;
    var holo = c.createConicGradient ? c.createConicGradient(0.6, hx, hy) : c.createLinearGradient(hx - hr, hy - hr, hx + hr, hy + hr);
    ['#2be36f', '#4dd7ff', '#4d40ff', '#ff5bd6', '#ffd34d', '#2be36f'].forEach(function (col, k, a) { holo.addColorStop(k / (a.length - 1), col); });
    c.globalAlpha = 0.9; c.fillStyle = holo; c.beginPath(); c.arc(hx, hy, hr, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    if (crest) { c.globalAlpha = 0.45; c.drawImage(crest, hx - 52, hy - 52, 104, 104); c.globalAlpha = 1; }
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 3; c.beginPath(); c.arc(hx, hy, hr, 0, Math.PI * 2); c.stroke();
    // alt şerit
    c.fillStyle = '#f2f0e8'; c.fillRect(kx, ky + kh - 70, kw, 70);
    c.fillStyle = '#050607'; c.font = D.replace('{s}', 40); c.fillText('16–20 KASIM 2026', kx + 50, ky + kh - 22);
    seed = 2026; var bx = kx + kw - 280;
    while (bx < kx + kw - 50) { var bw = 2 + Math.floor(rnd() * 6); if (rnd() > 0.35) c.fillRect(bx, ky + kh - 58, bw, 46); bx += bw + 3; }
    c.restore();
    c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 2; rr(c, kx, ky, kw, kh, 54); c.stroke();

    // slogan
    c.textAlign = 'center';
    c.fillStyle = '#fff'; fit(c, 'DAÇKA VARSA', D, 150, W - 140, 80); c.fillText('DAÇKA VARSA', cx, 1640);
    c.lineWidth = 4; c.strokeStyle = '#2be36f'; fit(c, 'GELİŞİM BAŞKA!', D, 150, W - 140, 80); c.strokeText('GELİŞİM BAŞKA!', cx, 1780);
    c.fillStyle = 'rgba(255,255,255,.6)'; c.font = M.replace('{s}', 24); c.fillText('#DaçkaVarsaGelişimBaşka  #GüzKampı  @darussafakabasketbol', cx, 1856);
    c.textAlign = 'left';

    return new Promise(function (res) { cv.toBlob(function (b) { res(b); }, 'image/png'); });
  }

  makeBtn.addEventListener('click', async function () {
    makeBtn.disabled = true; makeBtn.classList.add('is-busy');
    try {
      var blob = await draw();
      if (!blob) return;
      lastBlob = blob;
      if (lastUrl) URL.revokeObjectURL(lastUrl);
      lastUrl = URL.createObjectURL(blob);
      img.src = lastUrl;
      var soy = up(nameIn.value.trim().split(/\s+/).pop() || 'sporcu').replace(/[^A-ZÇĞİÖŞÜ0-9]/g, '');
      dl.href = lastUrl; dl.download = 'dsk-guz-kampi-akreditasyon-' + soy.toLowerCase() + '.png';
      prev.hidden = false;
      var f = new File([blob], dl.download, { type: 'image/png' });
      shareBtn.hidden = !(navigator.canShare && navigator.canShare({ files: [f] }));
      prev.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } finally { makeBtn.disabled = false; makeBtn.classList.remove('is-busy'); }
  });
  shareBtn.addEventListener('click', function () {
    if (!lastBlob) return;
    var f = new File([lastBlob], dl.download, { type: 'image/png' });
    navigator.share({ files: [f], title: 'Güz Kampı 2026 · Dijital Akreditasyon', text: 'Daçka varsa gelişim başka! #GüzKampı' }).catch(function () {});
  });
})();
