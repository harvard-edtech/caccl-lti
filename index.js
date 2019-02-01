const Validator = require('./Validator');

const parseLaunch = require('./parseLaunch');

/**
 * Create a new validator and sets up route for launch validation and lti
 *   launch information extraction
 * @param {object} app - express app to add routes to
 * @param {string} installationCredentials.consumer_key - an LTI consumer key to
 *   compare against during launch validation
 * @param {string} installationCredentials.consumer_secret - an LTI consumer
 *   secret to use for signature signing
 * @param {string} [launchPath=/launch] - the express path to catch POST launch
 *   requests from
 * @param {string} [redirectToAfterLaunch=same as launchPath] - the path to
 *   redirect to after a successful launch
 * @param {object} [nonceStore=memory store] - a nonce store to use for
 *   keeping track of used nonces of form { check } where check is a function:
 *   (nonce, timestamp) => Promise that resolves if valid, rejects if invalid
 * @param {string} [authorizePath] - the authorization path as set up by
 *   caccl-authorizer. Only valid if disableAuthorizeOnLaunch is falsy
 * @param {boolean} [disableAuthorizeOnLaunch] - if falsy, redirects to
 *   authorizePath after launch is validated and parsed (and includes
 *   redirectToAfterLaunch) as the 'next' link so that caccl-authorizer
 *   redirects to redirectToAfterLaunch after finishing authorization
 */
module.exports = (config) => {
  if (
    !config.installationCredentials
    || !config.installationCredentials.consumer_key
    || !config.installationCredentials.consumer_secret
  ) {
    // Required credentials weren't included
    throw new Error('CACCL LTI can\'t be initialized without installationCredentials of the form: { consumer_key, consumer_secret }!');
  }

  if (!config.app) {
    throw new Error('CACCL LTI can\'t be initialized without an express app.');
  }

  // Create validator
  const validator = new Validator({
    consumer_key: config.installationCredentials.consumer_key,
    consumer_secret: config.installationCredentials.consumer_secret,
    nonceStore: config.nonceStore,
  });

  // Set up launch paths
  const launchPath = config.launchPath || '/launch';
  const redirectToAfterLaunch = config.redirectToAfterLaunch || launchPath;

  // Set up launch parser middleware
  config.app.use(launchPath, (req, res, next) => {
    // Add function that parses an LTI launch body
    req._parseLaunch = (launchBody) => {
      return parseLaunch(launchBody || req.body, req);
    };

    next();
  });

  // Handle POST launch requests
  config.app.post(launchPath, (req, res) => {
    // This is an LTI launch. Handle it
    // Validate the launch request
    validator.isValid(req)
      .then(() => {
        // This is a valid launch request
        return req._parseLaunch();
      })
      .then(() => {
        // Session saved! Now redirect.
        if (!config.disableAuthorizeOnLaunch) {
          // We're authorizing on launch, so redirect to the authorize path and
          // include redirectToAfterLaunch as the 'next' url
          return res.redirect(`${config.launchPath}?next=${redirectToAfterLaunch}`);
        }
        // Not authorizing on launch. Redirect to redirectToAfterLaunch
        return res.redirect(redirectToAfterLaunch);
      })
      .catch(() => {
        // Invalid launch request or an error occurred while validating/parsing
        // launch request
        return res.status(403).send('We couldn\'t validate your authorization to use this app. Please try launch the app again. If you continue to have problems, please contact an admin.');
      });
  });
};
