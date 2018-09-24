const chai = require('chai')
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const Validator = require('../index.js');

const oauth = require('oauth-signature');
const valid = require('./examples/launches/valid.js');

function updateAndAddSignature(examplesPackage, example) {

  example.body.oauth_timestamp = Math.ceil(Date.now()/1000);

  example.body.oauth_signature = decodeURIComponent(
    oauth.generate(
      examplesPackage.method,
      examplesPackage.url,
      examplesPackage.body,
      examplesPackage.consumerSecret
    )
  );

  return example;
}

describe('Validator', function () {

  it('Accepts valid requests', function () {

    const validator = new Validator({
      consumerSecret: valid.consumerSecret
    });

    valid.examples.forEach((example) => {

      let body = example.body;

      // Reset timestamp
      body.oauth_timestamp = String(Math.ceil(Date.now()/1000));

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
      }

      expect(validator.isValid(req)).to.not.be.rejected;
    });

  });

  it('Rejects invalid requests', function () {

    const validator = new Validator({
      consumerSecret: valid.consumerSecret
    });

    valid.examples.forEach((example) => {

      let body = example.body;

      // Reset timestamp
      body.oauth_timestamp = String(Math.ceil(Date.now()/1000));

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
      }

      expect(validator.isValid(req)).to.be.rejected;
    });

  });

});
