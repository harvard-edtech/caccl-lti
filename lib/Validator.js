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
var url_1 = __importDefault(require("url"));
// Import local modules
var MemoryNonceStore = require('./MemoryNonceStore');
var Validator = /** @class */ (function () {
    /**
     * Creates a new Validator
     * @author Gabe Abrams
     * @param consumer_key an LTI consumer id to compare against during
     *   launch validation
     * @param consumer_secret an LTI consumer secret to use for
     *   signature signing
     * @param nonceStore a nonce store to use for
     *   keeping track of used nonces of form { check } where check is a function:
     *   (nonce, timestamp) => Promise that resolves if valid, rejects if invalid
     */
    function Validator(opts) {
        // Initialize nonce store
        this.nonceStore = opts.nonceStore;
        // Verify and save consumer credentials
        if (!opts.consumer_secret) {
            throw new Error('Validator requires consumer_secret');
        }
        this.consumer_secret = opts.consumer_secret;
        if (!opts.consumer_key) {
            throw new Error('Validator requires consumer_key');
        }
        this.consumer_key = opts.consumer_key;
    }
    /**
     * Checks if an LTI launch request is valid
     * @author Gabe Abrams
     * @param {object} req - Express request object to verify
     * @return {Promise} promise that resolves if valid, rejects if invalid
     */
    Validator.prototype.isValid = function (req) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Check that consumer_key is valid
                        if (!req.body
                            || !req.body.oauth_consumer_key
                            || req.body.oauth_consumer_key !== this.consumer_key) {
                            // No consumer key or consumer key didn't match (reject immediately)
                            return [2 /*return*/, Promise.reject()];
                        }
                        // Check that nonce and signature are valid
                        return [4 /*yield*/, this.checkNonce(req)];
                    case 1:
                        // Check that nonce and signature are valid
                        _a.sent();
                        this.checkSignature(req);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Checks if a nonce is valid
     * @author Gabe Abrams
     * @param req - Express request object to verify
     * @returns Promise that resolves if valid, rejects if invalid
     */
    Validator.prototype.checkNonce = function (req) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.nonceStore.check(req.body.oauth_nonce, req.body.oauth_timestamp)];
            });
        });
    };
    /**
     * Checks if an oauth_signature is valid. Throws an error if invalid
     * @author Gabe Abrams
     * @param req - Express request object to verify
     */
    Validator.prototype.checkSignature = function (req) {
        // Generate signature for verification
        // > Build URL
        var originalUrl = req.originalUrl || req.url;
        if (!originalUrl) {
            // No url: cannot sign the request
            throw new Error('No URL to use in signature!');
        }
        var path = url_1.default.parse(originalUrl).pathname;
        var url = "".concat(req.protocol, "://").concat(req.headers.host).concat(path);
        // > Remove oauth signature from body
        var body = (0, fast_clone_1.default)(req.body);
        delete body.oauth_signature;
        // > Create signature
        var generatedSignature = decodeURIComponent(oauth_signature_1.default.generate(req.method, url, body, this.consumer_secret));
        if (generatedSignature !== req.body.oauth_signature) {
            throw new Error('Invalid signature!');
        }
    };
    return Validator;
}());
exports.default = Validator;
//# sourceMappingURL=Validator.js.map