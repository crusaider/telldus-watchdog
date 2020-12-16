/**
 * Copyright 2016,2020 (C) Jonas Andreasson
 * License: MIT
 */
import TypedEmitter from 'typed-emitter';
import { Device } from './device';

/**
 * Watchdog supported event types and callback signatures.
 */
export interface WatchdogEvents {
  deviceChanged: (d: Device) => void;
  error: (e: Error) => void;
  info: (i: string) => void;
}

export type WatchdogEmitter = TypedEmitter<WatchdogEvents>;
