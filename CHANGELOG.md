# Changelog

Bu projedeki önemli değişiklikler bu dosyada tutulur. Biçim [Keep a Changelog](https://keepachangelog.com/tr-TR/1.1.0/) temellidir, sürümler [Semantic Versioning](https://semver.org/lang/tr/) izler.

All notable changes to this project are documented here.

## [0.2.0] - 2026-11-22

### Değişti / Changed

- **Yönetim paneli yeniden yazıldı:** React + Vite + Tailwind + shadcn/ui. Mobil öncelikli alt menü, anahtarla gizle/göster, sürükleyerek sıralama (dokunma, fare, klavye), önizlemeli fotoğraf yükleme, yükleniyor/boş/hata durumları, bildirimler (sonner) ve silmeden önce onay penceresi. Admin API değişmedi.
- **Siteye özel tema shadcn değişkenlerine eşlendi:** ana renk, ikinci renk, logo ve başlık fontu çalışma anında `--primary`, `--accent`, `--ring`, `--brand-2`, `--font-heading` değişkenlerine yazılır; kontrast otomatik düzeltilir.
- **Gömülü yazı tipleri:** Inter, Bricolage Grotesque ve Playfair Display panele ve PDF rehbere gömülü (harici font servisi yok, Türkçe karakterler tam).
- **Yeni landing-kit markası:** "lk + canlı nokta" işareti, Bricolage Grotesque wordmark, yeni palet (`#2F54EB`, `#C6F432`, `#0E1525`). Varsayılan panel teması ve PDF yedek markası güncellendi.
- Panel artık derlenerek gelir: `npm run build` (Docker imajında ve CI'da otomatik).
- Snippet: boş şablon alanları, sayfa CSS'i `display` verse bile gizli kalır.

### Eklendi / Added

- **En İyi Etler** örnek işletmesi (hayali ızgara/et lokantası): marka kiti (logo SVG + PNG, palet, tipografi, marka sesi, Higgsfield ile üretilmiş görseller ve kaynak notları), tek sayfalık site, `seed:demo` verisi ve markalı panel. README ekran görüntüleri ve örnek PDF (`docs/samples/en-iyi-etler-admin-rehberi.pdf`) bu örnekle yenilendi.
- Playwright ile uçtan uca test (`npm run test:e2e`) ve CI'da ayrı e2e işi.

## [0.1.0] - 2026-11-22

İlk açık kaynak sürüm. / First public release.

### Eklendi / Added

- Express + SQLite backend; düz SQL migration'lar ve küçük bir migration çalıştırıcı.
- Public API: `GET /api/sites/:slug`, `GET /api/sites/:slug/items?collection=`, `POST /api/sites/:slug/contact`.
- Oturumlu admin API: kayıt ekle/düzenle/gizle/sırala, görsel yükleme, mesaj kutusu, işletme bilgileri ve çalışma saatleri; sahip yalnızca kendi sitesini görür, süper yönetici hepsini.
- Mobil öncelikli, siteye özel temalı yönetim paneli (`/admin/<slug>`).
- Bağımlılıksız istemci snippet'i `landing-kit.js` (minify ~5,5 KB).
- E-posta (SMTP) ve Telegram bildirimleri; dosya tabanlı kanal genişletme noktası.
- Güvenlik: helmet, site başına CORS izin listesi, hız sınırları, honeypot, bcrypt, CSRF, güvenli oturum çerezi, sunucu tarafı KVKK onayı, yükleme kontrolleri.
- Komutlar: `site:create`, `site:update`, `admin:create`, `user:reset`, `backup`, `guide:pdf`, `seed:demo`.
- Müşterinin markasıyla PDF yönetim rehberi (QR kod, panel adresi, destek bilgisi).
- Örnek sayfalar (restoran, berber, dükkân), Claude prompt şablonları ve iki Claude skill'i.
- Dockerfile, docker-compose, Caddy ve systemd örnekleri; `/healthz`.
- Belgeler: README (TR + EN), yönetim rehberi, stil rehberi, KVKK aydınlatma metni şablonu.
- `node --test` testleri ve GitHub Actions CI.

[0.2.0]: https://github.com/poyrazavsever/landing-kit/releases/tag/v0.2.0
[0.1.0]: https://github.com/poyrazavsever/landing-kit/releases/tag/v0.1.0
