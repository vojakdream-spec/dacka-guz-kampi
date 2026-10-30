# Güz Kampı 2026 sitesi — çalışma notları

Darüşşafaka Spor Kulübü × Pace Academy Basketbol Güz Kampı (16–20 Kasım 2026) tanıtım + online kayıt sitesi.
**Kullanıcıyla her zaman Türkçe yaz.**

## Yayın
- Statik site: `index.html` + `assets/` (derleme yok).
- GitHub Pages: depo `vojakdream-spec/dacka-guz-kampi`, dal `main`. `git push` → 1–2 dk'da canlı.
- Alan adı: `darussafakaguzkampı.online` (punycode `xn--darussafakaguzkamp-v0c.online`), GoDaddy. `CNAME` dosyasını silme.
  DNS: A @ → 185.199.108/109/110/111.153, CNAME www → vojakdream-spec.github.io. HTTPS otomatik.
- Commit'leri kullanıcı adına at: `git -c user.name="vojakdream-spec" -c user.email="vojakdream@yandex.com" commit ...`

## Yerel önizleme
- `python3 -m http.server 5173 --bind 127.0.0.1` (bu klasörde, Bash'ten arka planda) → `.claude/launch.json` buna bağlanır.
- Test parametreleri: `?nolenis` (yumuşak kaydırma kapalı), `?debug` (smaç sahnesi: `window.__dunk(0..1)`), `?og` (paylaşım görseli çekimi; `assets/img/og-kapak.jpg` headless Chrome ile 1200×630 alınır).

## Yapı
- `assets/js/main.js` tüm etkileşimler + kayıt sihirbazı (WhatsApp'a hazır mesaj), `hero-gl.js` giriş WebGL ışıkları,
  `dunk3d.js` three.js smaç sahnesi (sahneye yaklaşınca yüklenir), `dunk.js` 2B yedek, `story.js` 1080×1920 dijital akreditasyon.
- 3D: Quaternius UBC gövde + UAL animasyonları (CC0) `assets/3d/`. Top fotoğrafı CC BY-SA 3.0 (künyesi KVKK penceresinde, kaldırma).
- Telefon/WhatsApp: 0542 399 1914. Hazır mesaj: "Merhaba, Güz Kampı 2026 hakkında bilgi almak istiyorum."

## Kullanıcının kuralları
- Türkçe harf çakışması/kırpılması (İ/Ü noktası, Ş/Ç çengeli) KESİNLİKLE olmasın; çok satırlı büyük başlıklarda satır aralığı ≥ 1.12.
- Her değişiklikten sonra telefon (390px) ve masaüstü (1440px) çakışma/taşma taraması yap, sonra yayına al.
- Tema: koyu; giriş ve smaç sahnesi koyu, içerik bölümleri açık zemin (`.light-zone`). Gece/gündüz düğmesi istenmedi.
- Sade, göz yormayan metin. Pace Academy'nin görsellerini kullanma; görselleri kendin üret.
- Program saati 08:30–16:00; 16:00–18:00 opsiyonel (ikindi öğünü + sinema). Forma bedeni ve hediye bilgisi yok.

## Performans kuralları (kaydırma 60 FPS — 2026-10-30 ölçüldü)
- Sabit (fixed) ya da kaydırmayla hareket eden öğelerde `backdrop-filter`, `mix-blend-mode`, `filter: drop-shadow/blur` KULLANMA (her karede yeniden çizilir, takılma yapar).
- Kaydırma kodunda her karede `getBoundingClientRect`/`offsetTop` okuma; konumlar `measure()` ile önbelleğe alınır (main.js `G`).
- Sürekli dönen döngüler (kart sallanması vb.) durunca uyumalı; ekran dışı animasyonlar durdurulur.
- 3D kurulum (`dunk3d.js`) parçalara bölünmüş, kaydırma sürerken çalışmaz (`idleYield`), sahneye yaklaşınca acil moda geçer.
- Ölçüm: headless Chrome + gerçek GPU (Metal) ile otomatik kaydırma; telefonda 390×844, DPR 3, CPU 4× yavaşlatma. Hedef: p95 = 17 ms, 50 ms üstü takılma yok.
