'use strict';
const Hapi = require('hapi');
const Hoek = require('hoek');
const lab = exports.lab = require('lab').script();
const register = require('../index.js');

let server;
lab.beforeEach((done) => {
  server = new Hapi.Server({
    debug: {
      log: ['hapi-cache-stats']
    }
  });
  server.connection();
  server.register({
    register,
    options: {
      interval: 1000
    }
  }, () => {
    done();
  });
});

lab.afterEach((done) => {
  server.stop(() => {
    done();
  });
});

lab.test('will log delayed requests', { timeout: 10000 }, (done) => {
  const add = () => 5;
  server.method('add', add, {
    cache: {
      expiresIn: 60000,
      // expiresAt: '20:30',
      staleIn: 30000,
      // staleTimeout: 10000,
      // generateTimeout: 100
    }
  });
  server.stop(done);
});
