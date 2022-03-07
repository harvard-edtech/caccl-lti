// Import libraries
import express from 'express';
import oauth from 'oauth-signature';
import clone from 'fast-clone';

// Import caccl libs
import CACCLStore from 'caccl-memory-store/lib/CACCLStore';
import NONCE_CACHE_LIFESPAN_SEC from './shared/constants/NONCE_LIFESPAN_SEC';

/**
 * Checks if an LTI launch request is valid. Throws an error if invalid
 * @author Gabe Abrams
 * @param opts object containing all arguments
 * @param opts.req Express request object to verify
 * @param opts.consumerSecret an LTI consumer secret to use for signature
 *   signing
 * @param opts.store a nonce store to use for keeping track of used nonces
 * @param opts.startTimestamp time when store was created
 */
const validateLaunch = async (
  opts: {
    req: express.Request,
    consumerSecret: string,
    store: CACCLStore,
    startTimestamp: number,
  },
) => {
  const {
    req,
    consumerSecret,
    store,
    startTimestamp,
  } = opts;

  /*----------------------------------------*/
  /*              Parse request             */
  /*----------------------------------------*/

  // Nonce
  if (!req.body?.oauth_nonce) {
    throw new Error('no nonce included');
  }
  const nonce = String(req.body.oauth_nonce);

  // Timestamp
  if (
    !req.body?.oauth_timestamp
    || Number.isNaN(Number.parseFloat(req.body.oauth_timestamp))
  ) {
    throw new Error('no valid timestamp included');
  }
  const timestamp = (
    Number.parseFloat(req.body.oauth_timestamp)
    * 1000
  );

  // Signature
  if (!req.body?.oauth_signature) {
    throw new Error('no signature included');
  }

  /*----------------------------------------*/
  /*               Check Nonce              */
  /*----------------------------------------*/

  // Check if from before start
  if (timestamp <= startTimestamp) {
    throw new Error('nonce too old');
  }

  // Check if expired
  const secDiff = Math.abs(Date.now() - timestamp) / 1000;
  if (secDiff > (NONCE_CACHE_LIFESPAN_SEC - 5)) {
    // Expired!
    throw new Error('nonce expired');
  }

  // Add/replace in store
  const prevNonceOccurrence = await store.set(
    nonce,
    { timestamp },
  );
  if (prevNonceOccurrence) {
    // Nonce was already used
    throw new Error('nonce already used');
  }

  /*----------------------------------------*/
  /*             Check Signature            */
  /*----------------------------------------*/

  // Generate signature for verification
  // > Build URL
  const originalURL = (req.originalUrl || req.url);
  if (!originalURL) {
    // No url: cannot sign the request
    throw new Error('no URL to use in signature');
  }
  // > Get path from original URL
  const urlNoQuery = originalURL.split('?')[0].split('#')[0];
  const path = (
    urlNoQuery
      // Remove protocol
      .replace(`${req.protocol}://`, '')
      // Remove host
      .replace(req.hostname, '')
  );
  // Build another url
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
      consumerSecret,
    )
  );

  // Check the signature
  if (generatedSignature !== req.body.oauth_signature) {
    throw new Error('invalid signature');
  }
};

export default validateLaunch;
