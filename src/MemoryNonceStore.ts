// Import libs
import locks from 'locks';

// Import shared types
import NonceStore from './types/NonceStore';

/*------------------------------------------------------------------------*/
/*                                Constants                               */
/*------------------------------------------------------------------------*/

// The max age of an acceptable nonce
const EXPIRY_SEC = 55; // Needs to be at least 10s and no more than 55s
const EXPIRY_MS = EXPIRY_SEC * 1000;

class MemoryNonceStore implements NonceStore {
  // Time the nonce store was started
  private startTime: number;

  // Is used map
  private isUsedMutex: locks.Mutex;
  private isUsedPrime: Set<string>;
  private isUsedSecondary: Set<string>;

  /**
   * Create a new MemoryNonceStore
   * @author Gabe Abrams
   */
  constructor() {
    // Record start time (nothing older than start will be allowed)
    this.startTime = Date.now();

    // Sets of used nonces
    // - Newly used nonces are added to isUsedPrime
    // - Each "rotation", nonces are moved from isUsedPrime => isUsedSecondary
    //     and nonces in isUsedSecondary are deleted
    // - Rotations occur on the minute
    // - Because rotations occur every minute, the shortest a nonce will be
    //     stored is one minute. Thus, the expiry time must be less than 60s,
    //     55s to be safe
    this.isUsedMutex = locks.createMutex();
    this.isUsedPrime = new Set<string>();
    this.isUsedSecondary = new Set<string>()

    // Schedule rotation for every minute
    setInterval(
      () => {
        this.rotate();
      },
      60000,
    );
  }

  /**
   * Checks if a new nonce is valid, mark it as used
   * @author Gabe Abrams
   * @param nonce OAuth nonce
   * @param timestamp OAuth timestamp
   * @returns Promise that resolves if nonce is valid, rejects with error if
   *   nonce is invalid.
   */
  public async check(nonce: string, timestampSecs: number): Promise<undefined> {
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
      if (Number.isNaN(Number.parseInt(String(timestampSecs)))) {
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
          if (this.isUsedPrime.has(nonce) || this.isUsedSecondary.has(nonce)) {
            // Already used
            this.isUsedMutex.unlock();
            return reject(new Error('Nonce already used.'));
          }

          // Mark as used
          this.isUsedPrime.add(nonce);
          this.isUsedMutex.unlock();
          return resolve(undefined);
        } catch (err) {
          // An error occurred!
          this.isUsedMutex.unlock();
          return reject(err);
        }
      });
    });
  }

  /**
   * Performs a maintenance rotation: nonces are moved from
   *   isUsedPrime => isUsedSecondary and nonces in isUsedSecondary are deleted
   * @author Gabe Abrams
   */
  private rotate() {
    this.isUsedMutex.lock(() => {
      this.isUsedSecondary = new Set<string>(this.isUsedPrime);
      this.isUsedPrime = new Set<string>();
      this.isUsedMutex.unlock();
    });
  }
}

export default MemoryNonceStore;
