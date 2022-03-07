import AssignmentDescription from './AssignmentDescription';
import LaunchType from './LaunchType';
import OutcomeDescription from './OutcomeDescription';

/**
 * Shared launch info (independent of launch type)
 * @author Gabe Abrams
 */
interface SharedLaunchInfo {
  // Launch timestamp
  timestamp: number,
  // Canvas host of the launch(where the user launched from)
  canvasHost: string,
  // Canvas courseId of the course the user launched from
  courseId: number,
  // Learning Information Services identifier for the course offering
  sisCourseId: string,
  // Canvas userId of the user who initiated the launch
  userId: number,
  // loginId of the user who initiated the launch
  userLoginId: string,
  // Launch user's first name
  userFirstName: string,
  // Launch user's last name
  userLastName: string,
  // Launch user's full name
  userFullName: string,
  // User's email
  userEmail: string,
  // URL of the user's profile image
  userImage: string,
  // True if the user is a Canvas admin
  isAdmin: boolean,
  // True if the user is an instructor
  isInstructor: boolean,
  // True if the user is a TA
  isTA: boolean,
  // True if the user is a course designer
  isDesigner: boolean,
  // True if the user is a learner for credit
  isCreditLearner: boolean,
  // True if the user is a learner not for credit
  isNonCreditLearner: boolean,
  // True if user is any type of learner
  isLearner: boolean,
  // True if the user is a teaching team member (TA, instructor, designer)
  isTTM: boolean,
  // True if the user is not in the course
  notInCourse: boolean,
  // List of ext Canvas roles for the launch user
  extRoles: string[],
  // Map of custom launch params (key is name, value is custom parameter value)
  customParams: Map<string, string>,
  // LTI launch context id
  contextId: string,
  // LTI launch context label
  contextLabel: string,
  // Canvas enrollment state for the launch course (example: 'active')
  enrollmentState: string,
  // Canvas workflow state(example: 'available')
  workflowState: string,
  // LTI launch presentation target(example: 'iframe')
  launchPresentationTarget: string,
  // Width of the iframe in pixels (if available)
  iframeWidth?: number,
  // Height of the iframe in pixels (if available)
  iframeHeight?: number,
  // Locale of the current user (example: 'en')
  locale: string,
  // Launch presentation return URL
  returnURL: string,
  // List of deprecated Canvas roles
  roles: string[],
  // Name of the Canvas instance the user launched from
  canvasInstance: string,
  // The resource link id
  resourceLinkId: string,
  // Original body of the launch request
  originalLTILaunchBody: { [k in string]: any },
  // Consumer key
  consumerKey: string,
  // State data passed through via self launch
  selfLaunchState?: any,
}

/**
 * Type for launch info that's added to user's session
 * @author Gabe Abrams
 */
type LaunchInfo = (
  | {
    // Assignment launch type
    launchType: LaunchType.Assignment,
    // Assignment user launched from
    assignment?: AssignmentDescription,
    // External assignment outcome info
    outcome?: OutcomeDescription,
  }
  | {
    // Assignment launch type
    launchType: LaunchType.Navigation,
    // Title of the app that was launched
    launchAppTitle?: string,
  }
) & SharedLaunchInfo;

export default LaunchInfo;
