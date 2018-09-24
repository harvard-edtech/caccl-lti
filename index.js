const MemoryNonceStore = require('./MemoryNonceStore.js');
const oauth = require('oauth-signature');
const clone = require('fast-clone');
const urlLib = require('url');

class Validator {

  constructor(options = {}) {
    this.nonceStore = options.nonceStore || new MemoryNonceStore();

    // Consumer credentials
    if (!options.consumerSecret) {
      throw new Error('Validator requires consumerSecret');
    }
    this.consumerSecret = options.consumerSecret;
  }

  /**
   * Checks if an LTI launch request is valid
   * @param {object} req - Express request object to verify
   * @return Promise that resolves if valid, rejects if invalid
   */
  isValid(req) {

    return this._checkNonce(req)
    .then(() => {
      if (!this._isSignatureValid(req)) {
        throw new Error('Invalid signature!');
      }
    });

  }

  /**
   * Checks if a nonce is valid
   * @param {object} req - Express request object to verify
   * @return Promise that resolves if valid, rejects if invalid
   */
  _checkNonce(req) {
    return this.nonceStore.check(
      req.body.oauth_nonce,
      req.body.oauth_timestamp
    );
  }

  /**
   * Checks if an oauth_signature is valid
   * @param {object} req - Express request object to verify
   * @return boolean, true if req.body.oauth_signature is valid
   */
  _isSignatureValid(req) {
    // Generate signature for verification
    // > Build URL
    const path = urlLib.parse(req.originalUrl || req.url).pathname;
    const url = req.protocol + '://' + req.headers.host + path;
    // > Remove oauth signature from body
    let body = clone(req.body);
    delete body.oauth_signature;
    // > Create signature
    const generatedSignature = decodeURIComponent(
      oauth.generate(
        req.method,
        url,
        body,
        this.consumerSecret
      )
    );

    return (generatedSignature === req.body.oauth_signature);
  }
}

module.exports = Validator;
