/**
 * Copyright 2016,2020 (C) Jonas Andreasson
 * License: MIT
 */
export type WatchdogOptions = {
  // Telldus API secrets
  readonly telldusPublicKey: string;
  readonly telldusPrivateKey: string;
  readonly telldusToken: string;
  readonly telldusTokenSecret: string;

  // Period of time between pools to the Telldus api, defaults to 5 s.
  readonly pollInterval?: number;

  // Period of time to back of from polls on error, defaults to 3 min.
  readonly errorBackOff?: number;
};
