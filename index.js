'use strict';
const flat = require('flat');

const defaults = {
  verbose: false,
  interval: 1000 * 60, // report rate in milliseconds
  threshold: 0.5 // threshold percent beyond which to report
};

exports.register = (server, passedOptions, next) => {
  const options = {};
  Object.assign(options, defaults, passedOptions);
  const logMethod = (methodName, method) => {
    const stats = method.cache.stats;
    const logOutput = {
      hitRatio: stats.hits / stats.gets,
      staleRatio: stats.stales / stats.gets
    };
    Object.assign(logOutput, method.cache.stats);
    if (options.verbose) {
      server.log(['hapi-cache-stats', methodName], logOutput);
    }
    if (logOutput.hitRatio < options.threshold) {
      server.log(['hapi-cache-stats', methodName, 'warning'], `Hit ratio of ${logOutput.hitRatio} is lower than threshold of ${options.threshold}`);
    }
  };
  let running = true;
  const onTimer = () => {
    const methods = flat(server.methods);
    Object.keys(methods).forEach((key) => {
      const method = methods[key];
      if (method.cache) {
        logMethod(key, method);
      }
    });
    if (running) {
      setTimeout(onTimer, options.interval);
    }
  };
  onTimer();
  server.on('stop', () => { running = false; });
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};
