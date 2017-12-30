const defaults = {
  verbose: false,
  interval: 1000 * 60, // report rate in milliseconds
  threshold: 0.5 // threshold percent beyond which to report
};

const register = (server, passedOptions) => {
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
  const logObject = (object, prefix) => {
    Object.keys(object).forEach((key) => {
      const method = object[key];
      const logKey = prefix ? `${prefix}.${key}` : key;
      if (typeof method === 'object') {
        logObject(method, logKey);
      }
      if (typeof method === 'function') {
        if (method.cache) {
          logMethod(logKey, method);
        }
      }
    });
  };
  let running = true;
  const onTimer = () => {
    logObject(server.methods);
    if (running) {
      setTimeout(onTimer, options.interval);
    }
  };
  onTimer();
  server.events.on('stop', () => { running = false; });
};

exports.plugin = {
  name: 'hapi-cache-stats',
  register,
  once: true,
  pkg: require('./package.json')
};
