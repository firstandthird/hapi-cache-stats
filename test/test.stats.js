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
      interval: 500
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
    done();
  }, 5000);
});
