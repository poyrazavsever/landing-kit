'use strict';

const { sitesRepo } = require('./sites');
const { itemsRepo } = require('./items');
const { messagesRepo } = require('./messages');
const { usersRepo } = require('./users');

function createRepos(db) {
  return {
    db,
    sites: sitesRepo(db),
    items: itemsRepo(db),
    messages: messagesRepo(db),
    users: usersRepo(db),
  };
}

module.exports = { createRepos };
