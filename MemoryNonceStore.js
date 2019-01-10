const locks = require('locks');
const clone = require('fast-clone');
const schedule = require('node-schedule');
const isNumber = require('is-number');

// The max age of an acceptable nonce
const EXPIRY_SEC = 55; // Needs to be at least 10s and no more than 55s
const EXPIRY_MS = EXPIRY_SEC * 1000;

class MemoryNonceStore {
  constructor() {
    // Record start time (nothing older than start will be allowed)
    this.startTime = Date.now();

    // Maps: nonce => true/false (was used in last expiryTime)
    // - Newly used nonces are added to isUsedPrime
    // - Each "rotation", nonces are moved from isUsedPrime => isUsedSecondary
    //     and nonces in isUsedSecondary are deleted
    // - Rotations occur on the minute
    // - Because rotations occur every minute, the shortest a nonce will be
    //     stored is one minute. Thus, the expiry time must be less than 60s,
    //     55s to be safe
    this.isUsedMutex = locks.createMutex();
    this.isUsedPrime = {};
    this.isUsedSecondary = {};

    // Schedule rotation for every minute
    schedule.scheduleJob('* * * * *', () => {
      this._rotate();
    });
  }

  /**
   * Checks if a new nonce is valid, mark it as used
   * @param {string} nonce - OAuth nonce
   * @param {string} timestamp - OAuth timestamp
   * @return Promise that resolves if nonce is valid, rejects with error if
   *   nonce is invalid.
   */
  check(nonce, timestampSecs) {
    return new Promise((resolve, reject) => {
      // Check if nonce
      if (!nonce || nonce.trim().length === 0) {
        return reject(new Error('No nonce included.'));
      }

      // Check timestamp
      // > Check if exists
      if (!timestampSecs || (timestampSecs + '').trim().length === 0) {
        return reject(new Error('No timestamp.'));
      }
      // > Check if is a number
      if (!isNumber(timestampSecs)) {
        return reject(new Error('Timestamp is not a number.'));
      }

      // Convert oauth timestamp to ms (we now know it's a number)
      const timestamp = timestampSecs * 1000;

      // > Check if from before start
      if (timestamp < this.startTime) {
        return reject(new Error('Nonce too old.'));
      }
      // > Check if expired
      const msDiff = Math.abs(Date.now() - timestamp);
      if (msDiff > EXPIRY_MS) {
        // Expired!
        return reject(new Error('Nonce expired.'));
      }

      // Manage nonce
      this.isUsedMutex.lock(() => {
        try {
          // Check if used
          if (this.isUsedPrime[nonce] || this.isUsedSecondary[nonce]) {
            // Already used
            this.isUsedMutex.unlock();
            return reject(new Error('Nonce already used.'));
          }

          // Mark as used
          this.isUsedPrime[nonce] = true;
          this.isUsedMutex.unlock();
          return resolve();
        } catch (err) {
          // An error occured!
          this.isUsedMutex.unlock();
          return reject(err);
        }
      });
    });
  }

  /**
   * Performs a maintenance rotation: nonces are moved from
   *   isUsedPrime => isUsedSecondary and nonces in isUsedSecondary are deleted
   */
  _rotate() {
    this.isUsedMutex.lock(() => {
      this.isUsedSecondary = clone(this.isUsedPrime);
      this.isUsedPrime = {};
      this.isUsedMutex.unlock();
    });
  }
}

module.exports = MemoryNonceStore;
