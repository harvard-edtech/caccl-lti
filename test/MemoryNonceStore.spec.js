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

  it('Rejects empty nonces - empty string', function () {
    // Empty nonce
    return Promise.all([
      expect(store.check('')).to.eventually.be
        .rejectedWith('No nonce included.'),
      expect(store.check('', genTimestamp())).to.eventually.be
        .rejectedWith('No nonce included.'),
    ]);
  });

  it('Rejects empty nonces - undefined', function () {
    // No nonce
    return Promise.all([
      expect(store.check()).to.eventually.be
        .rejectedWith('No nonce included.'),
      expect(store.check(), genTimestamp()).to.eventually.be
        .rejectedWith('No nonce included.'),
    ]);
  });

  it('Rejects empty nonces - null', function () {
    // Null nonce
    return Promise.all([
      expect(store.check(null)).to.eventually.be
        .rejectedWith('No nonce included.'),
      expect(store.check(null, genTimestamp())).to.eventually.be
        .rejectedWith('No nonce included.'),
    ]);
  });

  it('Rejects empty nonces - whitespace string', function () {
    // Spaces string nonce
    return Promise.all([
      expect(store.check(' ')).to.eventually.be
        .rejectedWith('No nonce included.'),
      expect(store.check(' ', genTimestamp())).to.eventually.be
        .rejectedWith('No nonce included.'),
    ]);
  });

  it('Rejects empty timestamps - null', function () {
    // Null timestamp
    return expect(store.check(genNonce(), null)).to.eventually.be
      .rejectedWith('No timestamp.');
  });

  it('Rejects empty timestamps - undefined', function () {
    // Undefined timestamp
    return expect(store.check(genNonce())).to.eventually.be
      .rejectedWith('No timestamp.');
  });

  it('Rejects empty timestamps - empty string', function () {
    // Empty timestamp
    return expect(store.check(genNonce(), '')).to.eventually.be
      .rejectedWith('No timestamp.');
  });

  it('Rejects empty timestamps - whitespace string', function () {
    // Lots of spaces timestamp
    return expect(store.check(genNonce(), '  ')).to.eventually.be
      .rejectedWith('No timestamp.');
  });

  it('Rejects non-number timestamps - alpha', function () {
    // Letters
    return expect(store.check(genNonce(), 'abcd')).to.eventually.be
      .rejectedWith('Timestamp is not a number.');
  });

  it('Rejects non-number timestamps - alphanumeric', function () {
    // Alphanumeric
    return expect(store.check(genNonce(), 'a1b3c5d6')).to.eventually.be
      .rejectedWith('Timestamp is not a number.');
  });

  it('Rejects duplicate nonces', function () {
    const nonce = genNonce();
    return store.check(nonce, genTimestamp())
      .then(() => {
        expect(store.check(nonce, genTimestamp())).to.eventually.be
          .rejectedWith('Nonce already used.');
      });
  });

  it('Rejects old nonces', function () {
    const oldDate = new Date();
    oldDate.setMinutes(oldDate.getMinutes() - 10);
    return expect(store.check(genNonce(), oldDate.getTime() / 1000))
      .to.eventually.be.rejectedWith('Nonce too old.');
  });

  it('Accepts valid nonces', function () {
    return expect(store.check(genNonce(), Date.now() / 1000))
      .to.eventually.be.fulfilled;
  });
});
