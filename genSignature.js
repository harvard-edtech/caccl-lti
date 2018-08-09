const crypto = require('crypto');
const urlLib = require('url');

function encode(str) {
  // Taken from ims-lti
  // https://www.npmjs.com/package/ims-lti
  // lib/utils.js
  return encodeURIComponent(str).replace(/[!'()]/g, escape)
    .replace(/\*/g, '%2A');
}

module.exports = (req, consumerSecret) => {
  // Gather all values that need to be signed
  let valuesToSign = [];
  for (const key in req.body) {
    // Do not sign oauth_signature
    if (key === 'oauth_signature') {
      continue;
    }
    // Build component
    const component = key + '=' + encode(req.body[key]);
    valuesToSign.push(component);
  }

  // Create string to sign
  const stringToSign = encode(valuesToSign.sort().join('&'));

  // Build signature
  let path = urlLib.parse(req.originalUrl || req.url).pathname;
  let url = req.protocol + '://' + req.headers.host + path;
  const textToSign = [
    req.method.toUpperCase(),
    encode(url),
    stringToSign
  ].join('&');

  return crypto.createHmac('sha1', consumerSecret)
    .update(textToSign).digest('base64');
};
