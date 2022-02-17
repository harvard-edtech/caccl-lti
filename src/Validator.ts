// Import libraries
import express from 'express';
import oauth from 'oauth-signature';
import clone from 'fast-clone';
import parseURL from 'url-parse';

// Import shared types
import NonceStore from './types/NonceStore';

class Validator {
  // Initialize nonce store
  private nonceStore: NonceStore;

  // Credentials
  private consumer_key: string;
  private consumer_secret: string;

  /**
   * Creates a new Validator
   * @author Gabe Abrams
   * @param consumer_key an LTI consumer id to compare against during
   *   launch validation
   * @param consumer_secret an LTI consumer secret to use for
   *   signature signing
   * @param nonceStore a nonce store to use for
   *   keeping track of used nonces of form { check } where check is a function:
   *   (nonce, timestamp) => Promise that resolves if valid, rejects if invalid
   */
  constructor(
    opts: {
      consumer_key: string,
      consumer_secret: string,
      nonceStore: NonceStore,
    },
  ) {
    // Initialize nonce store
    this.nonceStore = opts.nonceStore;

    // Verify and save consumer credentials
    if (!opts.consumer_secret) {
      throw new Error('Validator requires consumer_secret');
    }
    this.consumer_secret = opts.consumer_secret;
    if (!opts.consumer_key) {
      throw new Error('Validator requires consumer_key');
    }
    this.consumer_key = opts.consumer_key;
  }

  /**
   * Checks if an LTI launch request is valid
   * @author Gabe Abrams
   * @param {object} req - Express request object to verify
   * @return {Promise} promise that resolves if valid, rejects if invalid
   */
  public async isValid(req: express.Request): Promise<undefined> {
    // Check that consumer_key is valid
    if (
      !req.body
      || !req.body.oauth_consumer_key
      || req.body.oauth_consumer_key !== this.consumer_key
    ) {
      // No consumer key or consumer key didn't match (reject immediately)
      return Promise.reject();
    }
    // Check that nonce and signature are valid
    await this.checkNonce(req);
    this.checkSignature(req);
  }

  /**
   * Checks if a nonce is valid
   * @author Gabe Abrams
   * @param req - Express request object to verify
   * @returns Promise that resolves if valid, rejects if invalid
   */
  private async checkNonce(req: express.Request): Promise<undefined> {
    return this.nonceStore.check(
      req.body.oauth_nonce,
      req.body.oauth_timestamp
    );
  }

  /**
   * Checks if an oauth_signature is valid. Throws an error if invalid
   * @author Gabe Abrams
   * @param req - Express request object to verify
   */
  private checkSignature(req: express.Request) {
    // Generate signature for verification
    // > Build URL
    const originalUrl = req.originalUrl || req.url;
    if (!originalUrl) {
      // No url: cannot sign the request
      throw new Error('No URL to use in signature!');
    }
    const path = parseURL(originalUrl).pathname;
    const url = `${req.protocol}://${req.headers.host}${path}`;
    // > Remove oauth signature from body
    const body = clone(req.body);
    delete body.oauth_signature;
    // > Create signature
    const generatedSignature = decodeURIComponent(
      oauth.generate(
        req.method,
        url,
        body,
        this.consumer_secret
      )
    );
    if (generatedSignature !== req.body.oauth_signature) {
      throw new Error('Invalid signature!');
    }
  }
}

export default Validator;
