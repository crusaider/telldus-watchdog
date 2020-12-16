/**
 * Copyright 2016,2020 (C) Jonas Andreasson
 * License: MIT
 */

import { connect } from 'telldus-watchdog';

var options = {
  telldusPublicKey: '[public key]',
  telldusPrivateKey: '[private key]',
  telldusToken: '[token]',
  telldusTokenSecret: '[token secret]',
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
