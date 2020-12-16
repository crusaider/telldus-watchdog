import * as dotenv from 'dotenv';
import { connect, Device } from '../lib';
dotenv.config();
/**
 * Run to test integration. Create a .env file in the root of the repo
 * containing the secretes obtained from the telldus api website.
 *
 * Copyright 2016,2020 (C) Jonas Andreasson
 * License: MIT
 */

const watchDog = connect({
  telldusPublicKey: process.env.TELLDUS_PUBLIC_KEY || '',
  telldusPrivateKey: process.env.TELLDUS_PRIVATE_KEY || '',
  telldusToken: process.env.TELLDUS_TOKEN || '',
  telldusTokenSecret: process.env.TELLDUS_SECRET || '',
});

console.log('Connected');

watchDog.on('deviceChanged', (device: Device) => {
  console.log(`Device change detected, device id: ${(device as Device).id}`);
});

watchDog.on('info', (message: string) => {
  console.log('Info: ', message);
});

watchDog.on('error', (error: Error) => {
  console.log('Error: ', error);
});

process.on('SIGINT', () => {
  watchDog.stop();
});

process.on('SIGHUP', () => {
  watchDog.stop();
});

watchDog.start();
