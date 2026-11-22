# landing-kit Stil Rehberi

landing-kit'in kendi markası, yönetim panelinin arayüz bileşenleri ve yazım dili. Panel her müşteride o müşterinin markasıyla görünür; bu rehber **varsayılanları** ve markanın nasıl **geçersiz kılındığını** anlatır.

_English summary at the end._

## 1. İsim kullanımı

- Doğru yazım: **landing-kit** (hep küçük harf, tireli). Cümle başında da küçük harf: "landing-kit bir backend'dir."
- Kod ve komutlarda: `landing-kit`, `landing-kit.js`, `data-lk-*` öneki (lk = landing-kit).
- Yanlış: ~~Landing Kit~~, ~~LandingKit~~, ~~landingkit~~, ~~LK~~ (kullanıcıya dönük metinde kısaltma yok).
- Müşterinin panelinde landing-kit adı görünmez; panel müşterinin adını ve logosunu taşır. landing-kit adı yalnızca freelancer'a dönük yerlerde (README, CLI çıktısı, varsayılan logo) geçer.

## 2. Logo

Dosyalar `brand/` klasöründe, hepsi temiz vektör (yazılar yola çevrilmiş, font gerektirmez):

| Dosya                                 | Kullanım                                               |
| ------------------------------------- | ------------------------------------------------------ |
| `brand/landing-kit-mark.svg`          | Kare işaret. Favicon, varsayılan panel logosu, avatar. |
| `brand/landing-kit-mark-512.png`      | İşaretin 512 px PNG'si (sosyal medya, GitHub avatarı). |
| `brand/landing-kit-wordmark.svg`      | İşaret + yazı, açık zemin. README başlığı, sunumlar.   |
| `brand/landing-kit-wordmark-dark.svg` | İşaret + yazı, koyu zemin.                             |

**Fikir:** Mavi karo üzerinde küçük harf **l** ve **k**. k'nin üst kolu sağ yukarıyı gösterir ve ucunda limon yeşili bir nokta vardır: statik sayfa "yayında", canlı. Çizgiler eşit kalınlıkta ve yuvarlak uçlu; bu yüzden 16 px'te bile okunur.

- Etrafında en az işaretin 1/4'ü kadar boşluk bırakın.
- En küçük boyut: işaret 16 px, yazılı logo 120 px genişlik.
- Logoyu esnetmeyin, döndürmeyin, gölge/efekt eklemeyin, renklerini değiştirmeyin. Limon yeşili nokta kaldırılmaz.
- Keşif aşamasında Higgsfield (Recraft V4.1 vektör) ile üç yön denendi; seçilen "lk + canlı ok" yönü elle, ızgaraya oturtularak yeniden çizildi.

## 3. Renk token'ları

| Token                              | Değer                     | Kullanım                                                                       |
| ---------------------------------- | ------------------------- | ------------------------------------------------------------------------------ |
| `--primary`                        | `#2F54EB` (Sinyal mavisi) | Ana düğme, aktif durum. Beyaz yazı ile 5,85:1.                                 |
| `--primary-foreground`             | `#FFFFFF`                 | Ana renk üstündeki yazı.                                                       |
| `--brand-2`                        | `#C6F432` (Canlı limon)   | "Yeni" rozeti, okunmamış mesaj vurgusu. Üstünde koyu yazı (`#0E1525`, 14,2:1). |
| `--accent` / `--accent-foreground` | `#EAEEFD` / `#2443C4`     | Simge zeminleri, bağlantılar, seçili sekme (6,8:1).                            |
| `--foreground`                     | `#0E1525` (Mürekkep)      | Metin.                                                                         |
| `--muted-foreground`               | `#545A68`                 | İkincil metin, ipuçları (zeminde 6,4:1).                                       |
| `--background`                     | `#F7F7F5` (Kâğıt)         | Sayfa zemini.                                                                  |
| `--card`                           | `#FFFFFF`                 | Kart zemini.                                                                   |
| `--border` / `--input`             | `#E1E3DD` / `#D6D9D2`     | Kenarlıklar.                                                                   |
| `--destructive`                    | `#C42B1C`                 | Hata, silme.                                                                   |
| `--success`                        | `#12805C`                 | Başarı.                                                                        |
| `--radius`                         | `0.875rem`                | Kart ve alan köşeleri.                                                         |

Kaynak: `admin/src/index.css` içindeki `:root` (shadcn/ui değişken adlarıyla).

## 4. Tipografi

- **Başlık:** Bricolage Grotesque (değişken, 600–800). Karakterli ama sade; "teknik abi" tonuna uyar.
- **Metin ve arayüz:** Inter (değişken, 400–600). Rakamlar fiyatlarda `tabular-nums`.
- İkisi de SIL OFL lisanslı ve **pakete gömülü** (`@fontsource-variable/*`, Vite ile birlikte paketlenir). Harici font servisi kullanılmaz; latin + latin-ext alt kümeleri sayesinde **ğ, ş, ı, İ, ç, ö, ü ve ₺** tam desteklenir.
- Gövde 16 px, satır yüksekliği 1,5–1,6. Başlıklar: ekran başlığı 28 px / kalın, kart başlığı 18 px. Ekran başına tek H1.
- Fiyatlar `Intl.NumberFormat('tr-TR')` ile: `₺150`, `₺1.249,50`.
- Müşteri teması için panelde ayrıca **Playfair Display** gömülüdür (ör. En İyi Etler).

## 5. Panel bileşenleri (shadcn/ui)

Panel React + Vite + Tailwind ile yazılır; bileşenler shadcn/ui kalıbındadır ve `admin/src/components/ui/` altında projenin içindedir (kopyala-yapıştır, harici bileşen kütüphanesi yok).

| Bileşen                 | Dosya                    | Kural                                                                                                                                                  |
| ----------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Button                  | `ui/button.jsx`          | Ekranda tek birincil eylem. Yükseklik 44–48 px. Varyantlar: default, outline, secondary, ghost, destructive, link.                                     |
| Input / Textarea        | `ui/input.jsx`           | 48 px yükseklik, 16 px yazı (iOS yakınlaştırma yapmaz). Hata: `aria-invalid` + kırmızı kenarlık.                                                       |
| Field                   | `components/common.jsx`  | Görünür etiket + alan + ipucu + hata; `aria-describedby` otomatik bağlanır.                                                                            |
| Card                    | `ui/card.jsx`            | 14 px köşe, ince kenarlık, yumuşak gölge.                                                                                                              |
| Badge                   | `ui/badge.jsx`           | "Sitede", "Gizli", "Yeni" (vurgu rengi).                                                                                                               |
| Switch                  | `ui/switch.jsx`          | Gizle/göster ve gün açık/kapalı. Her anahtarın erişilebilir adı vardır ("… sitede görünsün").                                                          |
| AlertDialog             | `ui/alert-dialog.jsx`    | Silmeden önce onay. Telefonda alttan açılan sayfa, büyük ekranda ortada pencere. Metin "geri alınamaz" der ve daha güvenli seçeneği (gizlemek) önerir. |
| Toaster (sonner)        | `ui/sonner.jsx`          | Üstte, kısa sonuç mesajı ("Kaydedildi."); hata kırmızı. Ekran okuyucuya okunur.                                                                        |
| Skeleton                | `ui/skeleton.jsx`        | Yüklenirken liste ve form iskeleti.                                                                                                                    |
| EmptyState / ErrorState | `components/common.jsx`  | Boş bölümde simge + açıklama + "İlk kaydı ekle"; hatada mesaj + "Tekrar dene".                                                                         |
| PhotoPicker             | `components/common.jsx`  | "Fotoğraf çek" (kamera) ve "Galeriden seç" ayrı; önizleme; yüklemeden önce 1600 px'e küçültme.                                                         |
| Sıralama                | `screens/Collection.jsx` | dnd-kit: tutamaçla sürükleme (dokunmada kısa basılı tutma), fare ve klavye (boşluk + oklar).                                                           |
| Alt menü                | `App.jsx`                | Ana sayfa · Mesajlar (okunmamış sayısı) · Bilgiler; form ekranlarında yerini sabit "Kaydet" çubuğuna bırakır.                                          |

**Erişilebilirlik:** Dokunma alanları en az 44 px. Odak halkası her zaman görünür (`--ring`). Renk tek başına anlam taşımaz (gizli kayıtta soluk görsel + "Gizli" rozeti). "İçeriğe geç" bağlantısı, `aria-current` ile seçili sekme, `prefers-reduced-motion` desteği. Kullanıcı içeriği React ile metin olarak basılır.

## 6. Yazım dili (Türkçe)

Panelin kullanıcısı esnaf: teknik değil, meşgul, telefonda, çoğu zaman tek elle.

- **"Siz" diliyle**, kısa ve sıcak: "Sitenizi güncellemek için giriş yapın."
- **Eylem fiille**: "Kaydet", "Ekle", "Fotoğraf çek", "Şifremi kaydet", "Evet, sil".
- **Jargon yok**: "koleksiyon" değil "bölüm", "item" değil "kayıt/ürün", "deaktif" değil "gizli", "upload" değil "yükle", "session" değil "giriş".
- **Sonucu söyleyin**: "Eklendi. Sitede görünüyor." / "Sıralama kaydedildi."
- **Hata mesajı = ne yapmalı**: "Fiyatı sadece rakamla yazın (ör. 150 veya 149,90)."
- **Geri alınamayan işlemde açık uyarı** ve daha güvenli alternatif.
- Ünlem ve emoji yok (tek istisna: "Merhaba!").

## 7. Siteye özel tema ("siteye özel")

Her müşterinin paneli kendi markasıyla açılır. `admin/src/lib/theme.js`, `sites` tablosundaki dört alanı çalışma anında shadcn CSS değişkenlerine eşler:

| Site alanı        | shadcn değişkenleri                                                                                     | Boşsa               |
| ----------------- | ------------------------------------------------------------------------------------------------------- | ------------------- |
| `color_primary`   | `--primary`, `--primary-foreground`, `--ring`, `--accent`, `--accent-foreground`, tarayıcı tema rengi   | `#2F54EB`           |
| `color_secondary` | `--brand-2`, `--brand-2-foreground` (rozetler, okunmamış vurgusu)                                       | `#C6F432`           |
| `font_family`     | `--font-heading` (başlıklar). Gömülü fontlardan biriyse o kullanılır, değilse cihazdaki aynı adlı font. | Bricolage Grotesque |
| `logo_path`       | Üst çubuk, giriş ekranı, favicon, PDF kapağı                                                            | landing-kit işareti |

**Kontrast güvencesi:**

- `--primary-foreground`, ana renk üzerinde beyaz ya da mürekkepten hangisi daha okunaklıysa o olur.
- `--accent` ana rengin %90 açık tonudur; `--accent-foreground` bu zeminde 4,5:1'e ulaşana kadar koyulaştırılır. Müşteri açık sarı bir marka rengi seçse bile bağlantılar ve sekmeler okunur kalır.
- Gövde metni her zaman Inter'dir; müşteri fontu sadece başlıklarda kullanılır, böylece okunabilirlik korunur.

Ayarlama: `npm run site:create -- ... --primary "#B3261E" --secondary "#C8A24A" --font "Playfair Display" --logo ./logo.svg` ya da sonradan `npm run site:update`. Süper yönetici panelde **Bilgiler → Tema ve teknik ayarlar** bölümünden de değiştirebilir; işletme sahibi temayı değiştiremez.

PDF rehber (`npm run guide:pdf`) aynı alanları kullanır: kapak ana renkte, başlık çizgileri ikinci renkte; Inter ve (gömülüyse) müşterinin başlık fontu PDF'e gömülür.

**Örnek:** En İyi Etler (örnek işletme) → `#B3261E` köz kırmızısı, `#C8A24A` pirinç, Playfair Display, boğa rozeti logosu. Ekran görüntüleri: `docs/images/admin-*.png`.

---

## English summary

- **Name:** always `landing-kit`, lowercase with a hyphen. HTML attributes use the `data-lk-*` prefix.
- **Logo:** an `lk` monogram on a signal-blue tile; the k's arm points up-right to a lime "live" dot. Clean vector files in `brand/` (mark, wordmark light/dark, 512 px PNG), type outlined to paths. Explored with Higgsfield Recraft, final mark redrawn by hand on a grid.
- **Tokens (shadcn names):** primary `#2F54EB`, brand-2 `#C6F432`, foreground `#0E1525`, muted-foreground `#545A68`, background `#F7F7F5`, card `#FFFFFF`, destructive `#C42B1C` (see `admin/src/index.css`).
- **Type:** Bricolage Grotesque headings, Inter UI text, both self-hosted (no font CDN), full Turkish glyph support.
- **Components:** shadcn/ui pattern (Button, Input, Card, Badge, Switch, AlertDialog sheet, sonner Toaster, Skeleton) plus Field, EmptyState, ErrorState, PhotoPicker and dnd-kit reordering; 44 px+ tap targets and visible focus.
- **Voice (Turkish):** polite "siz", short, verb-first buttons, no jargon, errors say what to do, destructive actions warn and offer the safer option.
- **Per-site theming:** `color_primary`, `color_secondary`, `font_family`, `logo_path` are mapped at runtime onto shadcn variables with contrast correction; body text stays Inter.
