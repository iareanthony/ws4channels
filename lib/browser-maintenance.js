'use strict';
const fs = require('node:fs');

class BrowserMaintenance {
  constructor(interval = 6 * 60 * 60 * 1000, now = Date.now) {
    this.interval = Number(interval);
    if (!Number.isSafeInteger(this.interval) || this.interval < 0 ||
        (this.interval > 0 && this.interval < 10000)) {
      throw new Error('BROWSER_RECYCLE_INTERVAL_MS must be 0 (disabled) or an integer >= 10000');
    }
    this.now = now;
    this.readyAt = null;
  }
  markReady() { this.readyAt = this.now(); }
  due() {
    return this.interval > 0 && this.readyAt !== null && this.now() - this.readyAt >= this.interval;
  }
  ageSeconds() {
    return this.readyAt === null ? null : Math.floor((this.now() - this.readyAt) / 1000);
  }
}

function memoryUsage() {
  const mb = bytes => Math.round(bytes / 1048576);
  const node = process.memoryUsage();
  const result = { nodeRssMiB: mb(node.rss), nodeHeapMiB: mb(node.heapUsed) };
  // Includes Chromium, FFmpeg and reclaimable cache; not just the Node heap.
  try {
    result.containerMiB = mb(Number(fs.readFileSync('/sys/fs/cgroup/memory.current', 'utf8')));
    const limit = fs.readFileSync('/sys/fs/cgroup/memory.max', 'utf8').trim();
    result.containerLimitMiB = limit === 'max' ? null : mb(Number(limit));
  } catch { /* cgroup v2 may be unavailable outside a container */ }
  return result;
}

module.exports = { BrowserMaintenance, memoryUsage };
