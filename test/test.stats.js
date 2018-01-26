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
      verbose: true,
      interval: 500
    }
  }, () => {
    done();
  });
});

tap.afterEach((done) => {
  server.stop(done);
});

tap.test('will log delayed requests', t => {
  const results = [];
  server.on('log', (datum) => {
    results.push(datum.data);
  });
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
  async.timesLimit(5, 1, (n, next) => {
    server.inject({
      method: 'get',
      url: '/',
    }, (response) => {
      setTimeout(() => {
        next();
      }, 500);
    });
  }, () => {
    t.notEqual(results[1].hitRatio, -1);
    t.notEqual(results[1].staleRatio, -1);
    t.notEqual(results[1].generates, -1);
    t.end();
  });
});

tap.test('also handles nested methods', t => {
  const results = [];
  server.on('log', (datum) => {
    results.push(datum.data);
  });
  const add = function() {
    return new Date();
  };
  server.method('myMethods.add', add, {
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
      reply({ result: server.methods.myMethods.add(5) });
    }
  });
  async.timesLimit(5, 1, (n, next) => {
    server.inject({
      method: 'get',
      url: '/',
    }, (response) => {
      setTimeout(() => {
        next();
      }, 500);
    });
  }, () => {
    t.notEqual(results[1].hitRatio, -1);
    t.notEqual(results[1].staleRatio, -1);
    t.notEqual(results[1].generates, -1);
    t.end();
  });
});
