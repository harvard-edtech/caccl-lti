# LaunchInfo

Upon a successful LTI launch, the following `launchInfo` object is created:

## Popular Properties:

Property | Type | Description
:--- | :--- | :---
timestamp | number (ms) | launch timestamp
canvasHost | string | Canvas host of the launch (where the user launched from)
courseId | number | Canvas courseId of the course the user launched from
sisCourseId | number | Learning Information Services identifier for the course offering
userId | number | Canvas userId of the user who initiated the launch
userLoginId | string | loginId of the user who initiated the launch
userFirstName | string | launch user's first name
userLastName | string | launch user's last name
userFullName | string | launch user's full name
userEmail | string | launch user's email
userImage | string | URL of the user's profile image
isInstructor | boolean | true if user is an instructor in the launch course
isTA | boolean | true if user is a TA in the launch course
isDesigner | boolean | true if user is a designer in the launch course
isCreditLearner | boolean | true if user is a learner for credit in the launch course
isNonCreditLearner | boolean | true if user is a learner not for credit in the launch course
isLearner | boolean | true if user is any type of learner in the launch course
extRoles | string[] | list of ext Canvas roles of the launch user
customParams | object | list of custom launch parameters (name => value [string])
launchType | string | the type of LTI launch (either 'navigation' or 'assignment')
originalLTILaunchBody | object | the original LTI launch body, unparsed

## Other Properties:

Property | Type | Description
:--- | :--- | :---
contextId | string | LTI launch context id
contextLabel | string | LTI launch context label
enrollmentState | string | Canvas enrollment state for the launch course (example: 'active')
workflowState | string | Canvas workflow state (example: 'available')
launchPresentationTarget | string | LTI launch presentation target (example: 'iframe')
iframeWidth | number | pixel width of the iframe (if applicable)
iframeHeight | number | pixel height of the iframe (if applicable)
locale | string | locale of the current user (example: 'en')
returnURL | string | launch presentation return URL
launchAppTitle | string | title of the app that was launched (only available if launch was type 'navigation')
roles | string[] | list of depricated Canvas roles
canvasInstance | string | name of the Canvas instance the user launched from
resourceLinkId | string | the resource link id
assignment | object | info on the assignment the user launched from in the form `{ id, name, pointsPossible }` (only available if launch was type 'navigation')
outcome | object | an object containing relevant external assignment outcome info. See below for more details (only available if launch was type 'assignment')

### Outcome

Property | Type | Description
:--- | :--- | :---
url | string | the outcome service url
sourcedId | string | the LTI passback sourcedid
urlSubmissionAccepted | boolean | true if url submissions are accepted
textSubmissionAccepted | boolean | true if text submissions are accepted
totalScoreAccepted | boolean | true if the total score is accepted
submittedAtAccepted | boolean | true if the submittedAt timestamp is accepted
