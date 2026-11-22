# En İyi Etler: marka kiti (örnek işletme)

> **Örnek işletme / example business.** "En İyi Etler" gerçek bir işletme değildir. landing-kit'in vitrin örneği ve Poyraz Avsever'in U-015 videosundaki hayali restoran olarak hazırlandı. Menü, fiyatlar, adres ve telefon numaraları örnektir.

## Dosyalar

| Dosya                          | Ne                                                           |
| ------------------------------ | ------------------------------------------------------------ |
| `logo-mark.svg`                | Simge: dairesel kömür rozet içinde boğa başı (vektör)        |
| `logo-mark-512.png`            | Simge, 512 px, şeffaf zemin                                  |
| `logo-horizontal.svg` / `.png` | Simge + "EN İYİ ETLER" + "IZGARA · ET LOKANTASI", açık zemin |
| `logo-horizontal-light.svg`    | Koyu zemin için (yazı kemik beyazı, alt satır pirinç)        |
| `images/hero.webp`             | Dinlendirilmiş antrikot, köz ve biberiye (1800 px)           |
| `images/adana.webp`            | Adana kebap, lavaş, közlenmiş domates ve biber               |
| `images/interior.webp`         | Akşam ışığında salon ve ızgara tezgâhı                       |
| `images/ad.webp`               | Kare reklam görseli: iki kişilik karışık ızgara              |
| `images/dessert.webp`          | Künefe ve çay                                                |

Görseller WebP (kalite 78), hepsi 150 KB'ın altında.

## Renkler

| Ad            | HEX       | Kullanım                                                              |
| ------------- | --------- | --------------------------------------------------------------------- |
| Kömür         | `#1C1917` | Ana koyu zemin, metin                                                 |
| Köz kırmızısı | `#B3261E` | Ana marka rengi: düğmeler, vurgular, panel ana rengi                  |
| Pirinç        | `#C8A24A` | İkincil renk: ince çizgiler, rozetler, koyu zemindeki küçük başlıklar |
| Kemik         | `#F5EFE6` | Açık zemin, koyu zemindeki metin                                      |
| Koyu kan      | `#71050A` | Simgedeki gölge detayları (sadece logoda)                             |

Kontrast: Kemik zemin üzerinde Kömür metin 15,3:1; Köz kırmızısı üzerinde beyaz metin 6,5:1; Kömür üzerinde Pirinç 7,3:1. Pirinç, açık zeminde küçük metin için kullanılmaz.

## Yazı tipleri

- **Başlık:** Playfair Display (700), klasik et lokantası tabelası hissi. Türkçe karakterleri tam destekler.
- **Metin:** Inter (400–600).
- İkisi de açık lisanslı (SIL OFL) ve örnek sayfada `fonts/` klasöründen kendi sunucudan yüklenir, harici font servisi yok.

## Marka sesi

- Sıcak, iddiasız, misafirperver: "Masanız hazır." "Ateşi biz yakarız, siz keyfinize bakın."
- Abartılı iddia yok: "şehrin en iyisi", "bir numara", uydurma yorum, ödül ya da sayı kullanılmaz. İsim zaten iddialı; metinler sade kalır.
- Ürünü anlatırken somut olun: pişirme şekli, gramaj, garnitür.
- "Siz" diliyle, kısa cümleler. Rezervasyon çağrısı net: "Masa ayırtın", "WhatsApp'tan yazın".

## Nasıl üretildi

Higgsfield ile keşif yapıldı, son dosyalar yerelde düzenlendi:

- **Logo:** Recraft V4.1 vektör modu, üç aday üretildi (boğa rozeti, alev + satır bıçağı, ızgara mühürü). Boğa rozeti seçildi. SVG'den arka plan katmanı ve C2PA meta verisi temizlendi, görünüm kutusu kırpıldı; çizimin kendisi değiştirilmedi. Yazı kısmı Playfair Display ve Inter'den vektöre çevrildi (fontTools).
- **Fotoğraflar:** Seedream 5.0 Pro, 2K üretildi, WebP'ye küçültüldü. Yapay zekâ ile üretilmiş görsellerdir, gerçek bir mekânı veya yemeği göstermez.

| Varlık         | Model                 | Job id                                 | Prompt (özet)                                                                                                                           |
| -------------- | --------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Logo (seçilen) | recraft_v4_1 (vector) | `e48865a7-1f4d-465a-8b36-74726607b02a` | Dairesel kömür rozet içinde minimal, önden boğa başı; köz kırmızısı baş, pirinç boynuzlar; düz vektör, yazısız                          |
| Logo adayı 2   | recraft_v4_1 (vector) | `7b6cf4ab-008f-4595-b9cf-c022733d0d2c` | İç boşluğu satır bıçağı olan tek alev                                                                                                   |
| Logo adayı 3   | recraft_v4_1 (vector) | `9e3162f2-e1d0-4a25-b9de-1e59360fcdf0` | Yukarıdan ızgara teli, ortasından yükselen alev, pirinç halka                                                                           |
| hero.webp      | seedream_v5_pro       | `bfa29812-a28c-4faa-8d1e-aeb779833c36` | Kömür taş üzerinde dilimlenmiş orta pişmiş antrikot, biberiye, deniz tuzu, arkada bulanık köz; loş, sıcak ışık; solda metin için boşluk |
| adana.webp     | seedream_v5_pro       | `b600ca72-6a4b-41e0-be1c-6954c0ea86aa` | Lavaş üzerinde iki Adana şiş, közlenmiş domates ve biber, sumaklı soğan, koyu ahşap masa                                                |
| interior.webp  | seedream_v5_pro       | `eca052b5-491f-47c6-9d3a-9828877e7dc1` | Akşam, kömür duvarlar, pirinç sarkıt lambalar, arkada açık ızgara tezgâhı; boş salon, insan ve tabela yok                               |
| ad.webp        | seedream_v5_pro       | `7d9c3deb-710b-4bc7-9559-fcca650119de` | Döküm tavada iki kişilik karışık ızgara, yükselen duman, kömür zemin, üstte başlık için boşluk                                          |
| dessert.webp   | seedream_v5_pro       | `28107c10-36f3-413d-a65a-c44b2838697f` | Bakır tabakta künefe, Antep fıstığı, yanında ince belli bardakta çay                                                                    |

Tüm promptlarda "metin yok, logo yok, insan yok" kısıtı vardı. Palet: `#1C1917`, `#B3261E`, `#C8A24A` (logo üretiminde kilitli renkler), zemin `#F5EFE6`.
