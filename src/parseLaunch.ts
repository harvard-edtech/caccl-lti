// Import libs
import express from 'express';

// Import shared types
import LaunchInfo from './shared/types/LaunchInfo';
import LaunchType from './shared/types/LaunchType';
import AssignmentDescription from './shared/types/AssignmentDescription';
import OutcomeDescription from './shared/types/OutcomeDescription';

// Check if this is a dev environment
const thisIsDevEnvironment = (process.env.NODE_ENV === 'development');

/*------------------------------------------------------------------------*/
/*                             Augment Session                            */
/*------------------------------------------------------------------------*/

declare module 'express-session' {
  interface SessionData {
    launchInfo: LaunchInfo,
    authInfo: unknown,
    selfLaunchState: any,
  }
}

/*------------------------------------------------------------------------*/
/*                                Constants                               */
/*------------------------------------------------------------------------*/

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

/*------------------------------------------------------------------------*/
/*                                   Main                                 */
/*------------------------------------------------------------------------*/

/**
 * Parses an LTI launch body and saves results to the session under
 *   req.session.launched (set to true) and req.session.launchInfo (contains
 *   all launch information...see /docs/LaunchInfo.md for more info)
 * @author Gabe Abrams
 * @param req express request instance
 */
const parseLaunch = async (req: express.Request) => {
  /*----------------------------------------*/
  /*              Parse Launch              */
  /*----------------------------------------*/

  // Extract body
  const launchBody = (req as any).body;

  // Detect launch type
  const wasAssignmentLaunch = (
    launchBody.custom_canvas_assignment_id
    && launchBody.custom_canvas_assignment_title
    && launchBody.custom_canvas_assignment_points_possible
  );
  const launchType = (
    wasAssignmentLaunch
      ? LaunchType.Assignment
      : LaunchType.Navigation
  );

  // Parse assignment launch
  let assignment: AssignmentDescription;
  let outcome: OutcomeDescription;
  if (wasAssignmentLaunch) {
    // Parse custom params
    assignment = {
      id: Number.parseInt(launchBody.custom_canvas_assignment_id),
      name: String(launchBody.custom_canvas_assignment_title),
      pointsPossible: Number.parseInt(
        launchBody.custom_canvas_assignment_points_possible
      ),
    };

    // Parse outcomes
    const acceptedDataValues = (
      launchBody.ext_outcome_data_values_accepted.split(',')
    );
    outcome = {
      url: String(launchBody.lis_outcome_service_url),
      sourcedId: String(launchBody.lis_result_sourcedid),
      urlSubmissionAccepted: !!acceptedDataValues.includes('url'),
      textSubmissionAccepted: !!acceptedDataValues.includes('text'),
      totalScoreAccepted: !!(
        launchBody.ext_outcome_result_total_score_accepted
        && String(launchBody.ext_outcome_result_total_score_accepted) === 'true'
      ),
      submittedAtAccepted: (
        launchBody.ext_outcome_submission_submitted_at_accepted
        && (
          String(launchBody.ext_outcome_submission_submitted_at_accepted)
          === 'true'
        )
      ),
    };
  }

  // Parse navigation launch
  let launchAppTitle: string
  if (!wasAssignmentLaunch) {
    launchAppTitle = String(launchBody.resource_link_title);
  }

  // Add simpler role booleans
  let isAdmin: boolean;
  let isDesigner: boolean;
  let isInstructor: boolean;
  let isLearner: boolean;
  let isNonCreditLearner: boolean;
  let isCreditLearner: boolean;
  let isTA: boolean;
  let isTTM: boolean;
  let notInCourse: boolean;
  let extRoles: string[] = [];
  if (launchBody.ext_roles && String(launchBody.ext_roles).length > 0) {
    extRoles = String(launchBody.ext_roles).split(',');
    isAdmin = !!extRoles.includes(
      'urn:lti:instrole:ims/lis/Administrator'
    );
    isInstructor = !!extRoles.includes(
      'urn:lti:role:ims/lis/Instructor'
    );
    isTA = !!extRoles.includes(
      'urn:lti:role:ims/lis/TeachingAssistant'
    );
    isDesigner = !!extRoles.includes(
      'urn:lti:role:ims/lis/ContentDeveloper'
    );
    isCreditLearner = !!extRoles.includes(
      'urn:lti:role:ims/lis/Learner'
    );
    isNonCreditLearner = !!extRoles.includes(
      'urn:lti:role:ims/lis/Learner/NonCreditLearner'
    );
    isLearner = (
      isCreditLearner
      || isNonCreditLearner
    );
    isTTM = (
      isInstructor
      || isTA
      || isDesigner
    );
    notInCourse = (
      !isInstructor
      && !isTA
      && !isDesigner
      && !isCreditLearner
      && !isNonCreditLearner
      && !isLearner
    );
  }

  // Don't allow TTMs to be learners
  if (isTTM) {
    isLearner = false;
    isCreditLearner = false;
    isNonCreditLearner = false;
  }

  // Get list of simple role names
  const roles = String(launchBody.roles || '').split(',');

  // Parse custom parameters
  const customParams = new Map<string, string>();
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
    customParams.set(shorterPropName, String(launchBody[prop]));
  });

  // Create the launchInfo object
  const launchInfo: LaunchInfo = {
    timestamp: (Number.parseInt(launchBody.oauth_timestamp) * 1000),
    canvasHost: (
      thisIsDevEnvironment
        ? 'localhost:8088'
        : String(launchBody.custom_canvas_api_domain)
    ),
    courseId: Number.parseInt(launchBody.custom_canvas_course_id),
    sisCourseId: String(launchBody.lis_course_offering_sourcedid),
    userId: Number.parseInt(launchBody.custom_canvas_user_id),
    userLoginId: String(launchBody.custom_canvas_user_login_id),
    userFirstName: String(launchBody.lis_person_name_given),
    userLastName: String(launchBody.lis_person_name_family),
    userFullName: String(launchBody.lis_person_name_full),
    userEmail: String(launchBody.lis_person_contact_email_primary),
    userImage: String(launchBody.user_image),
    isAdmin,
    isInstructor,
    isTA,
    isDesigner,
    isCreditLearner,
    isNonCreditLearner,
    isLearner,
    isTTM,
    notInCourse,
    extRoles,
    customParams,
    contextId: String(launchBody.context_id),
    contextLabel: String(launchBody.context_label),
    enrollmentState: String(launchBody.custom_canvas_enrollment_state),
    workflowState: String(launchBody.custom_canvas_workflow_state),
    launchPresentationTarget: String(
      launchBody.launch_presentation_document_target
    ),
    iframeWidth: (
      launchBody.launch_presentation_width
        ? Number.parseInt(launchBody.launch_presentation_width)
        : undefined
    ),
    iframeHeight: (
      launchBody.launch_presentation_height
        ? Number.parseInt(launchBody.launch_presentation_height)
        : undefined
    ),
    locale: String(launchBody.launch_presentation_locale || 'en'),
    returnURL: String(launchBody.launch_presentation_return_url),
    roles,
    canvasInstance: String(launchBody.tool_consumer_instance_name),
    resourceLinkId: String(launchBody.resource_link_id),
    originalLTILaunchBody: launchBody,
    launchType,
    assignment,
    outcome,
    launchAppTitle,
    consumerKey: String(launchBody.oauth_consumer_key),
  };

  /*----------------------------------------*/
  /*              Update State              */
  /*----------------------------------------*/

  // Remove tokens if user just launched as someone else
  if (
    req.session
    && req.session.launchInfo
    && req.session.launchInfo.userId
    && (req.session.launchInfo.userId !== launchInfo.userId)
  ) {
    // NOTE: Keep these values up-to-date with all the session variables added
    // by caccl-authorizer
    delete req.session.authInfo;
  }  

  // Add launchInfo to the session
  req.session.launchInfo = launchInfo;

  // Save session
  return new Promise((resolve, reject) => {
    req.session.save((err) => {
      if (err) {
        return reject(err);
      }
      return resolve(undefined);
    });
  });
};

export default parseLaunch;
