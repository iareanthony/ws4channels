'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { streamOptions } = require('../lib/stream-options');

const available = spawnSync('ffmpeg', ['-version']).status === 0;
test('slow capture keeps real-time duration, two-second segments and compatible pixels', { skip: !available, timeout: 20000 }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ws4-timing-'));
  const frame = spawnSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=1280x720:rate=10', '-frames:v', '1', '-threads', '1', '-f', 'image2pipe', '-c:v', 'mjpeg', 'pipe:1']);
  assert.equal(frame.status, 0);
  const opts = streamOptions(10);
  const output = opts.output.filter(x => !x.startsWith('-map ')).flatMap(x => x.split(' '));
  const proc = spawn('ffmpeg', ['-v', 'error', '-f', 'image2pipe', ...opts.input.flatMap(x => x.split(' ')), '-i', 'pipe:0', '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000', '-shortest', ...output, path.join(dir, 'stream.m3u8')]);
  let errors = '';
  proc.stderr.on('data', x => { errors += x; });
  const exited = once(proc, 'exit');
  try {
    // Deliberately feed only four screenshots/sec to a nominal 10 fps stream.
    for (let i = 0; i < 32; i++) {
      proc.stdin.write(frame.stdout);
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    proc.stdin.end();
    const [code] = await exited;
    assert.equal(code, 0, errors);
    const playlist = fs.readFileSync(path.join(dir, 'stream.m3u8'), 'utf8');
    const durations = [...playlist.matchAll(/#EXTINF:([\d.]+)/g)].map(m => Number(m[1]));
    assert.ok(durations.length >= 4, playlist);
    assert.ok(durations.every(d => d <= 2.1), playlist);
    const total = durations.reduce((a, b) => a + b, 0);
    assert.ok(total >= 7.5 && total <= 9.5, `Duration ${total} must track wall time, not frame count`);
    const segment = playlist.split('\n').find(x => x.endsWith('.ts'));
    const probe = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=pix_fmt', '-of', 'json', path.join(dir, segment)]);
    assert.equal(JSON.parse(probe.stdout).streams[0].pix_fmt, 'yuv420p');
  } finally {
    if (proc.exitCode === null) proc.kill('SIGKILL');
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
