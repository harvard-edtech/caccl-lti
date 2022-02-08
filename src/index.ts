// Import express
import express from 'express';

// Import shared types
import NonceStore from './types/NonceStore';

// Import shared constants
import CACCL_PATHS from './constants/CACCL_PATHS';

// Import helpers
import Validator from './Validator';
import parseLaunch from './parseLaunch';

// Import Nonce Store
import MemoryNonceStore from './MemoryNonceStore';

/**
 * Create a new validator and sets up route for launch validation and lti
 *   launch information extraction
 * @author Gabe Abrams
 * @param app express app to add routes to
 * @param installationCredentials.consumer_key an LTI consumer key to
 *   compare against during launch validation
 * @param installationCredentials.consumer_secret an LTI consumer
 *   secret to use for signature signing
 * @param [authorizeAfterLaunch] if true, redirect the user to the CACCL
 *   authorizer after a successful LTI launch
 * @param [nonceStore=memory store] a nonce store to use for
 *   keeping track of used nonces
 */
export default (
  opts: {
    app: express.Application,
    installationCredentials: {
      consumer_key: string,
      consumer_secret: string,
    },
    authorizeAfterLaunch?: boolean,
    nonceStore?: NonceStore,
  },
) => {
  // Destructure opts
  const {
    app,
    installationCredentials,
    authorizeAfterLaunch,
    nonceStore,
  } = opts;

  // Throw error if credentials aren't included
  if (
    !installationCredentials
    || !installationCredentials.consumer_key
    || !installationCredentials.consumer_secret
  ) {
    // Required credentials weren't included
    throw new Error('CACCL LTI can\'t be initialized without installationCredentials of the form: { consumer_key, consumer_secret }!');
  }

  // Throw error if no express app is included
  if (!app) {
    throw new Error('CACCL LTI can\'t be initialized without an express app.');
  }

  // Create validator
  const validator = new Validator({
    consumer_key: installationCredentials.consumer_key,
    consumer_secret: installationCredentials.consumer_secret,
    nonceStore: (
      nonceStore
        ? nonceStore
        : new MemoryNonceStore()
    ),
  });

  // Handle POST launch requests
  app.post(
    CACCL_PATHS.LAUNCH,
    async (req, res) => {
      // This is an LTI launch. Handle it
      // Validate the launch request
      try {
        // Validate
        await validator.isValid(req);

        // Request is valid! Parse the launch
        await parseLaunch(req);

        // Session saved! Now redirect to continue
        if (authorizeAfterLaunch) {
          // We are allowed to authorize on launch, so redirect to the authorize
          // path and include redirectToAfterLaunch as the 'next' url
          return res.redirect(CACCL_PATHS.AUTHORIZE);
        }

        // Not authorizing on launch. Immediately show the app
        return res.redirect('/');
      } catch (err) {
        // Invalid launch request or an error occurred while validating/parsing
        // launch request
        return (
          res
            .status(403)
            .send('We couldn\'t validate your authorization to use this app. Please try launch the app again. If you continue to have problems, please contact an admin.')
        );
      }
    },
  );
};
