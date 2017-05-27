'use strict';
const Hapi = require('hapi');
const tap = require('tap');
const register = require('../index.js');

let server;
tap.beforeEach((done) => {
  server = new Hapi.Server({
    debug: {
      log: ['hapi-cache-stats']
    }
  });
  server.connection();
  server.register({
    register,
    options: {
      interval: 500
    }
  }, () => {
    done();
  });
});

tap.test('will log delayed requests', t => {
  const add = () => 5;
  server.method('add', add, {
    cache: {
      expiresIn: 60000,
      staleIn: 30000,
      staleTimeout: 10000,
      generateTimeout: 100
    }
  });
  server.route({
    method: 'get',
    path: '/',
    handler: (request, reply) => {
      server.methods.add();
      reply({});
    }
  });
  for (let i = 0; i < 20; i++) {
    server.inject({
      method: 'get',
      url: '/',
    }, () => {
    });
  }
  setTimeout(() => {
    server.stop(t.end);
  }, 5000);
});
