import express from 'express';
import NonceStore from './types/NonceStore';
declare const _default: (opts: {
    app: express.Application;
    installationCredentials: {
        consumer_key: string;
        consumer_secret: string;
    };
    authorizeAfterLaunch?: boolean;
    nonceStore?: NonceStore;
}) => void;
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
export default _default;
