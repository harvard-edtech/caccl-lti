const hash = require('./utils/hmac-sha1.js');
const MemoryNonceStore = require('./classes/MemoryNonceStore.js');

class Validator {
  constructor(options) {
    options = options || {};
    this.nonceStore = options.nonceStore || new MemoryNonceStore();

    // Consumer credentials
    this.consumerKey = options.consumerKey;
    this.consumerSecret = options.consumerSecret;
    if (!this.consumerKey || !this.consumerSecret) {
      throw new Error('Validator requires consumerKey and consumerSecret');
    }
  }

  /**
   * Checks of an LTI launch request is valid
   * @param {object} req - Express request object or JSON POST body
   *   (e.g., req.body)
   * @return Promise that resolves if valid, rejects if invalid
   */
  isValid(req) {
    // Detect request object and extract body
    let body = req;
    if (
      req.method &&
      req.method === 'POST' &&
      req.hostname &&
      req.body
    ) {
      body = req.body;
    }

    return new Promise((resolve, reject) => {

    });
  }
}

module.exports = createValidator;
