# telldus-watchdog [![NPM version][npm-image]][npm-url] ![](https://github.com/crusaider/telldus-watchdog/workflows/Build%20on%20push/badge.svg?branch=master) [![Dependency Status][daviddm-image]][daviddm-url]

> Node module that can watch changes in the Telldus live service and emit a event when the state (any value) of a device has changed.

## Installation

```sh
$ npm install --save telldus-watchdog
```

## Example

```js
import { connect } from 'telldus-watchdog';

var options = {
  telldusPublicKey: '[public key]',
  telldusPrivateKey: '[private key]',
  telldusToken: '[token]',
  telldusTokenSecret: '[token secret]'
};

const watchDog = connect(options);

watchDog.on('deviceChanged', (device) => {
  console.log('Device change detected, device id: ' + device.id);
});

process.on('SIGINT', () => {
  watchDog.stop();
});

process.on('SIGHUP', () => {
  watchDog.stop();
});

watchDog.start();
```

## API

- [twd.connect()](#connect)
- [twd.Watchdog.on()](#on)
- [twd.Watchdog.start()](#start)
- [twd.Watchdog.stop()](#stop)

### <a name="connect"></a>twd.connect(options)

Creates a immutable Watchdog object to monitor the telldus live service for changes.
The options object is required to contain 4 keys , `telldusPublicKey`, `telldusPrivateKey`, `telldusToken` and `telldusTokenSecret`, that can be generated on [http://api.telldus.com](http://api.telldus.com) for the account that is to be monitored. The options object can optionally also include the following fields:

- `pollInterval` - sets the poll interval in milliseconds, i.e. how often the telldus live service is polled for changes. If not set the default value is 5 000 milliseconds (3 seconds).
- `errorBackOff` - sets the time the watchdog will pause polling if a error is received from the telldus live service in milliseconds. If not set the default value is 18 000 milliseconds (3 minutes).

### <a name="on"></a>twd.Watchdog#on(event, callback)

Register a event callback for a given event type.

#### Event `'deviceChanged'`

`function (device) {}`

Emitted for every device where the watchdog detects a change in any property of the device since the last poll (or the watchdog was started). The device object as returned from the telldus live api.

#### Event `'error'`

`function (error) {}`

Emitted when a error is thrown from the telldus live api. The error object is supplied.

#### Event `'info'

`function (info) {}`

Emitted when a relevant information is available, information passed as a string.

### <a name="start"></a>twd.Watchdog#start()

Starts the polling. If this is the first time the object is started will prime it state by polling once to get the value of all devices. Any chnages to any values after this point will be emitted as change events. If a new device is added to the service this will also be emitted as a chnage event.

### <a name="stop"></a>twd.Watchdog#stop()

Stops polling, polling can be started again by calling the start method.

## TODO

- Test coverage is not 100%
- Monitor changes in telldus sensors (currently only devices)

## License

MIT © [Jonas Andreasson](https://twitter.com/Crusaider)

[npm-image]: https://badge.fury.io/js/telldus-watchdog.svg
[npm-url]: https://npmjs.org/package/telldus-watchdog
[daviddm-image]: https://david-dm.org/crusaider/telldus-watchdog.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/crusaider/telldus-watchdog
