/**
 * Copyright 2016 (C) Jonas Andreasson
 * License: MIT
 */

'use strict';

const EventEmitter = require('events');
const _ = require('lodash');
const telldus = require('telldus-live-promise');
const telldusConst = require('telldus-live-constants');
var querystring = require('querystring');


/**
 * Module entry point, returns a instance of {Watchdog}.
 * @param options
 * @returns {Watchdog}
 */
module.exports.connect = (options) => {
  return new Watchdog(options);
};

/**
 * Main class, a instance of this class is returned from the
 * exported 'connect' funciton.
 *
 * Periodically polls the all devices from the telldus live service,
 * if a new device has been added or the state (any value) of the existing
 * devices has changed, a event is emitted.
 */
class Watchdog {
  /**
   * @param {object} opts - options on how to connect to telldus live and
   * with what period to poll the service for changes.
   * The options object is expected to conntain:
   *  telldusPublicKey
   *  telldusPrivateKey
   *  telldusToken
   *  telldusTokenSecret
   *  pollInterval (defaults to 5000 ms)
   *  errorBackOff (defaults to 18 000 ms)
   *
   */
  constructor(opts) {
    this._options = this._injectDefaults(opts);
    this._emitter = new EventEmitter();
    /* eslint new-cap: "off" */
    this.telldusApi = telldus.API(this._options);
    this._run = false;
    this._knownStates = undefined;
  }

  /**
   * Registers a event listener to the instance
   *
   * @param {string} name - name of the event to listen to, can be
   * 'deviceChanged', 'error' and 'info'
   * @param {function} cb - callback that will be called on the event
   * @returns {Watchdog} - a reference to this making it possible to
   * chain calls
   */
  on(name, cb) {

    let eventTypes = ['deviceChanged', 'error', 'info'];

    if (eventTypes.find((element) => {
        return element === name;
      })) {
      this._emitter.on(name, cb);
    } else {
      throw( new Error('Event type ' + name + ' is not supported'));
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
    if (!opts.hasOwnProperty('pollInterval')) {
      opts.pollInterval = 1000 * 5;
    }
    if (!opts.hasOwnProperty('errorBackOff')) {
      opts.errorBackOff = 1000 * 60 * 3;
    }
    return opts;
  }

  /**
   * @returns {Promise} that completes a initial poll to the Telldus service,
   * the data from this poll will be used to determine if a change has happened.
   * Once the initial poll is completed, thecontinuouss polling is started.
   * @private
   */
  _initialPoll() {
    let self = this;
    return new Promise(() => {
      self._fetchDevices().then((devices) => {
        if (self._run) {
          self._knownStates = devices;
          return self._pollAndEmit(self._options.pollInterval);
        }
      }).catch((error) => {
        if (self._run) {
          self._emitInfo('Received a error from the telldus service when priming states, ' +
            'backing off for ' + self._options.errorBackOff + ' ms');
          self._emitError(error);
          self._timeOut = setTimeout(() => {
            return self._initialPoll();
          }, self._options.errorBackOff);
        }
      });
    });
  }

  /**
   * @returns {Promise} that polls the telldus API after a time interval,
   * on successful poll a event is emitted to registered listeners if the
   * state of any devices has changed since last poll. On error, emits an
   * error event and backs off for a given time period before trying again.
   */
  _pollAndEmit(interval) {
    let self = this;
    return new Promise(function (resolve) {
      self._timeOut = setTimeout(function () {
        self._fetchDevices().then(function (devices) {
          self._knownStates = self._parseDevices(self._knownStates, devices);
          resolve(self._pollAndEmit(self._options.pollInterval));
        }).catch(function (error) {
          self._emitInfo('Received a error from the telldus service, ' +
            'backing off for ' + self._options.errorBackOff + ' ms');
          self._emitError(error);
          self._timeOut = setTimeout(function () {
            resolve(self._pollAndEmit(self._options.errorBackOff));
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
  _parseDevices(knownDevicesState, newDevicesState) {
    newDevicesState.device.forEach((newState) => {
      var oldState = knownDevicesState.device.filter(
        (d) => {
          return d.id === newState.id;
        });

      if (oldState.length > 1) {
        this._emitInfo('Invalid data, duplicate device id.(id: %s)',
          oldState[0].id);
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

  _fetchDevices() {
    var queryParams = {
      supportedMethods: telldusConst.SUPPORTED_METHODS,
      includeIgnored: 1
    };

    return this.telldusApi.request('/devices/list?'
      .concat(querystring.stringify(queryParams)));
  }
}
