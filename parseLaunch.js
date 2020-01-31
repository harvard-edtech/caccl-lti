/**
 * Returns parsed value of val if val is truthy, otherwise just returns val
 * @author Gabe Abrams
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
 * @author Gabe Abrams
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
  'custom_canvas_assignment_title',
  'custom_canvas_assignment_points_possible',
  'custom_canvas_assignment_id',
];

/**
 * Parses an LTI launch body and saves results to the session under
 *   req.session.launched (set to true) and req.session.launchInfo (contains
 *   all launch information...see /docs/LaunchInfo.md for more info)
 * @author Gabe Abrams
 * @param {object} launchBody - the body of the launch request
 * @param {Express Request} req - express request instance
 */
module.exports = (launchBodyOrig, req) => {
  const launchBody = launchBodyOrig || req.body;

  // Save launched variable to session
  req.session.launched = true;

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
    roles: splitIfTruthy(launchBody.roles),
    canvasInstance: launchBody.tool_consumer_instance_name,
    userImage: launchBody.user_image,
    resourceLinkId: launchBody.resource_link_id,
    originalLTILaunchBody: launchBody,
  };

  // Detect launch type
  const wasAssignmentLaunch = (
    launchBody.custom_canvas_assignment_id
    && launchBody.custom_canvas_assignment_title
    && launchBody.custom_canvas_assignment_points_possible
  );
  req.session.launchInfo.launchType = (
    wasAssignmentLaunch
      ? 'assignment'
      : 'navigation'
  );

  // Parse assignment launch
  if (wasAssignmentLaunch) {
    // Parse custom params
    req.session.launchInfo.assignment = {
      id: parseIntIfTruthy(launchBody.custom_canvas_assignment_id),
      name: launchBody.custom_canvas_assignment_title,
      pointsPossible:
        parseIntIfTruthy(launchBody.custom_canvas_assignment_points_possible),
    };

    // Parse outcomes
    const acceptedDataValues = (
      launchBody.ext_outcome_data_values_accepted.split(',')
    );
    req.session.launchInfo.outcome = {
      url: launchBody.lis_outcome_service_url,
      sourcedId: launchBody.lis_result_sourcedid,
      urlSubmissionAccepted: acceptedDataValues.includes('url'),
      textSubmissionAccepted: acceptedDataValues.includes('text'),
      totalScoreAccepted: (
        launchBody.ext_outcome_result_total_score_accepted
        && launchBody.ext_outcome_result_total_score_accepted === 'true'
      ),
      submittedAtAccepted: (
        launchBody.ext_outcome_submission_submitted_at_accepted
        && launchBody.ext_outcome_submission_submitted_at_accepted === 'true'
      ),
    };
  } else {
    // Navigation launch
    req.session.launchInfo.launchAppTitle = launchBody.resource_link_title;
  }


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

  // Remove tokens if user just launched as someone else
  if (
    req.session
    && req.session.currentUserCanvasId
    && req.session.launchInfo.userId
    && (req.session.launchInfo.userId !== req.session.currentUserCanvasId)
  ) {
    // NOTE: Keep these values up-to-date with all the session variables added
    // by caccl-authorizer
    req.session.accessToken = undefined;
    req.session.refreshToken = undefined;
    req.session.accessTokenExpiry = undefined;
    req.session.authorized = undefined;
    req.session.authFailed = undefined;
    req.session.authFailureReason = undefined;
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

    // Rename prop without "custom_" prefix
    const shorterPropName = prop.substring(7);

    // Save custom parameter
    req.session.launchInfo.customParams[shorterPropName] = launchBody[prop];
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
