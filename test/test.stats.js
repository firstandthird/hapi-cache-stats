'use strict';
const Hapi = require('hapi');
const tap = require('tap');
const register = require('../index.js');
const async = require('async');

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
  const oldLog = console.log;
  const results = [];
  console.log = (input) => {
    results.push(input);
  };
  const add = function() {
    return new Date();
  };
  server.method('add', add, {
    cache: {
      staleIn: 1000,
      staleTimeout: 10,
      generateTimeout: 100
    }
  });
  server.route({
    method: 'get',
    path: '/',
    handler: (request, reply) => {
      server.methods.add(5);
      reply({ result: true });
    }
  });
  async.timesLimit(20, 1, (n, next) => {
    server.inject({
      method: 'get',
      url: '/',
    }, () => {
      setTimeout(() => {
        next();
      }, 500);
    });
  }, () => {
    t.equal(results.length, 20);
    t.notEqual(results[1].indexOf('hitRatio:'), -1);
    t.notEqual(results[1].indexOf('staleRatio:'), -1);
    t.notEqual(results[1].indexOf('generates:'), -1);
    t.notEqual(results[19].indexOf('gets:'), -1);
    server.stop(t.end);
  });
});
