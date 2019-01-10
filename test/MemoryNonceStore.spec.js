const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const MemoryNonceStore = require('../MemoryNonceStore.js');

const { expect } = chai;
chai.use(chaiAsPromised);

// Create a top-level store object so we can create new versions of it
let store;

let nextIndex = 0;
const genNonce = () => {
  const nonce = 'new-nonce-' + nextIndex;
  nextIndex += 1;
  return nonce;
};
const genTimestamp = () => {
  return Date.now() / 1000;
};

describe('MemoryNonceStore', function () {
  beforeEach(function () {
    store = new MemoryNonceStore();
  });

  it('Rejects empty nonces', function () {
    // Empty nonce
    expect(store.check('')).to.eventually.be
      .rejectedWith('No nonce included.');
    expect(store.check('', genTimestamp())).to.eventually.be
      .rejectedWith('No nonce included.');
    // No nonce
    expect(store.check()).to.eventually.be
      .rejectedWith('No nonce included.');
    // Null nonce
    expect(store.check(null)).to.eventually.be
      .rejectedWith('No nonce included.');
    expect(store.check(null, genTimestamp())).to.eventually.be
      .rejectedWith('No nonce included.');
    // Spaces string nonce
    expect(store.check(' ')).to.eventually.be
      .rejectedWith('No nonce included.');
    expect(store.check(' ', genTimestamp())).to.eventually.be
      .rejectedWith('No nonce included.');
  });

  it('Rejects empty timestamps', function () {
    // Null timestamp
    expect(store.check(genNonce(), null)).to.eventually.be
      .rejectedWith('No timestamp.');
    // Undefined timestamp
    expect(store.check(genNonce())).to.eventually.be
      .rejectedWith('No timestamp.');
    // Empty timestamp
    expect(store.check(genNonce(), '')).to.eventually.be
      .rejectedWith('No timestamp.');
    // Lots of spaces timestamp
    expect(store.check(genNonce(), '  ')).to.eventually.be
      .rejectedWith('No timestamp.');
  });

  it('Rejects non-number timestamps', function () {
    // Letters
    expect(store.check(genNonce(), 'abcd')).to.eventually.be
      .rejectedWith('Timestamp is not a number.');
    // Alphanumeric
    expect(store.check(genNonce(), 'a1b3c5d6')).to.eventually.be
      .rejectedWith('Timestamp is not a number.');
  });

  it('Rejects duplicate nonces', function () {
    const nonce = genNonce();
    store.check(nonce, genTimestamp())
      .then(() => {
        expect(store.check(nonce, genTimestamp())).to.eventually.be
          .rejectedWith('Nonce already used.');
      });
  });

  it('Rejects old nonces', function () {
    const oldDate = new Date();
    oldDate.setMinutes(oldDate.getMinutes() - 10);
    expect(store.check(genNonce(), oldDate.getTime() / 1000)).to.eventually.be
      .rejectedWith('Nonce too old.');
  });
});
