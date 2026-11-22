# KVKK Aydınlatma Metni Şablonu (İletişim Formu)

> **Önemli uyarı:** Bu metin bir **şablondur**, hukuki danışmanlık değildir. landing-kit geliştiricileri bu metnin herhangi bir işletme için yeterli ya da güncel olduğunu garanti etmez. Yayına almadan önce köşeli parantez içindeki yerleri doldurun, işletmenin gerçek veri işleme süreçlerine göre düzenleyin ve mümkünse bir hukukçuya kontrol ettirin. Güncel mevzuat için resmi kaynak: Kişisel Verileri Koruma Kurumu (kvkk.gov.tr).

**English:** This is a Turkish privacy notice (KVKK "aydınlatma metni") **template** for the contact form. It is not legal advice. Fill in the placeholders, adapt it to the business's real data processing, and have it reviewed by a lawyer before publishing.

---

## Kişisel Verilerin Korunması Hakkında Aydınlatma Metni

**Veri sorumlusu:** [İŞLETMENİN TİCARİ UNVANI / AD SOYAD], [AÇIK ADRES], [E-POSTA], [TELEFON]

6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında, internet sitemizdeki iletişim formu aracılığıyla paylaştığınız kişisel verilerinizin nasıl işlendiği hakkında sizi bilgilendirmek isteriz.

### 1. İşlenen kişisel veriler

İletişim formunu doldurduğunuzda aşağıdaki veriler işlenir:

- Kimlik bilgisi: adınız (ve soyadınız)
- İletişim bilgisi: telefon numaranız ve/veya e-posta adresiniz
- Talep bilgisi: mesaj alanına yazdığınız içerik
- İşlem güvenliği bilgisi: formun gönderildiği tarih ve saat; kötüye kullanımı önlemek amacıyla sunucu tarafından geçici olarak işlenen teknik bilgiler (ör. IP adresi) [SÜRESİNİ YAZIN]

Lütfen mesaj alanına sağlık bilgisi gibi özel nitelikli kişisel veri yazmayın.

### 2. İşleme amaçları

Kişisel verileriniz yalnızca şu amaçlarla işlenir:

- Talebinize, sorunuza, rezervasyon/randevu/sipariş isteğinize dönüş yapmak,
- [VARSA DİĞER AMAÇLAR: ör. randevunuzu planlamak]
- Formun kötüye kullanılmasını (spam) önlemek ve bilgi güvenliğini sağlamak.

Verileriniz pazarlama amacıyla kullanılmaz [AKSİ HÂLDE AYRI AÇIK RIZA ALIN VE BU CÜMLEYİ DÜZENLEYİN].

### 3. Hukuki sebep ve toplama yöntemi

Verileriniz, internet sitemizdeki iletişim formu aracılığıyla elektronik ortamda toplanır. KVKK m. 5/2 kapsamında [UYGUN HUKUKİ SEBEBİ SEÇİN, ör. "bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması" (5/2-c) ve/veya "ilgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla veri sorumlusunun meşru menfaati" (5/2-f)] hukuki sebebine dayanılarak işlenir.

### 4. Aktarım

Verileriniz; sitemizin barındırıldığı ve form mesajlarının saklandığı sunucu hizmetini sağlayan [HİZMET SAĞLAYICI / FREELANCER ADI] ile, size bildirim ulaştırmak için kullanılan [E-POSTA SAĞLAYICISI, VARSA TELEGRAM] hizmetleri ile, yalnızca yukarıdaki amaçlar için gerekli olduğu ölçüde paylaşılabilir. [SUNUCU VEYA HİZMETLER YURT DIŞINDAYSA KVKK m. 9 KAPSAMINDA BİLGİ VERİN.] Kanunen yetkili kamu kurum ve kuruluşlarının talebi hâlinde ilgili mevzuat çerçevesinde aktarım yapılabilir.

### 5. Saklama süresi

Form mesajları, talebinizin sonuçlanmasından itibaren [SÜRE, ör. 6 ay] boyunca saklanır ve süre sonunda silinir.

### 6. Haklarınız

KVKK m. 11 uyarınca; kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme, yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme, eksik veya yanlış işlenmişse düzeltilmesini isteme, KVKK m. 7 çerçevesinde silinmesini veya yok edilmesini isteme, bu işlemlerin aktarıldığı üçüncü kişilere bildirilmesini isteme, münhasıran otomatik sistemlerle analiz edilmesi sonucu aleyhinize bir sonucun ortaya çıkmasına itiraz etme ve kanuna aykırı işleme sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme haklarına sahipsiniz.

Başvurularınızı [E-POSTA ADRESİ] adresine ya da [ADRES] adresine yazılı olarak iletebilirsiniz. Başvurunuz, niteliğine göre en kısa sürede ve en geç otuz gün içinde sonuçlandırılır.

**Son güncelleme:** [TARİH]

---

## Uygulama notları (freelancer için)

- Formdaki KVKK onay kutusu bu metne link vermeli. landing-kit, kutu işaretlenmeden gelen mesajları **sunucu tarafında** reddeder.
- Bu şablon, form üzerinden **bilgilendirme** içindir. Pazarlama iletisi (kampanya SMS'i, e-bülten) gönderilecekse ayrıca açık rıza ve ilgili ticari ileti mevzuatına uygun onay gerekir; landing-kit bunu sağlamaz.
- İşletme sahibine panelde eski mesajları düzenli silmesini hatırlatın (yönetim rehberinde de yazıyor).
- Yedekler (`npm run backup`) de kişisel veri içerir: güvenli yerde saklayın ve saklama süresine uyun.
