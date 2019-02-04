const chai = require('chai');
const clone = require('fast-clone');
const chaiAsPromised = require('chai-as-promised');
const oauth = require('oauth-signature');

const Validator = require('../Validator.js');

const { expect } = chai;
chai.use(chaiAsPromised);

const valid = require('./examples/launches/valid.js');

describe('Validator', function () {
  it('Accepts valid requests', function () {
    const validator = new Validator({
      consumer_key: valid.consumerKey,
      consumer_secret: valid.consumerSecret,
    });

    valid.examples.forEach((example) => {
      const body = clone(example.body);

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

  it('Rejects invalid requests', async function () {
    const validator = new Validator({
      consumer_key: valid.consumerKey,
      consumer_secret: valid.consumerSecret,
    });

    for (let i = 0; i < valid.examples.length; i++) {
      const example = valid.examples[i];
      const body = clone(example.body);

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

      /* eslint-disable no-await-in-loop */
      try {
        await validator.isValid(req);
        throw new Error('Validator marked example as valid when it wasnt');
      } catch (err) {
        // Good!
      }
    }
  });
});
