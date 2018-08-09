const locks = require('locks');
const schedule = require('node-schedule');

// The max age of an acceptable nonce
const EXPIRY_SEC = 60; // Needs to be at least 10s and no more than 60s
const EXPIRY_MS = EXPIRY_SEC * 1000;

class MemoryNonceStore {
  constructor(options) {
    // Record start time (nothing older than start will be allowed)
    this.startTime = Date.now();

    // Maps: nonce => true/false (was used in last expiryTime)
    this.isUsedMutex = locks.createMutex();
    this.isUsedPrime = {};
    this.isUsedSecondary = {};

    // Start rotation for every minute
    schedule.scheduleJob('* * * * *', () => {
      this._rotate
    });
  }

  /**
   * Checks if a new nonce is valid, mark it as used
   * @param {string} nonce - OAuth nonce
   * @param {string} timestamp - OAuth timestamp
   */
  check(nonce, timestamp) {
    return new Promise((resolve, reject) => {
      // Check if nonce
      if (!nonce || nonce.trim().length === 0) {
        return reject(new Error('No nonce included.'));
      }

      // Check timestamp
      // > Check if exists
      if (!timestamp || (timestamp + '').trim().length === 0) {
        return reject(new Error('No timestamp.'));
      }
      // > Check if is a number
      if (isNaN(timestamp)) {
        return reject(new Error('Timestamp is not a number.'));
      }
      // > Check if from before start
      if (timestamp < this.startTime) {
        return reject(new Error('Nonce too old.'));
      }
      // > Check if expired
      let msDiff = Math.abs(Date.now() - timestamp);
      if (msDiff > EXPIRY_MS) {
        // Expired!
        return reject(new Error('Nonce expired.'));
      }

      console.log(this.isUsedMutex);
      // Manage nonce
      this.isUsedMutex.lock(() => {
        console.log('Locked');
        // Check if used
        if (this.isUsedPrime[nonce] || this.isUsedSecondary[nonce]) {
          // Already used
          return reject(new Error('Nonce already used.'));
        }

        // Mark as used
        this.isUsedPrime[nonce] = true;

        this.isUsedMutex.unlock();
        return resolve();
      }).catch((err) => {
        this.isUsedMutex.unlock();
        return reject(err);
      });
    });
  }

  /**
   * Performs a maintenance rotation:
   * primary => secondary => expired
   */
  _rotate() {
    this.isUsedMutex.lock(() => {
      this.isUsedSecondary = this.isUsedPrime;
      this.isUsedPrime = {};
      this.isUsedMutex.unlock();
    });
  }
}

module.exports = MemoryNonceStore;
