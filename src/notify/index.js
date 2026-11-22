'use strict';

const fs = require('node:fs');
const path = require('node:path');

/**
 * Notification channels.
 *
 * Every file in this folder (except index.js and files starting with "_") is a channel:
 *
 *   module.exports = {
 *     name: 'sms',
 *     isEnabled(config, site) { return Boolean(...) },   // cheap check, no I/O
 *     async send({ config, site, message }) { ... },    // throw on failure
 *   };
 *
 * Adding a channel = adding a file. No registration needed.
 */
function loadChannels(dir = __dirname) {
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.js') && file !== 'index.js' && !file.startsWith('_'))
    .sort()
    .map((file) => require(path.join(dir, file)));
}

function createNotifier(config, { logger = console, channels = loadChannels() } = {}) {
  return {
    channels,
    /** Sends to every enabled channel; one failing channel never blocks the others. */
    async notifyNewMessage(site, message) {
      const active = channels.filter((channel) => channel.isEnabled(config, site));
      const results = await Promise.allSettled(
        active.map((channel) => channel.send({ config, site, message })),
      );
      results.forEach((result, i) => {
        if (result.status === 'rejected') {
          logger.error?.(`[notify:${active[i].name}] ${result.reason?.message || result.reason}`);
        }
      });
      return results.map((result, i) => ({ channel: active[i].name, status: result.status }));
    },
  };
}

module.exports = { createNotifier, loadChannels };
