# landing-kit Stil Rehberi

landing-kit'in kendi markası, yönetim panelinin arayüz bileşenleri ve yazım dili. Panel her müşteride o müşterinin markasıyla görünür; bu rehber **varsayılanları** ve markanın nasıl **geçersiz kılındığını** anlatır.

_English summary at the end._

## 1. İsim kullanımı

- Doğru yazım: **landing-kit** (hep küçük harf, tireli). Cümle başında da küçük harf: "landing-kit bir backend'dir."
- Kod ve komutlarda: `landing-kit`, `landing-kit.js`, `data-lk-*` öneki (lk = landing-kit).
- Yanlış: ~~Landing Kit~~, ~~LandingKit~~, ~~landingkit~~, ~~LK~~ (kullanıcıya dönük metinde kısaltma yok).
- Müşterinin panelinde landing-kit adı görünmez; panel müşterinin adını taşır. landing-kit adı yalnızca freelancer'a dönük yerlerde (README, CLI çıktısı, varsayılan logo) geçer.

## 2. Logo

Dosyalar `brand/` klasöründe:

| Dosya                                 | Kullanım                                               |
| ------------------------------------- | ------------------------------------------------------ |
| `brand/landing-kit-mark.svg`          | Kare işaret. Favicon, varsayılan panel logosu, avatar. |
| `brand/landing-kit-wordmark.svg`      | İşaret + yazı, açık zemin. README başlığı, sunumlar.   |
| `brand/landing-kit-wordmark-dark.svg` | İşaret + yazı, koyu zemin.                             |

**Fikir:** Mavi kare içinde beyaz bir sayfa (statik landing sayfası) ve köşesinde sarı bir "canlı" noktası: sayfa artık yaşıyor, güncellenebiliyor.

- Etrafında en az işaretin 1/4'ü kadar boşluk bırakın.
- En küçük boyut: işaret 16 px, yazılı logo 120 px genişlik.
- Logoyu esnetmeyin, döndürmeyin, gölge/efekt eklemeyin, renklerini değiştirmeyin.
- Yazılı logodaki yazı `Inter` (yoksa sistem sans-serif) ile çizilir; baskıya gidecekse yazıyı vektöre çevirin.

## 3. Renk token'ları

| Token          | Değer     | Kullanım                                                                               |
| -------------- | --------- | -------------------------------------------------------------------------------------- |
| `--brand`      | `#1F4FFF` | Ana renk: üst bar, birincil düğme. Beyaz yazı ile kontrast 5,8:1 (AA).                 |
| `--brand-2`    | `#FFB020` | Vurgu: "yeni" rozeti, odak halkası, mesaj kutusu kenarı. Üstüne koyu yazı (`#1A1200`). |
| `--brand-ink`  | `#1F4FFF` | Beyaz zemin üstündeki marka renkli yazı/link (en az 4,5:1 olacak şekilde hesaplanır).  |
| `--on-brand`   | `#FFFFFF` | Ana renk zemin üstündeki yazı.                                                         |
| `--brand-soft` | `#EEF2FF` | Rozet ve küçük resim zemini.                                                           |
| `--ink`        | `#0E1525` | Metin.                                                                                 |
| `--muted`      | `#4B5568` | İkincil metin, ipuçları (beyazda 7,5:1).                                               |
| `--line`       | `#DDE2EE` | Kenarlıklar.                                                                           |
| `--paper`      | `#F6F7FB` | Sayfa zemini.                                                                          |
| `--card`       | `#FFFFFF` | Kart zemini.                                                                           |
| `--success`    | `#12805C` | Başarı. Beyazda 4,9:1.                                                                 |
| `--danger`     | `#C62828` | Hata, silme. Beyazda 5,6:1.                                                            |

Kaynak: `public/admin/admin.css` içindeki `:root`.

## 4. Tipografi

- Varsayılan yazı tipi: **Inter**, yoksa `Segoe UI`, `system-ui`, `-apple-system`, `Roboto`. Panel dışarıdan font yüklemez (hız ve gizlilik); cihazda olan kullanılır.
- Gövde: 17 px, satır yüksekliği 1,5 (telefonda rahat okunur, iOS'ta otomatik yakınlaştırmayı tetiklemez).
- Başlıklar: H1 26 px / kalın, H2 20 px / kalın. Ekran başına tek H1.
- İpucu metni: 14 px, `--muted`.
- Rakamlar ve fiyatlar `Intl.NumberFormat('tr-TR')` ile: `₺1.249,50`.

## 5. Panel bileşenleri

| Bileşen          | Sınıf                                | Kural                                                                                                             |
| ---------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Üst bar          | `.topbar`                            | Müşteri logosu + adı, sağda "Çıkış". Ana renk zemin.                                                              |
| Kutu (ana sayfa) | `.tile`                              | Sol kenarda 6 px marka çizgisi; başlık + tek satır açıklama. Mesajlar kutusu `.accent` (vurgu rengi).             |
| Kart             | `.card`                              | 14 px köşe, ince kenarlık, hafif gölge.                                                                           |
| Birincil düğme   | `.btn`                               | Ekranda tek birincil eylem (Kaydet, Ekle). Min. yükseklik 48 px.                                                  |
| İkincil düğme    | `.btn-secondary`                     | Kenarlıklı. Gizle/Göster, sıralama okları.                                                                        |
| Tehlikeli düğme  | `.btn-danger`                        | Silme. Her zaman onay sorar ve "geri alınamaz" der.                                                               |
| Alt sabit eylem  | `.sticky-actions`                    | Form ekranlarında Kaydet/Ekle düğmesi başparmak erişiminde, ekranın altında sabit.                                |
| Rozet            | `.badge`, `.badge.off`, `.badge.new` | "Sitede", "Gizli", "Yeni".                                                                                        |
| Bildirim         | `.toast`                             | Ekranın altında 3 sn; `role="status"` ile ekran okuyucuya okunur. Hata hâlinde kırmızı.                           |
| Form alanı       | `.field`                             | Her alanın görünür etiketi var; hata mesajı alanın altında, `aria-invalid` + `aria-describedby`.                  |
| Fotoğraf seçici  | `.photo`                             | "Fotoğraf çek" (kamera) ve "Galeriden seç" ayrı düğmeler; büyük fotoğraflar yüklemeden önce 1600 px'e küçültülür. |
| Çalışma saatleri | `.hours-row`                         | Gün + "Kapalı" anahtarı + iki saat seçici.                                                                        |

**Erişilebilirlik kuralları:** Dokunma alanı en az 44–48 px. Odak halkası her zaman görünür (`--brand-2`, 3 px). Renk tek başına anlam taşımaz (gizli kayıtta hem soluk görünüm hem "Gizli" yazısı). `prefers-reduced-motion` desteklenir. Kullanıcı içeriği her zaman `textContent` ile basılır.

## 6. Yazım dili (Türkçe)

Panelin kullanıcısı esnaf: teknik değil, meşgul, telefonda, çoğu zaman tek elle.

- **"Siz" diliyle**, kısa ve sıcak: "Sitenizi güncellemek için giriş yapın."
- **Eylem fiille**: "Kaydet", "Ekle", "Gizle", "Fotoğraf çek". "Gönder" yerine ne olacağını söyleyin: "Şifremi kaydet".
- **Jargon yok**: "koleksiyon" değil "bölüm", "item" değil "kayıt/ürün", "deaktif" değil "gizli", "upload" değil "yükle", "session" değil "giriş".
- **Sonucu söyleyin**: "Eklendi. Sitede görünüyor." / "Silindi."
- **Hata mesajı = ne yapmalı**: "Fiyatı sadece rakamla yazın (ör. 150 veya 149,90)." Suçlayıcı ya da teknik ("400 Bad Request") değil.
- **Geri alınamayan işlemde açık uyarı** ve daha güvenli alternatif: "Bu işlem geri alınamaz. Sadece saklamak istiyorsanız 'Sitede göster' kutusunu kaldırın."
- Ünlem ve emoji yok (tek istisna: "Merhaba!").

## 7. Siteye özel tema ("siteye özel")

Her müşterinin paneli kendi markasıyla açılır. Tema `sites` tablosundaki dört alandan gelir:

| Alan              | Etkisi                                                                      | Boşsa                |
| ----------------- | --------------------------------------------------------------------------- | -------------------- |
| `logo_path`       | Üst bar, giriş ekranı, PDF kapağı                                           | landing-kit işareti  |
| `color_primary`   | `--brand`, `--brand-ink`, `--on-brand`, `--brand-soft`, tarayıcı tema rengi | `#1F4FFF`            |
| `color_secondary` | `--brand-2` (vurgu, odak halkası)                                           | `#FFB020`            |
| `font_family`     | `--font`                                                                    | Inter / sistem fontu |

Nasıl ayarlanır: `npm run site:create -- ... --primary "#7C2D12" --secondary "#F59E0B" --font "Georgia" --logo ./logo.png` ya da sonradan `npm run site:update`. Süper yönetici (freelancer) paneldeki **İşletme bilgileri → Tema ve teknik ayarlar** bölümünden de değiştirebilir. İşletme sahibi temayı değiştiremez.

**Kontrast güvencesi:** Panel, müşterinin ana rengini çalışma anında ölçer:

- Ana renk zemindeki yazı rengi (`--on-brand`) beyaz ya da koyu lacivertten hangisi daha okunaklıysa o seçilir.
- Beyaz zemindeki marka renkli yazı/link (`--brand-ink`) 4,5:1 kontrasta ulaşana kadar koyulaştırılır. Yani müşteri açık sarı bir marka rengi seçse bile linkler okunur kalır.

PDF rehber (`npm run guide:pdf`) aynı dört alanı kullanır: kapak ana renkte, başlık çizgileri vurgu renginde, metin müşterinin yazı tipiyle.

---

## English summary

- **Name:** always `landing-kit`, lowercase with a hyphen. HTML attributes use the `data-lk-*` prefix.
- **Logo:** `brand/landing-kit-mark.svg` (square mark), `brand/landing-kit-wordmark.svg` and `-dark.svg`. A white page with a yellow "live" dot on a blue square: a static page that is now alive.
- **Tokens:** brand `#1F4FFF`, accent `#FFB020`, ink `#0E1525`, muted `#4B5568`, line `#DDE2EE`, paper `#F6F7FB`, success `#12805C`, danger `#C62828` (see `public/admin/admin.css`).
- **Type:** Inter / system UI, 17 px body, no web fonts loaded.
- **Components:** tiles, cards, one primary action per screen, sticky bottom action bar on forms, 44–48 px tap targets, visible focus ring, toasts with `role="status"`.
- **Voice (Turkish):** polite "siz", short, verb-first buttons, no jargon, errors say what to do, destructive actions warn and offer the safer option.
- **Per-site theming:** `logo_path`, `color_primary`, `color_secondary`, `font_family` on the `sites` row override the defaults in the admin panel and the PDF guide. Text colors are computed at runtime to keep at least 4.5:1 contrast.
