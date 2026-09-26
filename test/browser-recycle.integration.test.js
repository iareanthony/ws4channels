'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

// Run against an isolated container with BROWSER_RECYCLE_INTERVAL_MS=15000:
// RECYCLE_TEST_URL=http://127.0.0.1:19798 node --test test/browser-recycle.integration.test.js
const base = process.env.RECYCLE_TEST_URL;
test('browser recycling preserves HLS output and resumes fresh captures', {
  skip: !base, timeout: 120000,
}, async () => {
  let initial;
  let recovering;
  let recovered;
  let firstSequence;
  let lastSequence;
  const recoverySequences = [];
  const deadline = Date.now() + 110000;
  while (Date.now() < deadline) {
    const response = await fetch(`${base}/health`);
    const health = await response.json();
    if (health.ready && !initial) initial = health;
    if (initial) {
      const playlist = await (await fetch(`${base}/stream/stream.m3u8`)).text();
      const match = playlist.match(/#EXT-X-MEDIA-SEQUENCE:(\d+)/);
      if (match) {
        const sequence = Number(match[1]);
        firstSequence ??= sequence;
        if (lastSequence !== undefined) assert.ok(sequence >= lastSequence, 'HLS sequence regressed');
        lastSequence = sequence;
        if (health.browserRecovering) recoverySequences.push(sequence);
      }
      if (health.browserRestarts > initial.browserRestarts && health.browserRecovering) recovering = health;
      if (recovering && !health.browserRecovering && health.lastCaptureAt > recovering.lastCaptureAt) {
        recovered = health;
        break;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert.ok(initial, 'initial stream never became ready');
  assert.ok(recovering, 'no browser cleanup observed');
  assert.ok(recovered?.ready, 'fresh capture did not resume');
  assert.ok(recovered.fallbackFrames > initial.fallbackFrames, 'no fallback frames written');
  assert.ok(lastSequence > firstSequence, 'HLS did not advance');
  assert.ok(new Set(recoverySequences).size >= 2, 'HLS stalled during cleanup');
  console.log(JSON.stringify({ initial, recovering, recovered, firstSequence, lastSequence }));
});
