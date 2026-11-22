'use strict';

const nodemailer = require('nodemailer');
const { formatMessage } = require('./_format');

let cached;

function transporter(config) {
  const key = JSON.stringify(config.smtp);
  if (!cached || cached.key !== key) {
    cached = {
      key,
      transport: nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
      }),
    };
  }
  return cached.transport;
}

module.exports = {
  name: 'email',

  isEnabled: (config, site) => Boolean(config.smtp.host && site.contact_email),

  async send({ config, site, message }) {
    await transporter(config).sendMail({
      from: config.smtp.from,
      to: site.contact_email,
      // Reply goes straight to the visitor when they left an email.
      replyTo: message.email || undefined,
      subject: `Yeni mesaj: ${message.name} (${site.name})`,
      text: formatMessage(site, message, config),
    });
  },
};
