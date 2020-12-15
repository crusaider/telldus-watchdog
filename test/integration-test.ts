/**
 * Run to test integration. Create a .env file in the root of the repo
 * containing the secretes obtained from the telldus api website.
 *
 * Copyright 2016,2020 (C) Jonas Andreasson
 * License: MIT
 */

import * as dotenv from 'dotenv';
import { connect } from '../lib';
dotenv.config();

const options = {
  telldusPublicKey: process.env.TELLDUS_PUBLIC_KEY,
  telldusPrivateKey: process.env.TELLDUS_PRIVATE_KEY,
  telldusToken: process.env.TELLDUS_TOKEN,
  telldusTokenSecret: process.env.TELLDUS_SECRET,
};

const watchDog = connect(options);

console.log('Connected');

watchDog.on('deviceChanged', (device: Record<string, unknown>) => {
  console.log('Device change detected, device id: ' + device.id);
});

watchDog.on('info', (m: unknown) => {
  console.log('Info: ', m);
});

watchDog.on('error', (m: unknown) => {
  console.log('Error: ', m);
});

process.on('SIGINT', () => {
  watchDog.stop();
});

process.on('SIGHUP', () => {
  watchDog.stop();
});

watchDog.start();
