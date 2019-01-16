const Validator = require('./Validator');

/**
 * Returns parsed value of val if val is truthy, otherwise just returns val
 * @param val - value to parse if truthy
 * @return value (parsed as int if truthy)
 */
const parseIntIfTruthy = (val) => {
  if (val) {
    return parseInt(val, 10);
  }
  return val;
};

/**
 * Returns split array of val if val is truthy, otherwise just returns val
 * @param val - value to split if truthy
 * @return value (split on "," if truthy)
 */
const splitIfTruthy = (val) => {
  if (val) {
    return val.split(',');
  }
  return val;
};

// List of Canvas custom param names
const CANVAS_CUSTOM_PARAMS = [
  'custom_canvas_api_domain',
  'custom_canvas_course_id',
  'custom_canvas_enrollment_state',
  'custom_canvas_user_id',
  'custom_canvas_user_login_id',
  'custom_canvas_workflow_state',
];

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
    req._parseLaunch = (launchBody = req.body) => {
      // Parse launch and save it to session
      req.session.launchInfo = {
        timestamp: launchBody.oauth_timestamp * 1000,
        contextId: launchBody.context_id,
        contextLabel: launchBody.contextLabel,
        canvasHost: launchBody.custom_canvas_api_domain,
        courseId: parseIntIfTruthy(launchBody.custom_canvas_course_id),
        enrollmentState: launchBody.custom_canvas_enrollment_state,
        userId: parseIntIfTruthy(launchBody.custom_canvas_user_id),
        userLoginId: launchBody.custom_canvas_user_login_id,
        workflowState: launchBody.custom_canvas_workflow_state,
        extRoles: splitIfTruthy(launchBody.ext_roles),
        launchPresentationTarget:
          launchBody.launch_presentation_document_target,
        iframeWidth: launchBody.launch_presentation_width,
        iframeHeight: launchBody.launch_presentation_height,
        locale: launchBody.launch_presentation_locale,
        returnURL: launchBody.launch_presentation_return_url,
        userEmail: launchBody.lis_person_contact_email_primary,
        userLastName: launchBody.lis_person_name_family,
        userFullName: launchBody.lis_person_name_full,
        userFirstName: launchBody.lis_person_name_given,
        launchAppTitle: launchBody.resource_link_title,
        roles: splitIfTruthy(launchBody.roles),
        canvasInstance: launchBody.tool_consumer_instance_name,
        userImage: launchBody.user_image,
      };

      // Add simpler role booleans
      if (req.session.launchInfo.extRoles) {
        req.session.launchInfo.isInstructor = (
          req.session.launchInfo.extRoles.includes(
            'urn:lti:role:ims/lis/Instructor'
          )
        );
        req.session.launchInfo.isTA = (
          req.session.launchInfo.extRoles.includes(
            'urn:lti:role:ims/lis/TeachingAssistant'
          )
        );
        req.session.launchInfo.isDesigner = (
          req.session.launchInfo.extRoles.includes(
            'urn:lti:role:ims/lis/ContentDeveloper'
          )
        );
        req.session.launchInfo.isCreditLearner = (
          req.session.launchInfo.extRoles.includes(
            'urn:lti:role:ims/lis/Learner'
          )
        );
        req.session.launchInfo.isNonCreditLearner = (
          req.session.launchInfo.extRoles.includes(
            'urn:lti:role:ims/lis/Learner/NonCreditLearner'
          )
        );
        req.session.launchInfo.isLearner = (
          req.session.launchInfo.isCreditLearner
          || req.session.launchInfo.isNonCreditLearner
        );
      }

      // Save current user id for caccl-authorizer
      req.session.currentUserCanvasId = req.session.launchInfo.userId;

      // Save canvas host for caccl
      req.session.canvasHost = req.session.launchInfo.canvasHost;

      // Add custom parameters
      req.session.launchInfo.customParams = {};
      Object.keys(launchBody).forEach((prop) => {
        // Check if this is a custom param that wasn't sent by Canvas itself
        if (
          !prop.startsWith('custom_')
          || CANVAS_CUSTOM_PARAMS.indexOf(prop) >= 0
        ) {
          // Not a custom parameter. Skip!
          return;
        }
        // Save custom parameter
        req.session.launchInfo.customParams[prop] = launchBody[prop];
      });

      // Save session
      return new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            return reject(err);
          }
          return resolve();
        });
      });
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
