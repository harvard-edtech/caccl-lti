import express from 'express';
import CACCLStore from 'caccl-memory-store/lib/CACCLStore';
/**
 * Checks if an LTI launch request is valid. Throws an error if invalid
 * @author Gabe Abrams
 * @param opts object containing all arguments
 * @param opts.req Express request object to verify
 * @param opts.consumerSecret an LTI consumer secret to use for signature
 *   signing
 * @param opts.store a nonce store to use for keeping track of used nonces
 * @param opts.startTimestamp time when store was created
 */
declare const validateLaunch: (opts: {
    req: express.Request;
    consumerSecret: string;
    store: CACCLStore;
    startTimestamp: number;
}) => Promise<void>;
export default validateLaunch;
