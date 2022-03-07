"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The number of seconds to keep appIds
 * @author Gabe Abrams
 */
var APP_ID_LIFESPAN_SEC = (process.env.APP_ID_LIFESPAN_SEC
    ? Number.parseFloat(process.env.APP_ID_LIFESPAN_SEC)
    : 2 * 86400 // 2 days
);
exports.default = APP_ID_LIFESPAN_SEC;
//# sourceMappingURL=APP_ID_LIFESPAN_SEC.js.map