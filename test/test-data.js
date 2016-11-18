/**
 * Copyright 2016 (C) Jonas Andreasson
 * License: MIT
 */

module.exports.zeroDevices = {
  device: []
};


module.exports.twoDevices = {
  device: [
    {
      id: '1268445',
      clientDeviceId: '12',
      name: 'General lights group 1',
      state: 2,
      statevalue: null,
      methods: 3,
      type: 'group',
      client: '200262',
      clientName: 'A place',
      online: '1',
      editable: 1,
      ignored: 0,
      devices: '1283624,1283628'
    },
    {
      id: '1283624',
      clientDeviceId: '23',
      name: 'General lights group 2',
      state: 1,
      statevalue: null,
      methods: 3,
      type: 'group',
      client: '200262',
      clientName: 'A place',
      online: '1',
      editable: 1,
      ignored: 1,
      devices: '1193618,1193622'
    }
  ]
};

module.exports.duplicateDevices = {
  device: [
    {
      id: '1268445',
      clientDeviceId: '12',
      name: 'General lights group 1',
      state: 2,
      statevalue: null,
      methods: 3,
      type: 'group',
      client: '200262',
      clientName: 'A place',
      online: '1',
      editable: 1,
      ignored: 0,
      devices: '1283624,1283628'
    },
    {
      id: '1268445',
      clientDeviceId: '12',
      name: 'General lights group 1',
      state: 2,
      statevalue: null,
      methods: 3,
      type: 'group',
      client: '200262',
      clientName: 'A place',
      online: '1',
      editable: 1,
      ignored: 0,
      devices: '1283624,1283628'
    },
  ]
};
