/**
 * Copyright 2016,2020 (C) Jonas Andreasson
 * License: MIT
 */
import { Watchdog } from './watchdog';
import { WatchdogOptions } from './watchdog-options';

/**
 * Module entry point, returns a instance of {@link Watchdog}.
 * @param options
 * @returns a instance of {@link Watchdog}
 */
export function connect(options: WatchdogOptions): Watchdog {
  return new Watchdog(options);
}
