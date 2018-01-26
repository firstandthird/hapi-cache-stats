const Hapi = require('hapi');
const tap = require('tap');
const plugin = require('../index.js');
let server;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

tap.beforeEach(async() => {
  server = new Hapi.Server({
    debug: {
      log: ['hapi-cache-stats']
    }
  });
  await server.register({
    plugin,
    options: {
      verbose: true,
      interval: 500
    }
  });
});

tap.afterEach(async() => {
  await server.stop();
});

tap.test('will log delayed requests', async (t) => {
  const results = [];
  server.events.on('log', (datum) => {
    results.push(datum.data);
  });
  const add = () => new Date();
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
    handler: (request, h) => {
      return { result: server.methods.add(5) };
    }
  });
  /* eslint-disable  */
  for (let i = 0; i < 5; i++) {
    await server.inject({
      method: 'get',
      url: '/',
    });
    await wait(500);
  }
  /* eslint-enable */
  t.notEqual(results[1].hitRatio, -1);
  t.notEqual(results[1].staleRatio, -1);
  t.notEqual(results[1].generates, -1);
  t.end();
});

tap.test('also handles nested methods', async t => {
  const results = [];
  server.events.on('log', (datum) => {
    results.push(datum.data);
  });
  const add = () => new Date();
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
    handler: (request, h) => {
      return { result: server.methods.myMethods.add(5) };
    }
  });
  /* eslint-disable  */
  for (let i = 0; i < 5; i++) {
    await server.inject({
      method: 'get',
      url: '/',
    });
    await wait(500);
  }
  /* eslint-enable */
  t.notEqual(results[1].hitRatio, -1);
  t.notEqual(results[1].staleRatio, -1);
  t.notEqual(results[1].generates, -1);
  t.end();
});
