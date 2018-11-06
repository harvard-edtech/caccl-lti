const Validator = require('./Validator');

/**
 * Returns parsed value of val if val is truthy, otherwise just returns val
 * @param val - value to parse if truthy
 * @return value (parsed as int if truthy)
 */
const parseIntIfTruthy = (val) => {
  if (val) {
    return parseInt(val);
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

/**
 * Checks if a value is found in a list
 * @param [val] - value to search for
 * @param {array} [list] - the list to search through
 * @return true if the value is found
 */
const valueInList = (val, list) => {
  if (!val || !list) {
    return false;
  }
  return (list.indexOf(val) >= 0);
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
 * @param {string} consumerKey - an LTI consumer key to compare against during
 *   launch validation
 * @param {string} consumerSecret - an LTI consumer secret to use for
 *   signature signing
 * @param {string} [launchPath=/launch] - the express path to catch POST launch
 *   requests from
 * @param {string} [redirectToAfterLaunch=same as launchPath] - the path to
 *   redirect to after a successful launch
 * @param {object} [nonceStore=memory store] - a nonce store to use for
 *   keeping track of used nonces of form { check } where check is a function:
 *   (nonce, timestamp) => Promise that resolves if valid, rejects if invalid
 * @param {string} [authorizePath] - the authorization path as set up by
 *   caccl-token-manager. Only valid if authorizeOnLaunch is truthy
 * @param {boolean} [authorizeOnLaunch] - if truthy, redirects to authorizePath
 *   after launch is validated and parsed (and includes redirectToAfterLaunch)
 *   as the 'next' link so that caccl-token-manager redirects to
 *   redirectToAfterLaunch after finishing authorization
 */
module.exports = (config) => {
  // Create validator
  const validator = new Validator({
    consumerKey: config.installationCredentials.consumer_key,
    consumerSecret: config.installationCredentials.consumer_secret,
    nonceStore: config.nonceStore,
  });

  // Set up launch paths
  const launchPath = config.launchPath || '/launch';
  const redirectToAfterLaunch = config.redirectToAfterLaunch || launchPath;

  // Add route for launch validation
  config.app.post(launchPath, (req, res) => {
    // Validate the launch request
    validator.isValid(req)
      .then(() => {
        // This is a valid launch request

        // Parse launch and save it to session
        req.session.launchInfo = {
          timestamp: req.body.oauth_timestamp,
          contextId: req.body.context_id,
          contextLabel: req.body.contextLabel,
          canvasHost: req.body.custom_canvas_api_domain,
          courseId: parseIntIfTruthy(req.body.custom_canvas_course_id),
          enrollmentState: req.body.custom_canvas_enrollment_state,
          userId: parseIntIfTruthy(req.body.custom_canvas_user_id),
          userLoginId: req.body.custom_canvas_user_login_id,
          workflowState: req.body.custom_canvas_workflow_state,
          extRoles: splitIfTruthy(req.body.ext_roles),
          launchPresentationTarget:
            req.body.launch_presentation_document_target,
          iframeWidth: req.body.launch_presentation_width,
          iframeHeight: req.body.launch_presentation_height,
          locale: req.body.launch_presentation_locale,
          returnURL: req.body.launch_presentation_return_url,
          userEmail: req.body.lis_person_contact_email_primary,
          userLastName: req.body.lis_person_name_family,
          userFullName: req.body.lis_person_name_full,
          userFirstName: req.body.lis_person_name_given,
          launchAppTitle: req.body.resource_link_title,
          roles: splitIfTruthy(req.body.roles),
          canvasInstance: req.body.tool_consumer_instance_name,
          userImage: req.body.user_image,
        };

        // Add simpler role booleans
        req.session.launchInfo.isInstructor = valueInList(
          'urn:lti:role:ims/lis/Instructor',
          req.session.launchInfo.extRoles
        );
        req.session.launchInfo.isTA = valueInList(
          'urn:lti:role:ims/lis/TeachingAssistant',
          req.session.launchInfo.extRoles
        );
        req.session.launchInfo.isDesigner = valueInList(
          'urn:lti:role:ims/lis/ContentDeveloper',
          req.session.launchInfo.extRoles
        );
        req.session.launchInfo.isCreditLearner = valueInList(
          'urn:lti:role:ims/lis/Learner',
          req.session.launchInfo.extRoles
        );
        req.session.launchInfo.isNonCreditLearner = valueInList(
          'urn:lti:role:ims/lis/Learner/NonCreditLearner',
          req.session.launchInfo.extRoles
        );
        req.session.launchInfo.isLearner = (
          req.session.launchInfo.isCreditLearner
          || req.session.launchInfo.isNonCreditLearner
        );

        // Save current user id for caccl-token-manager
        req.session.currentUserCanvasId = req.session.launchInfo.userId;

        // Save canvas host for caccl
        req.session.canvasHost = req.session.launchInfo.canvasHost;

        // Add custom parameters
        req.session.launchInfo.customParams = {};
        Object.keys(req.body).forEach((prop) => {
          // Check if this is a custom param that wasn't sent by Canvas itself
          if (
            !prop.startsWith('custom_')
            || CANVAS_CUSTOM_PARAMS.indexOf(prop) >= 0
          ) {
            // Not a custom parameter. Skip!
            return;
          }
          // Save custom parameter
          req.session.launchInfo.customParams[prop] = req.body[prop];
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
      })
      .then(() => {
        // Session saved! Now redirect.
        if (config.authorizeOnLaunch && config.authorizePath) {
          // We're authorizing on launch, so redirect to the authorize path and
          // include redirectToAfterLaunch as the 'next' url
          return res.redirect(`${config.authorizePath}?next=${redirectToAfterLaunch}`);
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
