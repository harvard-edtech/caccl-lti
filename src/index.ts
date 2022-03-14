// Import express
import express from 'express';

// Import caccl libs
import initAPI from 'caccl-api';
import initCACCLMemoryStore from 'caccl-memory-store';

// Import caccl types
import CanvasExternalTool from 'caccl-api/lib/types/CanvasExternalTool';

// Import shared types
import LaunchInfo from './shared/types/LaunchInfo';

// Import shared constants
import CACCL_PATHS from './shared/constants/CACCL_PATHS';
import NONCE_LIFESPAN_SEC from './shared/constants/NONCE_LIFESPAN_SEC';
import APP_ID_LIFESPAN_SEC from './shared/constants/APP_ID_LIFESPAN_SEC';

// Import helpers
import validateLaunch from './validateLaunch';
import parseLaunch from './parseLaunch';
import LTIConfig from './shared/types/LTIConfig';

// Check if this is a dev environment
const thisIsDevEnvironment = (process.env.NODE_ENV === 'development');

/*------------------------------------------------------------------------*/
/*                               Initializer                              */
/*------------------------------------------------------------------------*/

/**
 * Create a new validator and sets up route for launch validation and lti
 *   launch information extraction
 * @author Gabe Abrams
 * @param app express app to add routes to
 * @param installationCredentials an object where keys are LTI consumer keys
 *   and values are LTI shared secrets
 * @param [initNonceStore=memory store factory] a function that creates a store
 *   for keeping track of used nonces
 * @param [selfLaunch] if included, self launches will be enabled and the app
 *   will be able to launch itself (redirect to the Canvas tool inside the
 *   course of interest)
 * @param [selfLaunch.initAppIdStore=memory store factory] a function that
 *   creates a store for keeping track of appIds
 * @param [selfLaunch.hostAppIdMap] map of appIds where
 *   keys are canvasHost strings and values are the appIds. Include appIds
 *   here if the appId is the same across the whole Canvas instance
 * @param [selfLaunch.courseAppIdMap] two-level map of appIds where the
 *   first key is the canvas host, the second key is the courseId, and values
 *   are the appIds. Include appIds here if the app is unique to specific
 *   courses
 * @param [selfLaunch.adminAccessTokenMap] map of Canvas admin access tokens
 *   that can be used to look up appIds when the appId is not in any of the
 *   appId maps. Keys are canvasHost strings and values are arrays of
 *   Canvas admin tokens that will be used to look up appIds. The tokens will
 *   be used in order: the first token will be used, then if that fails, the
 *   second token will be used, and so on.
 * @param [selfLaunch.defaultCanvasHost] default Canvas host to use in self
 *   launches
 * @param [dontAuthorizeAfterLaunch] if false, redirect the user to the CACCL
 *   authorizer after a successful LTI launch
 */
const initLTI = async (opts: LTIConfig) => {
  // Destructure opts
  const {
    app,
    installationCredentials, 
    dontAuthorizeAfterLaunch,
    selfLaunch,
  } = opts;
  const initNonceStore = (opts.initNonceStore ?? initCACCLMemoryStore);

  /*----------------------------------------*/
  /*              Self Launches             */
  /*----------------------------------------*/

  if (selfLaunch || thisIsDevEnvironment) {
    // Get selfLaunch configuration
    const initAppIdStore = (
      selfLaunch?.initAppIdStore
      ?? initCACCLMemoryStore
    );
    const hostAppIdMap = (
      selfLaunch?.hostAppIdMap
      ?? {}
    );
    const courseAppIdMap = (
      selfLaunch?.courseAppIdMap
      ?? {}
    );
    const adminAccessTokenMap = (
      selfLaunch?.adminAccessTokenMap
      ?? {}
    );
    const defaultCanvasHost = (
      thisIsDevEnvironment
        ? 'localhost:8088'
        : (selfLaunch?.defaultCanvasHost ?? 'canvas.instructure.com')
    );

    // Initialize store
    const appIdStore = await initAppIdStore(APP_ID_LIFESPAN_SEC);

    // Initialize copy of the api
    const api = initAPI();

    /**
     * Handle a self-launch request
     * @author Gabe Abrams
     * @param {number} courseId the Canvas id of the course to launch from
     * @param {string} [canvasHost=selfLaunch.defaultCanvasHost] host of the
     *   Canvas instance containing the course to launch from
     * @param {number} [appId=look up appId] id for this app as it is installed in
     *   Canvas in the course
     * @param {string} [selfLaunchState] stringified self launch data
     */
    app.get(
      CACCL_PATHS.SELF_LAUNCH,
      async (req, res) => {
        // Get courseId
        const courseId = Number.parseInt(String(req.query.courseId));
        if (!courseId || Number.isNaN(courseId)) {
          return res.status(422).send('To self-launch this app, CACCL needs a courseId. Please contact support.');
        }

        // Get canvasHost
        let canvasHost = (
          req.query.canvasHost
            ? decodeURIComponent(String(req.query.canvasHost))
            : undefined
        );
        if (!canvasHost && defaultCanvasHost) {
          canvasHost = defaultCanvasHost;
        }
        if (!canvasHost || canvasHost.trim().length === 0) {
          return res.status(422).send('To self-launch this app, CACCL needs a canvasHost. Please contact support.');
        }

        // Get the appId
        let appId: number;
        // > Get from query
        if (
          !appId
          && req.query.appId
          && !Number.isNaN(Number.parseInt(String(req.query.appId)))
        ) {
          appId = Number.parseInt(String(req.query.appId));
        }
        // > Get from course map
        if (
          !appId
          && courseAppIdMap
          && courseAppIdMap[canvasHost]
          && courseAppIdMap[canvasHost][courseId]
        ) {
          appId = courseAppIdMap[canvasHost][courseId];
        }
        // > Get from host map
        if (
          !appId
          && hostAppIdMap
          && hostAppIdMap[canvasHost]
        ) {
          appId = hostAppIdMap[canvasHost];
        }
        // > Look up in store
        if (!appId) {
          const value = await appIdStore.get(`${canvasHost}/${courseId}`);
          if (value) {
            const storedAppId = Number.parseInt(String(value.appId));
            if (!Number.isNaN(storedAppId)) {
              appId = storedAppId;
            }
          }
        }
        // > Look up via API
        if (!appId && adminAccessTokenMap) {
          // Get a list of candidate access tokens
          const accessTokens = (
            adminAccessTokenMap[canvasHost]
            ?? []
          );
          for (let i = 0; i < accessTokens.length; i++) {
            // Get list of apps
            let apps: CanvasExternalTool[];
            try {
              apps = await api.course.app.list(
                {
                  courseId,
                },
                {
                  canvasHost,
                  accessToken: accessTokens[i],
                },
              );
            } catch (err) {
              // This token failed. Simply continue
              continue;
            }

            // Try to find the correct app
            const app = apps.find((candidateApp) => {
              return candidateApp.url.startsWith(`${req.protocol}://${req.hostname}${CACCL_PATHS.LAUNCH}`);
            });
            if (app) {
              appId = app.id;
              break;
            }
          }
        }
        // Error if no app found
        if (!appId) {
          return res.status(404).send('This app cannot be launched this way because it is not yet installed into the course that you are launching from. Please contact support.');
        }

        // Store selfLaunchState in session
        if (req.query.selfLaunchState) {
          try {
            // Parse self launch state and store in session
            req.session.cacclLTISelfLaunchState = JSON.parse(
              decodeURIComponent(String(req.query.selfLaunchState))
            );
          } catch (err) {
            return res.status(500).send('This app cannot be launched this way because we could not store state before continuing. Please contact support.');
          }
        }

        // Redirect for self-launch
        const url = `https://${canvasHost}/courses/${courseId}/external_tools/${appId}?display=borderless`;
        return res.redirect(url);
      },
    );
  } else {
    // Self launches are disabled
    app.get(
      CACCL_PATHS.SELF_LAUNCH,
      (req, res) => {
        return res.status(404).send('Self launches are not enabled for this app.');
      },
    );
  }

  /*----------------------------------------*/
  /*              LTI Launches              */
  /*----------------------------------------*/

  // Throw error if credentials aren't included
  if (
    !installationCredentials
    || Object.values(installationCredentials).length === 0
  ) {
    // Required credentials weren't included
    throw new Error('CACCL LTI can\'t be initialized without installationCredentials!');
  }

  // Throw error if no express app is included
  if (!app) {
    throw new Error('CACCL LTI can\'t be initialized without an express app.');
  }

  // Initialize nonce store
  const store = await initNonceStore(NONCE_LIFESPAN_SEC);
  const startTimestamp = Date.now();

  // Handle POST launch requests
  app.post(
    CACCL_PATHS.LAUNCH,
    async (
      req: express.Request,
      res: express.Response,
    ) => {
      // This is an LTI launch. Handle it
      // Validate the launch request
      try {
        // Get the associated consumer secret
        const consumerKey = req.body?.oauth_consumer_key;
        const consumerSecret = installationCredentials[consumerKey];
        if (!consumerSecret) {
          return res.status(403).send('This app is not yet set up to use your credentials. Please contact support.');
        }

        // Validate
        await validateLaunch({
          req,
          consumerSecret,
          store,
          startTimestamp,
        });

        // Request is valid! Parse the launch
        await parseLaunch(req);

        // Session saved! Now redirect to continue
        if (!dontAuthorizeAfterLaunch) {
          // We are allowed to authorize on launch, so redirect to the authorize
          // path and include redirectToAfterLaunch as the 'next' url
          return res.redirect(CACCL_PATHS.AUTHORIZE);
        }

        // Not authorizing on launch. Immediately show the app
        return res.redirect('/');
      } catch (err) {
        // Invalid launch request or an error occurred while validating/parsing
        // launch request
        console.log(err);
        return (
          res
            .status(403)
            .send('We couldn\'t validate your authorization to use this app. Please try launch the app again. If you continue to have problems, please contact an admin.')
        );
      }
    },
  );
};

/*------------------------------------------------------------------------*/
/*                             Session Parser                             */
/*------------------------------------------------------------------------*/

/**
 * Extract launch info from user's session
 * @author Gabe Abrams
 * @param req express request object
 * @returns info on user's current LTI launch status
 */
const getLaunchInfo = (
  req: express.Request,
): {
  launched: boolean,
  launchInfo?: LaunchInfo,
} => {
  if (
    req
    && req.session
    && req.session.launchInfo
  ) {
    return {
      launched: true,
      launchInfo: req.session.launchInfo,
    };
  }
  return {
    launched: false,
  };
};

/*------------------------------------------------------------------------*/
/*                          Self-launch Function                          */
/*------------------------------------------------------------------------*/

/**
 * Get the URL for a self-launch request
 * @author Gabe Abrams
 * @param {number} courseId the Canvas id of the course to launch from
 * @param {string} [canvasHost=defaultCanvasHost] host of the
 *   Canvas instance containing the course to launch from
 * @param {number} [appId=look up appId] id for this app as it is installed in
 *   Canvas in the course
 * @param {any} [selfLaunchState] self launch state to add to launchInfo
 *   so you can keep track of state through the self launch process. This
 *   object will appear at launchInfo.selfLaunchState. Must be JSONifiable.
 *   Note: this information will be passed in the URL, so it should not
 *   be sensitive data.
 * @returns {string} url to redirect to for starting the self-launch process
 */
const getSelfLaunchURL = (
  opts: {
    courseId: number,
    canvasHost?: string,
    appId?: number,
    selfLaunchState?: any,
  },
): string => {
  const {
    courseId,
    canvasHost,
    appId,
    selfLaunchState,
  } = opts;

  // Build the URL
  let url = `${CACCL_PATHS.SELF_LAUNCH}?courseId=${courseId}`;
  if (canvasHost) {
    url += `&canvasHost=${encodeURIComponent(canvasHost)}`;
  }
  if (appId) {
    url += `&appId=${appId}`;
  }
  if (selfLaunchState) {
    url += `&selfLaunchState=${encodeURIComponent(selfLaunchState)}`;
  }
  
  return url;
};

/*------------------------------------------------------------------------*/
/*                                 Export                                 */
/*------------------------------------------------------------------------*/

export default initLTI;

export { getLaunchInfo, getSelfLaunchURL };
