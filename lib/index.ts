/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventEmitter } from 'events';
import _ from 'lodash';
import { stringify } from 'querystring';
import { SUPPORTED_METHODS } from 'telldus-live-constants';
import { API } from 'telldus-live-promise';
import TypedEmitter from 'typed-emitter';

/**
 * Copyright 2016,2020 (C) Jonas Andreasson
 * License: MIT
 */

/**
 * Module entry point, returns a instance of {@link Watchdog}.
 * @param options
 * @returns a instance of {@link Watchdog}
 */
export function connect(options: WatchdogOptions): Watchdog {
  return new Watchdog(options);
}

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

/**
 * Represents a generic device as returned from telldus API.
 */
export interface Device {
  readonly id: string;
  [key: string]: any;
}

/**
 * Return value from the API call.
 */
interface DevicesResponse {
  device: Device[];
}

/**
 * Watchdog supported event types and callback signatures.
 */
interface WatchdogEvents {
  deviceChanged: (d: Device) => void;
  error: (e: Error) => void;
  info: (i: string) => void;
}

type WatchdogEmitter = TypedEmitter<WatchdogEvents>;

/**
 * Main class, a instance of this class is returned from the
 * exported 'connect' function.
 *
 * Periodically polls the all devices from the telldus live service,
 * if a new device has been added or the state (any value) of the existing
 * devices has changed, a event is emitted.
 */
class Watchdog {
  /**
   * @param opts - options on how to connect to telldus live and
   * with what period to poll the service for changes.
   */
  constructor(opts: WatchdogOptions) {
    this._options = this._injectDefaults(opts);
    this._emitter = new EventEmitter();
    this.telldusApi = API(this._options);
    this._run = false;
  }

  private _options: WatchdogOptions;
  private _emitter: WatchdogEmitter;
  private telldusApi: API;
  private _run: boolean;
  private _knownStates?: DevicesResponse;
  private _timeOut?: NodeJS.Timeout;

  /**
   * Registers a event listener to the instance
   *
   * @param name - name of the event to listen to, can be
   * 'deviceChanged', 'error' and 'info'
   * @param  cb - callback that will be called on the event
   * @returns a reference to this making it possible to
   * chain calls
   */
  on<E extends keyof WatchdogEvents>(
    event: E,
    listener: WatchdogEvents[E]
  ): this {
    const eventTypes = ['deviceChanged', 'error', 'info'];

    if (
      eventTypes.find((element) => {
        return element === event;
      })
    ) {
      this._emitter.on(event, listener);
    } else {
      throw new Error('Event type ' + event + ' is not supported');
    }
    return this;
  }

  /**
   * Starts polling the telldus service emitting events when changes
   * are detected.
   */
  start() {
    this._run = true;
    if (this._knownStates) {
      this._pollAndEmit();
    } else {
      this._initialPoll();
    }
  }

  /**
   * Stop polling the telldus service
   */
  stop() {
    this._run = false;
    if (this._timeOut) {
      clearTimeout(this._timeOut);
      this._timeOut = undefined;
    }
  }

  /**
   * Private methods
   */

  /**
   * Injects default values into the options object if missing
   *
   * @param opts - Input options object
   * @returns {object} - The same object with defaults injected if missing
   * @private
   */
  _injectDefaults(opts) {
    if (!opts.pollInterval) {
      opts.pollInterval = 1000 * 5;
    }
    if (!opts.errorBackOff) {
      opts.errorBackOff = 1000 * 60 * 3;
    }
    return opts;
  }

  /**
   * @returns {Promise} that completes a initial poll to the Telldus service,
   * the data from this poll will be used to determine if a change has happened.
   * Once the initial poll is completed, the continuous polling is started.
   * @private
   */
  _initialPoll() {
    return new Promise<DevicesResponse>(() => {
      this._fetchDevices()
        .then((devices) => {
          if (this._run) {
            this._knownStates = devices;
            return this._pollAndEmit(this._options.pollInterval);
          }
        })
        .catch((error) => {
          if (this._run) {
            this._emitInfo(
              'Received a error from the telldus service when priming states, ' +
                'backing off for ' +
                this._options.errorBackOff +
                ' ms'
            );
            this._emitError(error);
            this._timeOut = setTimeout(
              () => {
                return this._initialPoll();
              },
              this._options.errorBackOff ? this._options.errorBackOff : 0
            );
          }
        });
    });
  }

  /**
   * @returns A promise that polls the telldus API after a time interval,
   * on successful poll a event is emitted to registered listeners if the
   * state of any devices has changed since last poll. On error, emits an
   * error event and backs off for a given time period before trying again.
   */
  _pollAndEmit(interval = 0) {
    return new Promise<DevicesResponse>((resolve) => {
      this._timeOut = setTimeout(() => {
        this._fetchDevices()
          .then((devices) => {
            this._knownStates = this._parseDevices(this._knownStates, devices);
            resolve(this._pollAndEmit(this._options.pollInterval));
          })
          .catch((error: unknown) => {
            this._emitInfo(
              `Received a error from the telldus service, backing off
               for ${this._options.errorBackOff} ms`
            );
            this._emitError(error);
            this._timeOut = setTimeout(() => {
              resolve(this._pollAndEmit(this._options.errorBackOff));
            }, interval);
          });
      }, interval);
    });
  }

  _emitDeviceChanged(device) {
    this._emitter.emit('deviceChanged', device);
  }

  _emitError(error) {
    this._emitter.emit('error', error);
  }

  _emitInfo(info) {
    this._emitter.emit('info', info);
  }

  /**
   * Analyse a array of device data, compare it with the previously known state.
   * When a change in state is detected, emit relevant events.
   *
   * @param knownDevicesState
   * @param newDevicesState
   * @private
   */
  _parseDevices(
    knownDevicesState: DevicesResponse | undefined,
    newDevicesState: DevicesResponse
  ) {
    newDevicesState.device.forEach((newState) => {
      if (!knownDevicesState) {
        throw new Error('Unknown old state');
      }
      const oldState = knownDevicesState.device.filter((d) => {
        return d.id === newState.id;
      });

      if (oldState.length > 1) {
        this._emitInfo(
          `Invalid data, duplicate device id.(id: %s) 
          ${oldState[0].id}`
        );
      }

      // Device not seen before, emit event
      if (oldState.length === 0) {
        this._emitDeviceChanged(newState);
      } else if (!_.isEqual(oldState[0], newState)) {
        // If the new and old versions differ, emit event
        this._emitDeviceChanged(newState);
      }
    });

    return newDevicesState;
  }

  /**
   * @returns {Promise} Promise that resolves into a array of devices polled
   * from the telldus live service.
   * @private
   */

  _fetchDevices(): Promise<DevicesResponse> {
    const queryParams = {
      supportedMethods: SUPPORTED_METHODS,
      includeIgnored: 1,
    };

    return this.telldusApi.request(
      '/devices/list?'.concat(stringify(queryParams))
    );
  }
}
