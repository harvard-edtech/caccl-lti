const hash = require('./utils/hmac-sha1.js');

function createValidator(options) {
  let nonceStore = options.nonceStore || 
}

module.exports = createValidator;
