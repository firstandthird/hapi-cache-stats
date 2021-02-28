#hapi-cache-stats

hapi-cache-stats is a library that monitors the ratio of hits:gets
for your server method caches.  When a method's ratios fall below a given threshold
it will log the hit:get ratio and the stale:get ratio.

## Installation

```console
  npm install hapi-cache-stats
```

## Usage

```js
await server.register({
  plugin: require('hapi-cache-stats'),
  options: {
    interval: 500,
    threshold: 0.5
  }
});
```

And every server method that has cahcing enabled will be polled every 500 milliseconds,
if the ratio of hits:gets drops below _threshold_ it will notify you via server.log.

## options

- __interval__

   Report rate in milliseconds, default is 60000.

- __verbose__

  Set to true to log the hit:get and also the stale:get ratio every round.

- __threshold__

    Threshold as a value between 0.0 and 1.0.  When the hit:get ratio drops below this
    thresold hapi-cache-stats will announce it via server.log.
