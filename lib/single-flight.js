'use strict';

class SingleFlight {
  constructor({ minimumDelayMs = 0, now = Date.now, sleep } = {}) {
    this.minimumDelayMs = minimumDelayMs;
    this.now = now;
    this.sleep = sleep || (ms => new Promise(resolve => setTimeout(resolve, ms)));
    this.inFlight = null;
    this.lastStartedAt = 0;
  }

  run(task) {
    if (this.inFlight) return this.inFlight;

    this.inFlight = (async () => {
      const delay = Math.max(0, this.minimumDelayMs - (this.now() - this.lastStartedAt));
      if (delay > 0) await this.sleep(delay);
      this.lastStartedAt = this.now();
      return task();
    })();

    this.inFlight.finally(() => {
      this.inFlight = null;
    }).catch(() => {});

    return this.inFlight;
  }
}

module.exports = { SingleFlight };
