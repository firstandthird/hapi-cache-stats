'use strict';
const Logr = require('logr');
const logrFlat = require('logr-flat');
const defaults = {
  interval: 1000 * 60, // report rate in milliseconds
  threshold: 50 // threshold percent beyond which to report
};

const log = Logr.createLogger({
  type: 'flat',
  reporters: {
    flat: {
      reporter: logrFlat
    }
  }
});

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
    log([methodName, 'hapi-cache-stats'], method.cache.stats);
  };

  const onTimer = () => {
    Object.keys(server.methods).forEach((key) => {
      const method = server.methods[key];
      if (method.cache) {
        logMethod(key, method);
      }
    });
    setTimeout(onTimer, options.interval);
  };
  onTimer();
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};
