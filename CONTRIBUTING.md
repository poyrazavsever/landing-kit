# Katkı Rehberi / Contributing

landing-kit'e katkı vermek istediğiniz için teşekkürler. _English below._

## Türkçe

### Başlamadan önce

- Büyük bir değişiklik (yeni modül, şema değişikliği, yeni bağımlılık) için önce bir **issue** açın; birlikte yönüne karar verelim.
- Hedef kitleyi unutmayın: panelin kullanıcısı teknik olmayan bir esnaf, kurulumun kullanıcısı yeni başlayan bir freelancer. Basitlik bir özelliktir.

### Geliştirme ortamı

```bash
git clone https://github.com/poyrazavsever/landing-kit.git
cd landing-kit
npm install
cp .env.example .env
npm run seed:demo -- --password demo12345
npm run dev
```

### Göndermeden önce

```bash
npm run lint
npm run format:check   # düzeltmek için: npm run format
npm test
npm run build          # public/landing-kit.js değiştiyse
```

### Kurallar

- **Kod, değişken adları ve commit mesajları İngilizce**; kullanıcıya görünen metinler (panel, hata mesajları, belgeler) **Türkçe** (README'de İngilizce bölüm de var).
- Commit mesajları [Conventional Commits](https://www.conventionalcommits.org/) biçiminde: `feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`, `style:`, `ci:`.
- **Sadece parametreli SQL.** Kullanıcı girdisi asla SQL metnine eklenmez.
- **Her admin sorgusu `site_id` ile sınırlanır.** Bir sahip başka bir müşterinin verisine hiçbir yoldan ulaşmamalı; yeni bir admin endpoint'i eklerseniz izolasyon testi de ekleyin.
- Panelde ve snippet'te kullanıcı içeriği **`textContent`** ile basılır, `innerHTML` ile değil.
- Snippet bağımlılıksız kalır ve küçük kalır (minify sonrası ~7 KB'ın altında; testte kontrol ediliyor).
- Şema değişikliği = `src/db/migrations/` altında **yeni** bir dosya. Uygulanmış bir migration dosyasını değiştirmeyin.
- Yeni bildirim kanalı = `src/notify/` altına bir dosya (`name`, `isEnabled`, `send`).
- Panel metinleri için [docs/style-guide.md](docs/style-guide.md) içindeki yazım diline uyun.
- Belgelerde uydurma rakam, performans iddiası, hukuki garanti ya da gelir vaadi olmasın.

### Güvenlik açığı bildirimi

Güvenlik açıklarını herkese açık issue olarak değil, GitHub'ın **Security → Report a vulnerability** (özel bildirim) özelliğiyle iletin.

## English

- Open an issue before large changes (new modules, schema changes, new dependencies).
- Setup: `npm install`, `cp .env.example .env`, `npm run seed:demo -- --password demo12345`, `npm run dev`.
- Before a PR: `npm run lint`, `npm run format:check`, `npm test`, and `npm run build` if the snippet changed.
- Code, identifiers and commit messages in English (Conventional Commits); user-facing texts in Turkish.
- Parameterized SQL only. Every admin query is scoped by `site_id`; add a tenant-isolation test for new admin endpoints.
- Render user content with `textContent`, never `innerHTML`. Keep the snippet dependency-free and small.
- Schema changes go into a new migration file. New notification channels are a single file in `src/notify/`.
- No invented numbers, performance claims, legal guarantees or income promises in docs.
- Report security issues privately via GitHub **Security → Report a vulnerability**.
