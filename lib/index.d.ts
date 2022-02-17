import express from 'express';
import NonceStore from './types/NonceStore';
import LaunchInfo from './types/LaunchInfo';
/**
 * Create a new validator and sets up route for launch validation and lti
 *   launch information extraction
 * @author Gabe Abrams
 * @param app express app to add routes to
 * @param installationCredentials.consumer_key an LTI consumer key to
 *   compare against during launch validation
 * @param installationCredentials.consumer_secret an LTI consumer
 *   secret to use for signature signing
 * @param [authorizeAfterLaunch] if true, redirect the user to the CACCL
 *   authorizer after a successful LTI launch
 * @param [nonceStore=memory store] a nonce store to use for
 *   keeping track of used nonces
 */
declare const init: (opts: {
    app: express.Application;
    installationCredentials: {
        consumer_key: string;
        consumer_secret: string;
    };
    authorizeAfterLaunch?: boolean;
    nonceStore?: NonceStore;
}) => void;
/**
 * Extract launch info from user's session
 * @author Gabe Abrams
 * @param req express request object or undefined if the user has not
 *   successfully launched via LTI
 * @returns info on user's current LTI launch status
 */
declare const getLaunchInfo: (req: express.Request) => {
    launched: boolean;
    launchInfo?: LaunchInfo;
};
export default init;
export { getLaunchInfo };
