import express from 'express';
import NonceStore from './types/NonceStore';
declare class Validator {
    private nonceStore;
    private consumerKey;
    private consumerSecret;
    /**
     * Creates a new Validator
     * @author Gabe Abrams
     * @param consumerKey an LTI consumer id to compare against during
     *   launch validation
     * @param consumerSecret an LTI consumer secret to use for
     *   signature signing
     * @param nonceStore a nonce store to use for
     *   keeping track of used nonces of form { check } where check is a function:
     *   (nonce, timestamp) => Promise that resolves if valid, rejects if invalid
     */
    constructor(opts: {
        consumerKey: string;
        consumerSecret: string;
        nonceStore: NonceStore;
    });
    /**
     * Checks if an LTI launch request is valid
     * @author Gabe Abrams
     * @param {object} req - Express request object to verify
     * @return {Promise} promise that resolves if valid, rejects if invalid
     */
    isValid(req: express.Request): Promise<undefined>;
    /**
     * Checks if a nonce is valid
     * @author Gabe Abrams
     * @param req - Express request object to verify
     * @returns Promise that resolves if valid, rejects if invalid
     */
    private checkNonce;
    /**
     * Checks if an oauth_signature is valid. Throws an error if invalid
     * @author Gabe Abrams
     * @param req - Express request object to verify
     */
    private checkSignature;
}
export default Validator;
