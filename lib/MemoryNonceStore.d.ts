import NonceStore from './types/NonceStore';
declare class MemoryNonceStore implements NonceStore {
    private startTime;
    private isUsedMutex;
    private isUsedPrime;
    private isUsedSecondary;
    /**
     * Create a new MemoryNonceStore
     * @author Gabe Abrams
     */
    constructor();
    /**
     * Checks if a new nonce is valid, mark it as used
     * @author Gabe Abrams
     * @param nonce OAuth nonce
     * @param timestamp OAuth timestamp
     * @returns Promise that resolves if nonce is valid, rejects with error if
     *   nonce is invalid.
     */
    check(nonce: string, timestampSecs: number): Promise<undefined>;
    /**
     * Performs a maintenance rotation: nonces are moved from
     *   isUsedPrime => isUsedSecondary and nonces in isUsedSecondary are deleted
     * @author Gabe Abrams
     */
    private rotate;
}
export default MemoryNonceStore;
