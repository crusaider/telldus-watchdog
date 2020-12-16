/**
 * Copyright 2016,2020 (C) Jonas Andreasson
 * License: MIT
 */

/**
 * Represents a generic device as returned from telldus API.
 */
export interface Device {
  readonly id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
