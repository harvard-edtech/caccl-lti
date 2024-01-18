"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var LaunchType_1 = __importDefault(require("./shared/types/LaunchType"));
// Check if this is a dev environment
var thisIsDevEnvironment = (process.env.NODE_ENV === 'development');
/*------------------------------------------------------------------------*/
/*                                Constants                               */
/*------------------------------------------------------------------------*/
// List of Canvas custom param names
var CANVAS_CUSTOM_PARAMS = [
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
var parseLaunch = function (req) { return __awaiter(void 0, void 0, void 0, function () {
    var launchBody, wasAssignmentLaunch, launchType, assignment, outcome, acceptedDataValues, launchAppTitle, isAdmin, isDesigner, isInstructor, isLearner, isNonCreditLearner, isCreditLearner, isTA, isTTM, notInCourse, extRoles, roles, customParams, launchInfo;
    return __generator(this, function (_a) {
        launchBody = req.body;
        wasAssignmentLaunch = (launchBody.custom_canvas_assignment_id
            && launchBody.custom_canvas_assignment_title
            && launchBody.custom_canvas_assignment_points_possible);
        launchType = (wasAssignmentLaunch
            ? LaunchType_1.default.Assignment
            : LaunchType_1.default.Navigation);
        if (wasAssignmentLaunch) {
            // Parse custom params
            assignment = {
                id: Number.parseInt(launchBody.custom_canvas_assignment_id),
                name: String(launchBody.custom_canvas_assignment_title),
                pointsPossible: Number.parseInt(launchBody.custom_canvas_assignment_points_possible),
            };
            acceptedDataValues = (launchBody.ext_outcome_data_values_accepted.split(','));
            outcome = {
                url: String(launchBody.lis_outcome_service_url),
                sourcedId: String(launchBody.lis_result_sourcedid),
                urlSubmissionAccepted: !!acceptedDataValues.includes('url'),
                textSubmissionAccepted: !!acceptedDataValues.includes('text'),
                totalScoreAccepted: !!(launchBody.ext_outcome_result_total_score_accepted
                    && String(launchBody.ext_outcome_result_total_score_accepted) === 'true'),
                submittedAtAccepted: (launchBody.ext_outcome_submission_submitted_at_accepted
                    && (String(launchBody.ext_outcome_submission_submitted_at_accepted)
                        === 'true')),
            };
        }
        if (!wasAssignmentLaunch) {
            launchAppTitle = String(launchBody.resource_link_title);
        }
        extRoles = [];
        if (launchBody.ext_roles && String(launchBody.ext_roles).length > 0) {
            extRoles = String(launchBody.ext_roles).split(',');
            isAdmin = !!extRoles.includes('urn:lti:instrole:ims/lis/Administrator');
            isInstructor = !!extRoles.includes('urn:lti:role:ims/lis/Instructor');
            isTA = !!extRoles.includes('urn:lti:role:ims/lis/TeachingAssistant');
            isDesigner = !!extRoles.includes('urn:lti:role:ims/lis/ContentDeveloper');
            isCreditLearner = !!extRoles.includes('urn:lti:role:ims/lis/Learner');
            isNonCreditLearner = !!extRoles.includes('urn:lti:role:ims/lis/Learner/NonCreditLearner');
            isLearner = (isCreditLearner
                || isNonCreditLearner);
            isTTM = (isInstructor
                || isTA
                || isDesigner);
            notInCourse = (!isInstructor
                && !isTA
                && !isDesigner
                && !isCreditLearner
                && !isNonCreditLearner
                && !isLearner);
        }
        // Don't allow TTMs to be learners
        if (isTTM) {
            isLearner = false;
            isCreditLearner = false;
            isNonCreditLearner = false;
        }
        roles = String(launchBody.roles || '').split(',');
        customParams = new Map();
        Object.keys(launchBody).forEach(function (prop) {
            // Check if this is a custom param that wasn't sent by Canvas itself
            if (!prop.startsWith('custom_')
                || CANVAS_CUSTOM_PARAMS.indexOf(prop) >= 0) {
                // Not a custom parameter. Skip!
                return;
            }
            // Rename prop without "custom_" prefix
            var shorterPropName = prop.substring(7);
            // Save custom parameter
            customParams.set(shorterPropName, String(launchBody[prop]));
        });
        launchInfo = {
            timestamp: (Number.parseInt(launchBody.oauth_timestamp) * 1000),
            canvasHost: (thisIsDevEnvironment
                ? 'localhost:8088'
                : String(launchBody.custom_canvas_api_domain)),
            courseId: Number.parseInt(launchBody.custom_canvas_course_id),
            sisCourseId: String(launchBody.lis_course_offering_sourcedid),
            userId: Number.parseInt(launchBody.custom_canvas_user_id),
            userLoginId: String(launchBody.custom_canvas_user_login_id),
            userFirstName: String(launchBody.lis_person_name_given),
            userLastName: String(launchBody.lis_person_name_family),
            userFullName: String(launchBody.lis_person_name_full),
            userEmail: String(launchBody.lis_person_contact_email_primary),
            userImage: String(launchBody.user_image),
            isAdmin: isAdmin,
            isInstructor: isInstructor,
            isTA: isTA,
            isDesigner: isDesigner,
            isCreditLearner: isCreditLearner,
            isNonCreditLearner: isNonCreditLearner,
            isLearner: isLearner,
            isTTM: isTTM,
            notInCourse: notInCourse,
            extRoles: extRoles,
            customParams: Object.fromEntries(customParams),
            contextId: String(launchBody.context_id),
            contextLabel: String(launchBody.context_label),
            enrollmentState: String(launchBody.custom_canvas_enrollment_state),
            workflowState: String(launchBody.custom_canvas_workflow_state),
            launchPresentationTarget: String(launchBody.launch_presentation_document_target),
            iframeWidth: (launchBody.launch_presentation_width
                ? Number.parseInt(launchBody.launch_presentation_width)
                : undefined),
            iframeHeight: (launchBody.launch_presentation_height
                ? Number.parseInt(launchBody.launch_presentation_height)
                : undefined),
            locale: String(launchBody.launch_presentation_locale || 'en'),
            returnURL: String(launchBody.launch_presentation_return_url),
            roles: roles,
            canvasInstance: String(launchBody.tool_consumer_instance_name),
            resourceLinkId: String(launchBody.resource_link_id),
            originalLTILaunchBody: launchBody,
            launchType: launchType,
            assignment: assignment,
            outcome: outcome,
            launchAppTitle: launchAppTitle,
            consumerKey: String(launchBody.oauth_consumer_key),
        };
        /*----------------------------------------*/
        /*              Update State              */
        /*----------------------------------------*/
        // Remove tokens if user just launched as someone else
        if (req.session
            && req.session.launchInfo
            && req.session.launchInfo.userId
            && (req.session.launchInfo.userId !== launchInfo.userId)) {
            // NOTE: Keep these values up-to-date with all the session variables added
            // by caccl-authorizer
            delete req.session.authInfo;
        }
        // Add launchInfo to the session
        req.session.launchInfo = launchInfo;
        // Save session
        return [2 /*return*/, new Promise(function (resolve, reject) {
                req.session.save(function (err) {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(undefined);
                });
            })];
    });
}); };
exports.default = parseLaunch;
//# sourceMappingURL=parseLaunch.js.map