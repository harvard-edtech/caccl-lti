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

module.exports = (launchBodyOrig, req) => {
  const launchBody = launchBodyOrig || req.body;

  // Save launched variable to session
  req.sesion.launched = true;

  // Parse launch and save it to session
  req.session.launchInfo = {
    timestamp: launchBody.oauth_timestamp * 1000,
    contextId: launchBody.context_id,
    contextLabel: launchBody.context_label,
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
