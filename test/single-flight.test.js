'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { SingleFlight } = require('../lib/single-flight');

test('coalesces concurrent recovery requests into one operation', async () => {
  const gate = new SingleFlight();
  let operations = 0;
  let release;
  const blocked = new Promise(resolve => { release = resolve; });
  const task = async () => {
    operations++;
    await blocked;
    return 'ready';
  };

  const first = gate.run(task);
  const second = gate.run(task);
  const third = gate.run(task);

  assert.equal(first, second);
  assert.equal(second, third);
  assert.equal(operations, 1);
  release();
  assert.deepEqual(await Promise.all([first, second, third]), ['ready', 'ready', 'ready']);
});

test('allows a new operation after the previous one settles', async () => {
  const gate = new SingleFlight();
  let operations = 0;
  await gate.run(async () => ++operations);
  await gate.run(async () => ++operations);
  assert.equal(operations, 2);
});

test('enforces a minimum delay between operations', async () => {
  let now = 10_000;
  const delays = [];
  const gate = new SingleFlight({
    minimumDelayMs: 5_000,
    now: () => now,
    sleep: async ms => {
      delays.push(ms);
      now += ms;
    }
  });

  await gate.run(async () => {});
  now += 1_000;
  await gate.run(async () => {});
  assert.deepEqual(delays, [4_000]);
});

test('clears the in-flight operation after failure', async () => {
  const gate = new SingleFlight();
  await assert.rejects(gate.run(async () => { throw new Error('launch failed'); }));
  await assert.doesNotReject(gate.run(async () => 'ready'));
});
