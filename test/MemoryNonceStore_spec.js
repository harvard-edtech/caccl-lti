const chai = require('chai')
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const MemoryNonceStore = require('../MemoryNonceStore.js');

let store;

let nextIndex = 0;
function genNonce() {
  let nonce = 'new-nonce-' + nextIndex;
  nextIndex++;
  return nonce;
}

describe('MemoryNonceStore', function () {
  beforeEach(function () {
    store = new MemoryNonceStore();
  });

  it('Rejects empty nonces', function () {
    let time = Date.now();
    // Empty nonce
    expect(store.check('')).to.eventually.be
      .rejectedWith('No nonce included.');
    expect(store.check('', time)).to.eventually.be
      .rejectedWith('No nonce included.');
    // No nonce
    expect(store.check()).to.eventually.be
      .rejectedWith('No nonce included.');
    // Null nonce
    expect(store.check(null)).to.eventually.be
      .rejectedWith('No nonce included.');
    expect(store.check(null, time)).to.eventually.be
      .rejectedWith('No nonce included.');
      // SPaces string nonce
      expect(store.check(' ')).to.eventually.be
        .rejectedWith('No nonce included.');
      expect(store.check(' ', time)).to.eventually.be
        .rejectedWith('No nonce included.');
  });

  it('Rejects empty timestamps', function () {
    // Null timestamp
    expect(store.check(genNonce(),null)).to.eventually.be
      .rejectedWith('No timestamp.');
    // Undefined timestamp
    expect(store.check(genNonce())).to.eventually.be
      .rejectedWith('No timestamp.');
    // Empty timestamp
    expect(store.check(genNonce(),'')).to.eventually.be
      .rejectedWith('No timestamp.');
    // Lots of spaces timestamp
    expect(store.check(genNonce(),'  ')).to.eventually.be
      .rejectedWith('No timestamp.');
  });

  it('Rejects non-number timestamps', function () {
    // Letters
    expect(store.check(genNonce(),'abcd')).to.eventually.be
      .rejectedWith('Timestamp is not a number.');
    // Alphanumeric
    expect(store.check(genNonce(),'a1b3c5d6')).to.eventually.be
      .rejectedWith('Timestamp is not a number.');
  });

  it('Rejects duplicate nonces', function () {
    let nonce = genNonce();
    store.check(nonce, Date.now());
    expect(store.check(nonce, Date.now())).to.eventually.be
      .rejectedWith('Nonce already used.');
  });

  it('Rejects old nonces', function () {
    let oldDate = new Date();
    oldDate.setMinutes(oldDate.getMinutes() - 10);
    expect(store.check(genNonce(), oldDate)).to.eventually.be
      .rejectedWith('Nonce too old.');
  });
});
