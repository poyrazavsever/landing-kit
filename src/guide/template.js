'use strict';

const esc = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch],
  );

/** Picks black or white text for a background color (WCAG relative luminance). */
function textOn(hex) {
  const m = String(hex).replace('#', '');
  const full = m.length === 3 ? m.replace(/(.)/g, '$1$1') : m;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(full.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return 1.05 / (l + 0.05) >= (l + 0.05) / 0.05 ? '#FFFFFF' : '#0E1525';
}

/**
 * Full HTML document for the customer guide.
 * data: { site, theme, logo, panelUrl, username, qrSvg, support, bodyHtml, date }
 */
function guideHtml(data) {
  const { site, theme, logo, panelUrl, username, qrSvg, support, bodyHtml, date } = data;
  const font = `"${String(theme.font).replace(/["\\<>]/g, '')}", Inter, "Segoe UI", system-ui, sans-serif`;
  const onPrimary = textOn(theme.primary);
  const supportLines = [
    support.name && `<strong>${esc(support.name)}</strong>`,
    support.phone && `Telefon: ${esc(support.phone)}`,
    support.email && `E-posta: ${esc(support.email)}`,
  ].filter(Boolean);

  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>${esc(site.name)} · Yönetim Paneli Rehberi</title>
<style>
  @page { size: A4; margin: 18mm 16mm 20mm; }
  @page :first { margin: 0; }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; font-family: ${font}; color: #0E1525; font-size: 10.5pt; line-height: 1.55; }
  .cover { height: 297mm; display: flex; flex-direction: column; page-break-after: always; }
  .cover-top { background: ${theme.primary}; color: ${onPrimary}; padding: 26mm 18mm 16mm; }
  .cover-top img { width: 26mm; height: 26mm; object-fit: contain; background: #fff; border-radius: 6mm; padding: 2.5mm; }
  .cover-top h1 { font-size: 30pt; line-height: 1.1; margin: 8mm 0 2mm; }
  .cover-top p { font-size: 14pt; margin: 0; opacity: .92; }
  .accent { height: 4mm; background: ${theme.secondary}; }
  .cover-body { padding: 12mm 18mm; flex: 1; display: flex; flex-direction: column; gap: 8mm; }
  .access { display: grid; grid-template-columns: 1fr 44mm; gap: 8mm; align-items: center; border: 0.4mm solid #DDE2EE; border-radius: 5mm; padding: 8mm; }
  .access dt { font-size: 9pt; text-transform: uppercase; letter-spacing: .06em; color: #4B5568; margin-top: 4mm; }
  .access dt:first-child { margin-top: 0; }
  .access dd { margin: 1mm 0 0; font-size: 13pt; font-weight: 700; overflow-wrap: anywhere; }
  .access dd.url { word-break: break-all; }
  .qr { text-align: center; font-size: 8.5pt; color: #4B5568; }
  .qr svg { width: 44mm; height: 44mm; display: block; }
  .note { background: #F6F7FB; border-left: 2mm solid ${theme.secondary}; padding: 5mm 6mm; border-radius: 2mm; }
  .support { border-top: 0.4mm solid #DDE2EE; padding-top: 6mm; margin-top: auto; }
  .support h2 { font-size: 12pt; margin: 0 0 2mm; color: ${theme.primary}; }
  .support p { margin: 0.5mm 0; }
  .made { font-size: 8pt; color: #4B5568; margin-top: 4mm; }
  .guide h1 { display: none; }
  .guide h2 { color: ${theme.primary}; font-size: 15pt; margin: 9mm 0 3mm; padding-bottom: 1.5mm; border-bottom: 0.6mm solid ${theme.secondary}; page-break-after: avoid; }
  .guide h3 { font-size: 12pt; margin: 6mm 0 2mm; }
  .guide p, .guide li { orphans: 3; widows: 3; }
  .guide ol, .guide ul { padding-left: 6mm; }
  .guide li { margin: 1.2mm 0; }
  .guide blockquote { margin: 4mm 0; background: #F6F7FB; border-left: 2mm solid ${theme.secondary}; padding: 3mm 5mm; border-radius: 2mm; }
  .guide blockquote p { margin: 0; }
  .guide code { font-family: inherit; font-weight: 700; background: #F6F7FB; padding: 0 1.5mm; border-radius: 1mm; }
  .guide strong { color: #0E1525; }
  .guide img { display: block; width: 58mm; margin: 4mm auto; border-radius: 4mm; border: 0.4mm solid #DDE2EE; page-break-inside: avoid; }
</style>
</head>
<body>
  <section class="cover">
    <div class="cover-top">
      <img src="${logo}" alt="" />
      <h1>${esc(site.name)}</h1>
      <p>Yönetim Paneli Kullanım Rehberi</p>
    </div>
    <div class="accent"></div>
    <div class="cover-body">
      <div class="access">
        <dl>
          <dt>Panel adresiniz</dt><dd class="url">${esc(panelUrl)}</dd>
          <dt>Kullanıcı adınız</dt><dd>${esc(username || 'Size ayrıca bildirildi')}</dd>
          <dt>Şifreniz</dt><dd style="font-weight:400;font-size:11pt">Güvenliğiniz için bu belgede yazmaz. Size ayrıca verildi; ilk girişte kendi şifrenizi belirlersiniz.</dd>
        </dl>
        <div class="qr">${qrSvg}<div>Telefonunuzun kamerasıyla okutun</div></div>
      </div>
      <div class="note">
        Menünüzü, fiyatlarınızı, kampanyalarınızı, telefon ve çalışma saatlerinizi bu panelden kendiniz güncellersiniz. Değişiklikler sitede <strong>hemen</strong> görünür. Adım adım anlatım sonraki sayfalarda.
      </div>
      ${
        supportLines.length
          ? `<div class="support"><h2>Yardım mı lazım?</h2>${supportLines.map((l) => `<p>${l}</p>`).join('')}</div>`
          : '<div class="support"></div>'
      }
      <div class="made">Hazırlanma tarihi: ${esc(date)}</div>
    </div>
  </section>
  <main class="guide">${bodyHtml}</main>
</body>
</html>`;
}

module.exports = { guideHtml, esc };
