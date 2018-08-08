const hmac = require('hmac-sha1.js');

function encode(str) {
  // Taken from ims-lti
  // https://www.npmjs.com/package/ims-lti
  // lib/utils.js
  return encodeURIComponent(string).replace(/[!'()]/g, escape)
    .replace(/\*/g, '%2A');
}

module.exports = (body, consumerSecret) => {
  // Gather all values that need to be signed
  let valuesToSign = [];
  for (let key in body) {
    // Do not sign oauth_signature
    if (key === 'oauth_signature') {
      continue;
    }
    // Build component
    let component = key + '=' + encode(body[key]);
    valuesToSign.push(component);
  }

  // Create string to sign
  let stringToSign = encode(valuesToSign.sort().join('&'));

  // Build signature
  
}
