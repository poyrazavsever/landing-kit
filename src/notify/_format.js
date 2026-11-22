'use strict';

/** Plain-text summary of a contact message, shared by all channels. */
function formatMessage(site, message, config) {
  const lines = [
    `${site.name} sitesinden yeni mesaj`,
    '',
    `Ad: ${message.name}`,
    message.phone ? `Telefon: ${message.phone}` : null,
    message.email ? `E-posta: ${message.email}` : null,
    '',
    message.message,
    '',
    `Panel: ${config.publicUrl}/admin/${site.slug}#/mesajlar`,
  ];
  return lines.filter((line) => line !== null).join('\n');
}

module.exports = { formatMessage };
