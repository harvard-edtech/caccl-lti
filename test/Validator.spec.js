const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const oauth = require('oauth-signature');

const Validator = require('../Validator.js');

const { expect } = chai;
chai.use(chaiAsPromised);

const valid = require('./examples/launches/valid.js');

// const updateAndAddSignature = (examplesPackage, example) => {
//   const newExample = example;
//
//   newExample.body.oauth_timestamp = Math.ceil(Date.now() / 1000);
//   newExample.body.oauth_signature = decodeURIComponent(
//     oauth.generate(
//       examplesPackage.method,
//       examplesPackage.url,
//       examplesPackage.body,
//       examplesPackage.consumerSecret
//     )
//   );
//
//   return newExample;
// };

describe('Validator', function () {
  it('Accepts valid requests', function () {
    const validator = new Validator({
      consumer_key: valid.consumerKey,
      consumer_secret: valid.consumerSecret,
    });

    valid.examples.forEach((example) => {
      const { body } = example;

      // Reset timestamp
      body.oauth_timestamp = String(Math.ceil(Date.now() / 1000));

      body.oauth_signature = decodeURIComponent(
        oauth.generate(
          valid.method,
          valid.url,
          body,
          valid.consumerSecret
        )
      );

      const req = {
        protocol: valid.protocol,
        headers: {
          host: valid.host,
        },
        path: valid.path,
        url: valid.url,
        method: valid.method,
        body,
      };

      // eslint-disable-next-line no-unused-expressions
      expect(validator.isValid(req)).to.not.be.rejected;
    });
  });

  it('Rejects invalid requests', function () {
    const validator = new Validator({
      consumer_key: valid.consumerKey,
      consumer_secret: valid.consumerSecret,
    });

    valid.examples.forEach((example) => {
      const { body } = example;

      // Reset timestamp
      body.oauth_timestamp = String(Math.ceil(Date.now() / 1000));

      // Give phony signature
      body.extra = 'asdf';
      body.oauth_signature = decodeURIComponent(
        oauth.generate(
          valid.method,
          valid.url,
          body,
          valid.consumerSecret
        )
      );

      const req = {
        protocol: valid.protocol,
        headers: {
          host: valid.host,
        },
        path: valid.path,
        url: valid.url,
        method: valid.method,
        body,
      };

      // eslint-disable-next-line no-unused-expressions
      expect(validator.isValid(req)).to.be.rejected;
    });
  });
});
