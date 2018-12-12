const oauth = require('oauth-signature');
const clone = require('fast-clone');
const urlLib = require('url');

const MemoryNonceStore = require('./MemoryNonceStore');

/* LTI launch validator */
class Validator {
  /**
   * Creates a new Validator
   * @param {string} consumer_key - an LTI consumer id to compare against during
   *   launch validation
   * @param {string} consumer_secret - an LTI consumer secret to use for
   *   signature signing
   * @param {object} [nonceStore=memory store] - a nonce store to use for
   *   keeping track of used nonces of form { check } where check is a function:
   *   (nonce, timestamp) => Promise that resolves if valid, rejects if invalid
   */
  constructor(config = {}) {
    this.nonceStore = config.nonceStore || new MemoryNonceStore();

    // Consumer credentials
    if (!config.consumer_secret) {
      throw new Error('Validator requires consumer_secret');
    }
    this.consumer_secret = config.consumer_secret;
    if (!config.consumer_key) {
      throw new Error('Validator requires consumer_key');
    }
    this.consumer_key = config.consumer_key;
  }

  /**
   * Checks if an LTI launch request is valid
   * @param {object} req - Express request object to verify
   * @return {Promise} promise that resolves if valid, rejects if invalid
   */
  isValid(req) {
    // Check that consumer_key is valid
    if (
      !req.body
      || !req.body.oauth_consumer_key
      || req.body.oauth_consumer_key !== this.consumer_key
    ) {
      // No consumer key or consumer key didn't match (reject immediately)
      return Promise.reject();
    }
    // Check that nonce and signature are valid
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
    const body = clone(req.body);
    delete body.oauth_signature;
    // > Create signature
    const generatedSignature = decodeURIComponent(
      oauth.generate(
        req.method,
        url,
        body,
        this.consumer_secret
      )
    );

    return (generatedSignature === req.body.oauth_signature);
  }
}

module.exports = Validator;
