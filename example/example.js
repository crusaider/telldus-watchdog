/**
 * Copyright 2016 (C) Jonas Andreasson
 * License: MIT
 */

var twd = require('telldus-watchdog');

var options = {
  telldusPublicKey: '[public key]',
  telldusPrivateKey: '[private key]',
  telldusToken: '[token]',
  telldusTokenSecret: '[token secret]'
};

watchDog = twd.connect(options);

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
