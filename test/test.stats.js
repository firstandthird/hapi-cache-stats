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
      expiresIn: 2000,
      staleIn: 1500,
      staleTimeout: 10,
      generateTimeout: 10
    }
  });
  server.route({
    method: 'get',
    path: '/',
    handler: (request, reply) => {
      reply({ result: server.methods.add(5) });
    }
  });
  async.timesLimit(20, 1, (n, next) => {
    server.inject({
      method: 'get',
      url: '/',
    }, (response) => {
      oldLog(response.result);
      oldLog(response.results);
      setTimeout(() => {
        next();
      }, 500);
    });
  }, () => {
    t.notEqual(results[2].indexOf('hitRatio:'), -1);
    t.notEqual(results[2].indexOf('staleRatio:'), -1);
    t.notEqual(results[2].indexOf('generates:'), -1);
    server.stop(t.end);
  });
});
