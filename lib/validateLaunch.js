"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var oauth_signature_1 = __importDefault(require("oauth-signature"));
var fast_clone_1 = __importDefault(require("fast-clone"));
var NONCE_LIFESPAN_SEC_1 = __importDefault(require("./shared/constants/NONCE_LIFESPAN_SEC"));
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
var validateLaunch = function (opts) { return __awaiter(void 0, void 0, void 0, function () {
    var req, consumerSecret, store, startTimestamp, nonce, timestamp, secDiff, prevNonceOccurrence, originalURL, urlNoQuery, path, url, body, generatedSignature;
    var _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                req = opts.req, consumerSecret = opts.consumerSecret, store = opts.store, startTimestamp = opts.startTimestamp;
                /*----------------------------------------*/
                /*              Parse request             */
                /*----------------------------------------*/
                // Nonce
                if (!((_a = req.body) === null || _a === void 0 ? void 0 : _a.oauth_nonce)) {
                    throw new Error('no nonce included');
                }
                nonce = String(req.body.oauth_nonce);
                // Timestamp
                if (!((_b = req.body) === null || _b === void 0 ? void 0 : _b.oauth_timestamp)
                    || Number.isNaN(Number.parseFloat(req.body.oauth_timestamp))) {
                    throw new Error('no valid timestamp included');
                }
                timestamp = (Number.parseFloat(req.body.oauth_timestamp)
                    * 1000);
                // Signature
                if (!((_c = req.body) === null || _c === void 0 ? void 0 : _c.oauth_signature)) {
                    throw new Error('no signature included');
                }
                /*----------------------------------------*/
                /*               Check Nonce              */
                /*----------------------------------------*/
                // Check if from before start
                if (timestamp <= startTimestamp) {
                    throw new Error('nonce too old');
                }
                secDiff = Math.abs(Date.now() - timestamp) / 1000;
                if (secDiff > (NONCE_LIFESPAN_SEC_1.default - 5)) {
                    // Expired!
                    throw new Error('nonce expired');
                }
                return [4 /*yield*/, store.set(nonce, { timestamp: timestamp })];
            case 1:
                prevNonceOccurrence = _d.sent();
                if (prevNonceOccurrence) {
                    // Nonce was already used
                    throw new Error('nonce already used');
                }
                originalURL = (req.originalUrl || req.url);
                if (!originalURL) {
                    // No url: cannot sign the request
                    throw new Error('no URL to use in signature');
                }
                urlNoQuery = originalURL.split('?')[0].split('#')[0];
                path = (urlNoQuery
                    // Remove protocol
                    .replace("".concat(req.protocol, "://"), '')
                    // Remove host
                    .replace(req.hostname, ''));
                url = "".concat(req.protocol, "://").concat(req.headers.host).concat(path);
                body = (0, fast_clone_1.default)(req.body);
                delete body.oauth_signature;
                generatedSignature = decodeURIComponent(oauth_signature_1.default.generate(req.method, url, body, consumerSecret));
                // Check the signature
                if (generatedSignature !== req.body.oauth_signature) {
                    throw new Error('invalid signature');
                }
                return [2 /*return*/];
        }
    });
}); };
exports.default = validateLaunch;
//# sourceMappingURL=validateLaunch.js.map