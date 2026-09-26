'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { BrowserMaintenance } = require('../lib/browser-maintenance');

test('recycles only after a full interval from a successful launch', () => {
  let now = 0;
  const maintenance = new BrowserMaintenance(10000, () => now);
  assert.equal(maintenance.due(), false);
  maintenance.markReady();
  now = 9999;
  assert.equal(maintenance.due(), false);
  now = 10000;
  assert.equal(maintenance.due(), true);
  // A failed relaunch never calls markReady, so recovery remains due.
  now = 20000;
  assert.equal(maintenance.due(), true);
  maintenance.markReady();
  assert.equal(maintenance.due(), false);
  assert.equal(maintenance.ageSeconds(), 0);
});

test('supports disabled cleanup and rejects unsafe intervals', () => {
  const disabled = new BrowserMaintenance('0', () => 100000);
  disabled.markReady();
  assert.equal(disabled.due(), false);
  for (const value of ['bad', '-1', '1', '10000.5', 'Infinity']) {
    assert.throws(() => new BrowserMaintenance(value), /BROWSER_RECYCLE_INTERVAL_MS/);
  }
  assert.equal(new BrowserMaintenance().interval, 21600000);
});
