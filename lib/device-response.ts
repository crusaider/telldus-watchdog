/**
 * Copyright 2016,2020 (C) Jonas Andreasson
 * License: MIT
 */
import { Device } from './device';

/**
 * Return value from the API call.
 */
export interface DevicesResponse {
  device: Device[];
}
