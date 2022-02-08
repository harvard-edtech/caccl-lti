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
// Import shared constants
var CACCL_PATHS_1 = __importDefault(require("./constants/CACCL_PATHS"));
// Import helpers
var Validator_1 = __importDefault(require("./Validator"));
var parseLaunch_1 = __importDefault(require("./parseLaunch"));
// Import Nonce Store
var MemoryNonceStore_1 = __importDefault(require("./MemoryNonceStore"));
/*------------------------------------------------------------------------*/
/*                               Initializer                              */
/*------------------------------------------------------------------------*/
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
var init = function (opts) {
    // Destructure opts
    var app = opts.app, installationCredentials = opts.installationCredentials, authorizeAfterLaunch = opts.authorizeAfterLaunch, nonceStore = opts.nonceStore;
    // Throw error if credentials aren't included
    if (!installationCredentials
        || !installationCredentials.consumer_key
        || !installationCredentials.consumer_secret) {
        // Required credentials weren't included
        throw new Error('CACCL LTI can\'t be initialized without installationCredentials of the form: { consumer_key, consumer_secret }!');
    }
    // Throw error if no express app is included
    if (!app) {
        throw new Error('CACCL LTI can\'t be initialized without an express app.');
    }
    // Create validator
    var validator = new Validator_1.default({
        consumer_key: installationCredentials.consumer_key,
        consumer_secret: installationCredentials.consumer_secret,
        nonceStore: (nonceStore
            ? nonceStore
            : new MemoryNonceStore_1.default()),
    });
    // Handle POST launch requests
    app.post(CACCL_PATHS_1.default.LAUNCH, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    // Validate
                    return [4 /*yield*/, validator.isValid(req)];
                case 1:
                    // Validate
                    _a.sent();
                    // Request is valid! Parse the launch
                    return [4 /*yield*/, (0, parseLaunch_1.default)(req)];
                case 2:
                    // Request is valid! Parse the launch
                    _a.sent();
                    // Session saved! Now redirect to continue
                    if (authorizeAfterLaunch) {
                        // We are allowed to authorize on launch, so redirect to the authorize
                        // path and include redirectToAfterLaunch as the 'next' url
                        return [2 /*return*/, res.redirect(CACCL_PATHS_1.default.AUTHORIZE)];
                    }
                    // Not authorizing on launch. Immediately show the app
                    return [2 /*return*/, res.redirect('/')];
                case 3:
                    err_1 = _a.sent();
                    // Invalid launch request or an error occurred while validating/parsing
                    // launch request
                    return [2 /*return*/, (res
                            .status(403)
                            .send('We couldn\'t validate your authorization to use this app. Please try launch the app again. If you continue to have problems, please contact an admin.'))];
                case 4: return [2 /*return*/];
            }
        });
    }); });
};
/*------------------------------------------------------------------------*/
/*                             Session Parser                             */
/*------------------------------------------------------------------------*/
/**
 * Extract launch info from user's session
 * @author Gabe Abrams
 * @param req express request object or undefined if the user has not
 *   successfully launched via LTI
 * @returns info on user's current LTI launch status
 */
var parseReq = function (req) {
    if (req
        && req.session
        && req.session.launchInfo) {
        return {
            launched: true,
            launchInfo: req.session.launchInfo,
        };
    }
    return {
        launched: false,
    };
};
/*------------------------------------------------------------------------*/
/*                                 Export                                 */
/*------------------------------------------------------------------------*/
exports.default = {
    init: init,
    parseReq: parseReq,
};
//# sourceMappingURL=index.js.map