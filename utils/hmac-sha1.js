const forge = require('node-forge');

module.exports = (toHash) => {
  let md = forge.md.sha1.create();
  md.update(toHash);
  return md.digest().toHex();
}
