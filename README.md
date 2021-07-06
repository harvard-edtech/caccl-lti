# caccl-lti
Validates and parses LTI launch requests.

With caccl-lti, it's easy to enable LTI launches from Canvas. We'll take care of parsing and verifying the validity of launch requests.

## Part of the CACCL library
**C**anvas  
**A**pp  
**C**omplete  
**C**onnection  
**L**ibrary  


## Quickstart

Quickstart:

```js
const initLTI = require('caccl-lti');

initLTI({
  app: /* express app with express-sessions enabled */,
  installationCredentials: /* { consumer_key, consume_secret }*/,
});
```

The app will now be set up to accept LTI launches at `/launch`. See "Launch Parsing" below to find info on parsed launches.

## Configuration Options

When initializing caccl-lti, you can pass in many different configuration options to customize caccl-lti's behavior or turn on/off certain functionality.

**Note:** configuration options are _optional_ unless otherwise stated

Config Option | Type | Description | Default/Required
:--- | :--- | :--- | :---
app | express app | express app to add routes to | **Required**
installationCredentials | object | LTI consumer credentials of form: `{ consumer_key, consumer_secret }` | **Required**
launchPath | string | path to accept launches at (new express POST route added) | /launch
redirectToAfterLaunch | string | path to redirect to after successful launch | same as launchPath
nonceStore | [NonceStore](https://github.com/harvard-edtech/caccl-lti/blob/master/docs/NonceStore.md) | a nonce store to use for keeping track of used nonces | memory store
disableAuthorizeOnLaunch | boolean | if false, redirects to authorizePath after launch is validated and parsed (and includes redirectToAfterLaunch) as the 'next link so that caccl-authorizer redirects to redirectToAfterLaunch after finishing authorization | false
authorizePath | string | the authorization path (as set up by caccl-authorizer, required if disableAUthorizeOnLaunch is true | null

## Launch Parsing

Launches are automatically parsed and added to session. To retrieve launch info, see the `req.session.launchInfo` variable, which has the following properties:

For more detailed information, see [Canvas' LTI documentation](https://canvas.instructure.com/doc/api/file.tools_intro.html).

### User Info

Property | Type | Description
:--- | :--- | :---
userId | number | Canvas user id of the person who launched the app
userLoginId | string | Canvas login id (e.g., university id)
userEmail | string | the user's primary Canvas email (changeable in user's profile)
userFirstName | string | the user's first name
userLastName | string | the user's last name
userFullName | string | the user's full name
userImage | string | link to user's image
isInstructor | boolean | true if the user is an instructor in the launch course
isTA | boolean | true if the user is a teaching assistant in the launch course
isDesigner | boolean | true if the user is a designer in the launch course
isCreditLearner | boolean | true if the user is a for-credit learner (student) in the launch course
isNonCreditLearner | boolean | true if the user is a not-for-credit learner (student) in the launch course
isLearner | boolean | true if the user any type of learner (student) in the launch course
notInCourse | boolean | true if the user is not enrolled in the course
extRoles | string[] | list of extended Canvas roles
roles | string[] | list of basic Canvas roles (outdated)
locale | string | user locale (e.g., "en")

#### Launch Info

Property | Type | Description
:--- | :--- | :---
timestamp | number | launch timestamp (ms)
contextId | string | LTI launch context
launchPresentationTarget | string | LTI launch presentation target (e.g., "iframe")
iframeWidth | number | iframe width (if applicable)
iframeHeight | number | iframe height (if applicable)
returnURL | string | LTI return URL
launchAppTitle | string | the title of the resource link (app title)
customParams | object | mapping (key => value) listing all custom launch parameters and their values

#### Course Info

Property | Type | Description
:--- | :--- | :---
courseId | number | Canvas course id of the launch course
sisCourseId | number | Learning Information Services identifier for the course offering
enrollmentState | string | Canvas enrollment state (e.g., "active")

#### Canvas Info

Property | Type | Description
:--- | :--- | :---
contextLabel | string | the name of the launch context (e.g., course name)
canvasHost | string | host of the launch Canvas instance
workflowState | string | Canvas workflow status (e.g., "active")