import express from 'express';
import LaunchInfo from './shared/types/LaunchInfo';
import LTIConfig from './shared/types/LTIConfig';
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
 * @param [authorizeAfterLaunch] if true, redirect the user to the CACCL
 *   authorizer after a successful LTI launch
 */
declare const initLTI: (opts: LTIConfig) => Promise<void>;
/**
 * Extract launch info from user's session
 * @author Gabe Abrams
 * @param req express request object
 * @returns info on user's current LTI launch status
 */
declare const getLaunchInfo: (req: express.Request) => {
    launched: boolean;
    launchInfo?: LaunchInfo;
};
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
declare const getSelfLaunchURL: (opts: {
    courseId: number;
    canvasHost?: string;
    appId?: number;
    selfLaunchState?: any;
}) => string;
export default initLTI;
export { getLaunchInfo, getSelfLaunchURL };
