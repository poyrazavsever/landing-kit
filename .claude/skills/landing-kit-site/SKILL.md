---
name: landing-kit-site
description: Turn a static landing page into a dynamic landing-kit page for a freelancer's customer - add data-lk attributes and the snippet, create the site and owner with site:create, configure domains/theme, deploy (Docker or node + Caddy), and generate the customer's PDF guide. Use when working in the landing-kit repo or when a freelancer asks to connect a page to landing-kit.
---

# Statik sayfayı landing-kit sayfasına çevirmek

Kullanıcı bir freelancer. Elinde statik bir landing sayfası (çoğu zaman Claude'un yazdığı tek bir `index.html`) ve bir müşteri (restoran, berber, dükkân…) var. Amaç: menü/fiyat/kampanya/iletişim bilgilerini esnafın panelden güncelleyebildiği, iletişim formu çalışan bir sayfa.

Kullanıcıyla Türkçe konuş. Kodda, komutlarda ve özellik adlarında aşağıdaki isimleri **birebir** kullan.

## 1. Sayfayı işaretle

Snippet'i `</body>` öncesine ekle (API adresi: landing-kit sunucusunun `PUBLIC_URL`'i):

```html
<script src="https://api.ornek.com/landing-kit.js" data-site="berber-ahmet" defer></script>
```

İsteğe bağlı: `data-api="https://..."` API adresini script adresinden farklı yapar.

| Ne                | Nasıl                                                                                                                                                                                                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Metin alanları    | `data-lk="name", "phone", "whatsapp", "email", "address", "hoursNote"` → `textContent` dolar. Değer boşsa statik metin kalır.                                                                                                                                                 |
| Çalışma saatleri  | `data-lk="hours"`. `<ul>/<ol>` ise `<li>` listesi, değilse `<br>` ile satırlar. Aynı saatli ardışık günler gruplanır ("Pazartesi–Cuma: 09:00–19:00").                                                                                                                         |
| Linkler           | `data-lk-href="phone"` (tel:), `"whatsapp"` (wa.me, 0'la başlayan TR numarası 90'a çevrilir), `"email"` (mailto:), `"maps"` (adresle Google Haritalar).                                                                                                                       |
| Listeler          | Kapsayıcıda `data-lk-list="<bölüm>"` + içinde `<template>`. Template içinde `data-lk-field="title", "description", "price", "image"`. `price` ₺ ile TR biçiminde yazılır; `image` bir `<img>`'de `src` olur (göreli yollar API adresine çevrilir). Boş alanlar `hidden` olur. |
| Liste seçenekleri | `data-lk-limit="3"`, `data-lk-empty="Şu an kampanya yok."`                                                                                                                                                                                                                    |
| Form              | `<form data-lk-form="contact" novalidate>` alanlar: `name`_, `phone`, `email`, `message`_, `kvkk`* (checkbox). Telefon veya e-posta zorunlu. Honeypot alanı (`website`) snippet tarafından eklenir.                                                                           |
| Form metinleri    | `data-lk-success`, `data-lk-error`, `data-lk-sending`. Durum `<p class="lk-status lk-success (ya da lk-error, lk-sending)">` olarak eklenir; CSS'ini sayfaya yaz.                                                                                                             |
| Durum sınıfları   | `<html>`'e `lk-ready` (yüklendi) ya da `lk-offline` (API'ye ulaşılamadı; statik içerik kalır). Olaylar: `lk:loaded`, `lk:error`, `lk:list`, `lk:sent`.                                                                                                                        |

Kurallar:

- Liste kapsayıcısında `<template>` dışındaki her şey (statik yedek kartlar) API cevabı gelince silinir. Başlıkları kapsayıcının **dışına** koy.
- Bölüm adları veridir: `menu`, `services`, `products`, `campaigns`, `gallery`, `faq` ya da küçük harf/rakam/`-`/`_` ile yeni bir ad. Yeni bölüm için kod gerekmez.
- KVKK kutusu sunucuda da zorunlu; yanında aydınlatma metnine link olsun (`docs/kvkk.md` şablonu).
- Sıfırdan sayfa yazdırılacaksa `prompts/claude-landing.md` içindeki şablonları kullan.

## 2. Müşteriyi oluştur

```bash
npm run site:create -- --slug berber-ahmet --name "Berber Ahmet" --email sahibi@ornek.com \
  --domains berberahmet.com --collections services,campaigns \
  --phone "0555 123 45 67" --whatsapp "0555 123 45 67" \
  --primary "#111827" --secondary "#D4A373" --font "Segoe UI" --logo ./logo.png
```

- Çıktıda panel adresi, kullanıcı adı ve **bir kez gösterilen geçici şifre** var; işletme sahibi ilk girişte kendi şifresini belirler.
- `--domains` olmadan form başka alan adından çalışmaz (CORS izin listesi). `berberahmet.com` yazmak `https://berberahmet.com` ve `https://www.berberahmet.com`'u kapsar; yerel test için `http://localhost:5500` gibi tam origin ekle.
- Sonradan değişiklik: `npm run site:update -- --slug berber-ahmet --domains berberahmet.com,http://localhost:5500 --primary "#0F766E"`.
- Komut sonunda PDF rehber otomatik üretilir (`--no-guide` ile atlanır).
- Freelancer'ın tüm siteleri gören hesabı: `npm run admin:create -- --email ben@ornek.com`.
- Şifresini unutan işletme: `npm run user:reset -- --email sahibi@ornek.com` (açık oturumları da kapatır).

## 3. Yayına al

Docker (önerilen):

```bash
cp .env.example .env   # PUBLIC_URL, SESSION_SECRET (32+ karakter), SMTP_*, TRUST_PROXY=1 ...
docker compose up -d
docker compose exec -u node landing-kit npm run site:create -- --slug ... --name "..." --email ...
```

Docker'sız: Node 22+, `npm ci && npm run build && npm prune --omit=dev` (yönetim paneli derlenir), `npx playwright install --with-deps --only-shell chromium` (PDF için), `deploy/landing-kit.service` (systemd) ve `deploy/Caddyfile` (otomatik HTTPS). Statik sayfa herhangi bir statik hostta durabilir; sadece snippet'in `src`'si landing-kit sunucusunu gösterir.

Kontrol listesi:

1. `curl https://api.ornek.com/healthz` → `{"ok":true}`
2. Sayfayı aç: `<html>` `lk-ready` sınıfını almalı (tarayıcı konsolunda `document.documentElement.className`).
3. Formu gerçekten doldur; panelde **Mesajlar**'da görünmeli, SMTP/Telegram ayarlıysa bildirim gelmeli.
4. Panelden bir fiyatı değiştir, sayfayı yenile.

## 4. Müşteriye teslim

```bash
npm run guide:pdf -- --slug berber-ahmet
```

`data/guides/berber-ahmet-admin-rehberi.pdf`: müşterinin logosu/renkleri/fontu, panel adresi, kullanıcı adı, QR kod, adım adım kullanım ve `.env`'deki `SUPPORT_NAME/PHONE/EMAIL`. Şifre PDF'te yazmaz; ayrı kanaldan ilet.

## 5. Bakım

- Yedek: `npm run backup` (çalışırken güvenli; `--out` ve `--keep 14` destekli). Cron örneği README'de.
- Yeni bildirim kanalı: `src/notify/<kanal>.js` (`name`, `isEnabled`, `send`).
- Şema değişikliği: `src/db/migrations/00X_*.sql` ekle, eski dosyayı değiştirme.

Gelir ya da performans vaadi içeren metin yazma; müşteriye söylenecekleri gerçek verilere dayandır.
