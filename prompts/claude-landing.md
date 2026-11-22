# Claude için landing-kit prompt şablonları

Bu dosyadaki prompt'ları Claude'a (ya da başka bir yapay zekâ asistanına) yapıştırın; `[KÖŞELİ PARANTEZ]` içindeki yerleri kendi müşterinize göre doldurun. Çıkan sayfa, landing-kit'e bağlı **dinamik** bir sayfa olur: menü, fiyatlar, kampanyalar, telefon ve saatler panelden güncellenir, iletişim formu çalışır.

> İpucu: Önce "Ortak kurallar" bölümünü, sonra işletme tipine uygun şablonu birlikte yapıştırın.

---

## Ortak kurallar (her prompt'un başına ekleyin)

```text
Tek dosyalık, mobil öncelikli, hızlı açılan bir landing sayfası yaz (index.html, CSS <style> içinde).
Harici JS kütüphanesi, font CDN'i ya da analitik kodu ekleme. Dil Türkçe.

Sayfa landing-kit ile dinamik olacak. Şu kurallara KESİNLİKLE uy:

1. </body>'den hemen önce şu satır olsun:
   <script src="[API_ADRESI]/landing-kit.js" data-site="[SLUG]" defer></script>

2. İşletme bilgileri şu özelliklerle işaretlensin (içlerine mantıklı statik yedek metin yaz,
   API'ye ulaşılamazsa bu metin görünür):
   - data-lk="name"      işletme adı
   - data-lk="phone"     telefon metni
   - data-lk="address"   adres metni
   - data-lk="hours"     çalışma saatleri (bir <ul> kullan, içine bir <li> yedek saat yaz)
   - data-lk="hoursNote" saatlerle ilgili not (boş <p> olabilir)
   Linkler için href'i dolduran özellikler:
   - data-lk-href="phone"    -> tel: linki
   - data-lk-href="whatsapp" -> wa.me linki
   - data-lk-href="email"    -> mailto: linki
   - data-lk-href="maps"     -> Google Haritalar araması

3. Listeler: kapsayıcıya data-lk-list="[KOLEKSIYON]" ver, içine bir <template> koy.
   Template içinde alanlar: data-lk-field="title", "description", "price", "image".
   - image alanını bir <img> üzerinde kullan (alt boş kalabilir, otomatik dolar).
   - price alanı TL olarak otomatik biçimlenir (₺150), sen biçimlendirme.
   - Boş gelen alanlar otomatik gizlenir; tasarım buna dayanıklı olsun.
   - Kapsayıcının içine, template dışında, bir adet statik yedek kart koy.
   - İstersen data-lk-empty="Şu an kampanya yok." ve data-lk-limit="3" kullan.

4. İletişim formu: <form data-lk-form="contact" novalidate> ve alan adları tam olarak:
   name (zorunlu), phone, email, message (zorunlu), kvkk (checkbox, zorunlu, value="1").
   Telefon ya da e-postadan en az biri gerekli. Formun içine başarı/hata mesajı için ayrıca
   bir şey ekleme; landing-kit .lk-status, .lk-success, .lk-error sınıflı bir <p> ekler,
   bunlar için CSS yaz. İstersen form'a data-lk-success="..." ile özel teşekkür metni ver.
   KVKK kutusunun yanında aydınlatma metnine giden bir link olsun ([KVKK_LINKI]).

5. Erişilebilirlik: her input'un <label>'ı olsun, kontrast yeterli olsun, dokunma alanları
   en az 44px, başlık hiyerarşisi düzgün (tek h1).
6. Uydurma bilgi yazma: yorum, ödül, "yılın en iyisi", müşteri sayısı gibi iddialar ekleme.
```

---

## Şablon 1 · Restoran / kafe

```text
[ORTAK KURALLAR]

İşletme: [İŞLETME ADI], [ŞEHİR/SEMT] içinde bir [restoran/kafe/lokanta].
Öne çıkan: [ör. odun ateşinde ızgara, ev yemekleri, kahvaltı].
Renkler: ana renk [#HEX], vurgu rengi [#HEX]. Hava: [ör. sıcak, samimi, geleneksel].
API_ADRESI: [https://api.alanadiniz.com]   SLUG: [restoran-slug]

Bölümler:
- Hero: işletme adı (data-lk="name"), tek cümlelik vaat, "Hemen ara" (data-lk-href="phone")
  ve "WhatsApp'tan yaz" (data-lk-href="whatsapp") düğmeleri.
- Menü: data-lk-list="menu" ızgara kartlar (fotoğraf, ad, açıklama, fiyat).
- Kampanyalar: data-lk-list="campaigns", dikkat çeken ama sade şerit/kartlar.
- Rezervasyon / iletişim: form + telefon, adres (data-lk-href="maps"), çalışma saatleri.
- Altbilgi: KVKK linki.
```

## Şablon 2 · Berber / kuaför / güzellik salonu

```text
[ORTAK KURALLAR]

İşletme: [İŞLETME ADI], [ŞEHİR/SEMT] içinde bir [berber/kuaför/salon].
Öne çıkan: [ör. klasik kesim, sakal bakımı, çocuk tıraşı].
Renkler: ana renk [#HEX], vurgu rengi [#HEX]. Hava: [ör. koyu, maskülen, premium / ferah, modern].
API_ADRESI: [https://api.alanadiniz.com]   SLUG: [berber-slug]

Bölümler:
- Hero: işletme adı, "WhatsApp ile randevu" (data-lk-href="whatsapp") ve "Ara" düğmeleri.
- Hizmetler ve fiyatlar: data-lk-list="services" satır listesi (küçük görsel, ad, açıklama, sağda fiyat).
- Kampanya: data-lk-list="campaigns" data-lk-limit="1".
- Randevu formu: mesaj alanının placeholder'ı "Hangi gün ve saat? Hangi hizmet?" olsun,
  data-lk-success="Talebiniz alındı, randevuyu onaylamak için sizi arayacağız."
- Saatler (data-lk="hours"), adres ve harita linki.
```

## Şablon 3 · Yerel dükkân (kuruyemiş, şarküteri, çiçekçi, butik…)

```text
[ORTAK KURALLAR]

İşletme: [İŞLETME ADI], [ŞEHİR/SEMT] içinde bir [dükkân türü].
Öne çıkan: [ör. günlük kavrulmuş kuruyemiş, telefonla sipariş, aynı gün teslim].
Renkler: ana renk [#HEX], vurgu rengi [#HEX]. Hava: [ör. doğal, taze, mahalle dükkânı].
API_ADRESI: [https://api.alanadiniz.com]   SLUG: [dukkan-slug]

Bölümler:
- En üstte ince kampanya şeridi: data-lk-list="campaigns" data-lk-limit="1" (template içinde tek satır).
- Hero: işletme adı, kısa vaat, "WhatsApp'tan sipariş" düğmesi.
- Ürünler: data-lk-list="products" kartlar (fotoğraf, ad, gramaj/açıklama, fiyat).
- Sipariş / soru formu: mesaj placeholder'ı "Ne istersiniz? (ör. 500 gr fındık)".
- Dükkân bilgileri: adres, telefon, saatler.
```

---

## Sayfa hazır olduktan sonra

1. `npm run site:create -- --slug [SLUG] --name "[İŞLETME ADI]" --email [SAHİBİN E-POSTASI] --domains [alanadi.com]`
2. Koleksiyonları (menü, hizmetler…) panelden ya da `npm run seed:demo` örneğindeki gibi doldurun.
3. Sayfayı müşterinin alan adına yükleyin (statik hosting yeterli: Netlify, Cloudflare Pages, aynı VPS'te Caddy…).
4. Formu bir kez gerçekten doldurup bildirimin geldiğini kontrol edin.
5. Müşteriye `data/guides/[SLUG]-admin-rehberi.pdf` dosyasını gönderin.
