'use strict';

const { formatMessage } = require('./_format');

const chatIdFor = (config, site) => site.telegram_chat_id || config.telegram.defaultChatId;

module.exports = {
  name: 'telegram',

  isEnabled: (config, site) => Boolean(config.telegram.botToken && chatIdFor(config, site)),

  async send({ config, site, message }) {
    const url = `https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Plain text (no parse_mode) so visitor input can never inject formatting.
      body: JSON.stringify({ chat_id: chatIdFor(config, site), text: formatMessage(site, message, config) }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Telegram API responded ${res.status}`);
  },
};
