# LaunchInfo

Upon a successful LTI launch, the following `launchInfo` object is created:

## Popular Properties:

Property | Type | Description
:--- | :--- | :---
timestamp | number (ms) | launch timestamp
canvasHost | string | Canvas host of the launch (where the user launched from)
courseId | number | Canvas courseId of the course the user launched from
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
launchAppTitle | string | title of the app that was launched
roles | string[] | list of depricated Canvas roles
canvasInstance | string | name of the Canvas instance the user launched from