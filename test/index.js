'use strict';

var assert = require('assert');
var sinon = require('sinon');
var lolex = require('lolex');
var mockery = require('mockery');

var data = require('./test-data');

describe('telldus-wd', () => {
  /**
   * Mock the telldus-live-promise API
   */
  var requestSpy = sinon.spy(() => {
    return new Promise(function (resolve) {
      resolve(data.twoDevices);
    });
  });

  var telldusApi = {
    API: () => {
      return {
        request: requestSpy
      };
    }
  };

  beforeEach(() => {
    mockery.enable({useCleanCache: true});
    mockery.registerAllowables([
      '../lib',
      'events',
      'lodash',
      'querystring'
    ]);
    mockery.registerMock('telldus-live-promise', telldusApi);
  });

  afterEach(() => {
    mockery.deregisterMock('telldus-live-promise');
    mockery.disable();
  });

  describe('#connect', () => {
    it('shold return a object of class Watchdog', () => {
      var twd = require('../lib');

      var wd = twd.connect({});

      assert.equal(wd.constructor.name, 'Watchdog');
    });
  });

  describe('Watchdog', () => {
    /**
     * Instanciate the object to test
     */
    let wd;


    beforeEach('connect', () => {
      let twd = require('../lib');
      wd = twd.connect({});
    });

    describe('public methods', () => {
      describe('#on', () => {
        it('should trigger the newListener event', (done) => {
          let callbackSpy = sinon.spy();

          wd._emitter.on('newListener', function (name, ca) {
            assert.equal(name, 'deviceChanged');
            assert.equal(ca, callbackSpy);
            done();
          });

          assert.equal(wd.on('deviceChanged', callbackSpy), wd, 'did not return a reference to itself');
        });

        it('should throw an error', () => {
          let onSpy = sinon.spy(wd, 'on');
          try {
            wd.on('invalidEventType', undefined);
          } catch (error) {
          }

          assert(onSpy.threw());
        });
      });

      describe('#start', () => {
        beforeEach('install spies', () => {
          wd._pollAndEmit = sinon.spy();
          wd._initialPoll = sinon.spy();
        });

        it('should call _initialPoll if state is unknown', () => {
          wd.start();
          assert(wd._run);
          assert(wd._initialPoll.called);
          assert(wd._pollAndEmit.notCalled);
        });

        it('should call _initialPoll if state is known', () => {
          wd._knownStates = {};
          wd.start();
          assert(wd._run);
          assert(wd._initialPoll.notCalled);
          assert(wd._pollAndEmit.called);
        });
      });
      describe('#stop', () => {
        let clearTimeoutSpy;
        before('install mocked clearTimeout', () => {
          clearTimeoutSpy = sinon.spy(global, 'clearTimeout');
        });

        after('deinstall mock', () => {
          clearTimeoutSpy.restore();
        });

        it('should clear the timeout', () => {
          wd._timeOut = 1000;
          wd.stop();
          assert(clearTimeoutSpy.calledOnce);
          assert(clearTimeoutSpy.calledWith(1000));
        });
        it('should set the run status to false', () => {
          wd.stop();
          assert(!wd._run);
        });
      });
    });

    describe('private methods', () => {
      describe('#_injectDefaults', () => {
        it('should set default values', () => {
          var opts = wd._injectDefaults({});
          assert(opts.hasOwnProperty('pollInterval'));
          assert.equal(opts.pollInterval, 1000 * 5);
          assert(opts.hasOwnProperty('errorBackOff'));
          assert.equal(opts.errorBackOff, 1000 * 60 * 3);
        });
      });

      describe('emitters', () => {
        describe('#_emitDeviceChanged', () => {
          it('should emit a "deviceChanged" event', (done) => {
            var emittedDevice = {};

            wd.on('deviceChanged', function (device) {
              assert.equal(device, emittedDevice);
              done();
            });

            wd._emitDeviceChanged(emittedDevice);
          });
        });

        describe('#_emitError', () => {
          it('should emit a "error" event', (done) => {
            var emittedError = {};

            wd.on('error', function (error) {
              assert.equal(error, emittedError);
              done();
            });

            wd._emitError(emittedError);
          });
        });

        describe('#_emitInfo', () => {
          it('should emit a "info" event', (done) => {
            var emittedInfo = {};

            wd.on('info', function (info) {
              assert.equal(info, emittedInfo);
              done();
            });

            wd._emitInfo(emittedInfo);
          });
        });
      });

      describe('request loop', () => {
        describe('#_initialPoll', () => {
          it('should fetch devices and start continuous poll', (done) => {
            wd._fetchDevices = sinon.spy(() => {
              return new Promise(function (resolve) {
                resolve(data.twoDevices);
              });
            });

            wd._pollAndEmit = sinon.spy(function (interval) {
              assert.equal(interval, wd._options.pollInterval);
              assert(wd._fetchDevices.calledOnce);
              assert.deepEqual(wd._knownStates, data.twoDevices);
              done();
            });

            wd._run = true;
            wd._options.pollInterval = 1000;

            wd._initialPoll();
          });


          /*
           // TODO: Fix the broken test
           describe('using virtual time', () => {
           var clock;
           beforeEach('install lolex', () => {
           clock = lolex.install();
           });

           afterEach('uninstall lolex', () => {
           clock.uninstall();
           });

           it('should back off for a given interval and then try again', (done) => {
           var error = {error: 'Failed'};

           wd._fetchDevices = sinon.spy(() => {
           var callCount = 0;
           return new Promise((resolve, reject) => {
           if (callCount === 0) {
           callCount++;
           reject(error);
           } else {
           resolve(data.twoDevices);
           }
           });
           });

           wd._run = true;
           wd._options.errorBackOff = 5000;
           wd._emitInfo = sinon.spy();
           wd._emitError = sinon.spy();

           wd._pollAndEmit = sinon.spy(() => {
           assert(wd._fetchDevices.calledTwice);
           assert(wd._emitInfo.calledOnce);
           assert(wd._emitError.calledOnce);
           assert(wd._emitError.calledWith(error));
           done();
           });

           wd._initialPoll();
           clock.tick(wd._options.errorBackOff + 10);
           });
           });
           */
        });

        describe('#_pollAndEmit', () => {
          // TODO: Implement test
        });
      });

      describe('#_parseDevices', () => {
        it('should emit two changed events', () => {
          wd._emitDeviceChanged = sinon.spy();

          var retVal = wd._parseDevices(data.zeroDevices, data.twoDevices);

          assert(wd._emitDeviceChanged.calledTwice);
          assert.equal(retVal, data.twoDevices);
        });

        it('should emit one info event', () => {
          wd._emitDeviceChanged = sinon.spy();
          wd._emitInfo = sinon.spy();

          var retVal = wd._parseDevices(data.duplicateDevices, data.twoDevices);

          assert(wd._emitDeviceChanged.calledOnce);
          assert(wd._emitInfo.calledOnce);
          assert.equal(retVal, data.twoDevices);
        });
      });

      describe('#_fetchDevices', () => {
        it('should call the request api', (done) => {
          wd._fetchDevices().then((devices) => {
            assert(requestSpy.calledOnce, 'The request function was not called once');
            assert.deepEqual(devices, data.twoDevices);
            done();
          });
        });
      });
    });
  });
});
