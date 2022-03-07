"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The number of seconds to keep nonces. Must expire a few seconds before this
 * @author Gabe Abrams
 */
var NONCE_LIFESPAN_SEC = (process.env.NONCE_LIFESPAN_SEC
    ? Number.parseFloat(process.env.NONCE_LIFESPAN_SEC)
    : 60);
exports.default = NONCE_LIFESPAN_SEC;
//# sourceMappingURL=NONCE_LIFESPAN_SEC.js.map