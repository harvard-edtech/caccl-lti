const genSignature = require('./genSignature.js');
const MemoryNonceStore = require('./MemoryNonceStore.js');
const lti = require('ims-lti');
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
   * @param {object} req - Express request object
   * @return Promise that resolves if valid, rejects if invalid
   */
  isValid(req) {
    let provider = new lti.Provider(this.consumerKey, this.consumerSecret);
    provider.valid_request(req, (err, isValid) => {});

    return new Promise((resolve, reject) => {
      // Check signature
      const generatedSignature = genSignature(req, this.consumerSecret);
      console.log('Our generated', generatedSignature);
      if (generatedSignature !== req.body.oauth_signature) {
        // Invalid
        return reject(new Error('Invalid signature!'));
      }

      // Check nonce
      return this.nonceStore.check(req.body.oauth_nonce, req.body.oauth_timestamp);
    });
  }
}

module.exports = Validator;
