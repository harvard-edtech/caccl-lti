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
exports.getSelfLaunchURL = exports.getLaunchInfo = void 0;
// Import caccl libs
var caccl_api_1 = __importDefault(require("caccl-api"));
var caccl_memory_store_1 = __importDefault(require("caccl-memory-store"));
// Import shared constants
var CACCL_PATHS_1 = __importDefault(require("./shared/constants/CACCL_PATHS"));
var NONCE_LIFESPAN_SEC_1 = __importDefault(require("./shared/constants/NONCE_LIFESPAN_SEC"));
var APP_ID_LIFESPAN_SEC_1 = __importDefault(require("./shared/constants/APP_ID_LIFESPAN_SEC"));
// Import helpers
var validateLaunch_1 = __importDefault(require("./validateLaunch"));
var parseLaunch_1 = __importDefault(require("./parseLaunch"));
// Check if this is a dev environment
var thisIsDevEnvironment = (process.env.NODE_ENV === 'development');
/*------------------------------------------------------------------------*/
/*                               Initializer                              */
/*------------------------------------------------------------------------*/
/**
 * Create a new validator and sets up route for launch validation and lti
 *   launch information extraction
 * @author Gabe Abrams
 * @param app express app to add routes to
 * @param installationCredentials an object where keys are LTI consumer keys
 *   and values are LTI shared secrets
 * @param [initNonceStore=memory store factory] a function that creates a store
 *   for keeping track of used nonces
 * @param [selfLaunch] if included, self launches will be enabled and the app
 *   will be able to launch itself (redirect to the Canvas tool inside the
 *   course of interest)
 * @param [selfLaunch.initAppIdStore=memory store factory] a function that
 *   creates a store for keeping track of appIds
 * @param [selfLaunch.hostAppIdMap] map of appIds where
 *   keys are canvasHost strings and values are the appIds. Include appIds
 *   here if the appId is the same across the whole Canvas instance
 * @param [selfLaunch.courseAppIdMap] two-level map of appIds where the
 *   first key is the canvas host, the second key is the courseId, and values
 *   are the appIds. Include appIds here if the app is unique to specific
 *   courses
 * @param [selfLaunch.adminAccessTokenMap] map of Canvas admin access tokens
 *   that can be used to look up appIds when the appId is not in any of the
 *   appId maps. Keys are canvasHost strings and values are arrays of
 *   Canvas admin tokens that will be used to look up appIds. The tokens will
 *   be used in order: the first token will be used, then if that fails, the
 *   second token will be used, and so on.
 * @param [selfLaunch.defaultCanvasHost] default Canvas host to use in self
 *   launches
 * @param [dontAuthorizeAfterLaunch] if false, redirect the user to the CACCL
 *   authorizer after a successful LTI launch
 */
var initLTI = function (opts) { return __awaiter(void 0, void 0, void 0, function () {
    var app, installationCredentials, dontAuthorizeAfterLaunch, selfLaunch, initNonceStore, initAppIdStore, hostAppIdMap_1, courseAppIdMap_1, adminAccessTokenMap_1, defaultCanvasHost_1, appIdStore_1, api_1, store, startTimestamp;
    var _a, _b, _c, _d, _e, _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                app = opts.app, installationCredentials = opts.installationCredentials, dontAuthorizeAfterLaunch = opts.dontAuthorizeAfterLaunch, selfLaunch = opts.selfLaunch;
                initNonceStore = ((_a = opts.initNonceStore) !== null && _a !== void 0 ? _a : caccl_memory_store_1.default);
                if (!(selfLaunch || thisIsDevEnvironment)) return [3 /*break*/, 2];
                initAppIdStore = ((_b = selfLaunch === null || selfLaunch === void 0 ? void 0 : selfLaunch.initAppIdStore) !== null && _b !== void 0 ? _b : caccl_memory_store_1.default);
                hostAppIdMap_1 = ((_c = selfLaunch === null || selfLaunch === void 0 ? void 0 : selfLaunch.hostAppIdMap) !== null && _c !== void 0 ? _c : {});
                courseAppIdMap_1 = ((_d = selfLaunch === null || selfLaunch === void 0 ? void 0 : selfLaunch.courseAppIdMap) !== null && _d !== void 0 ? _d : {});
                adminAccessTokenMap_1 = ((_e = selfLaunch === null || selfLaunch === void 0 ? void 0 : selfLaunch.adminAccessTokenMap) !== null && _e !== void 0 ? _e : {});
                defaultCanvasHost_1 = (thisIsDevEnvironment
                    ? 'localhost:8088'
                    : ((_f = selfLaunch === null || selfLaunch === void 0 ? void 0 : selfLaunch.defaultCanvasHost) !== null && _f !== void 0 ? _f : 'canvas.instructure.com'));
                return [4 /*yield*/, initAppIdStore(APP_ID_LIFESPAN_SEC_1.default)];
            case 1:
                appIdStore_1 = _g.sent();
                api_1 = (0, caccl_api_1.default)();
                /**
                 * Handle a self-launch request
                 * @author Gabe Abrams
                 * @param {number} courseId the Canvas id of the course to launch from
                 * @param {string} [canvasHost=selfLaunch.defaultCanvasHost] host of the
                 *   Canvas instance containing the course to launch from
                 * @param {number} [appId=look up appId] id for this app as it is installed in
                 *   Canvas in the course
                 * @param {string} [selfLaunchState] stringified self launch data
                 */
                app.get(CACCL_PATHS_1.default.SELF_LAUNCH, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                    var courseId, canvasHost, appId, value, storedAppId, accessTokens, i, apps, err_1, app_1, url;
                    var _a;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                courseId = Number.parseInt(String(req.query.courseId));
                                if (!courseId || Number.isNaN(courseId)) {
                                    return [2 /*return*/, res.status(422).send('To self-launch this app, CACCL needs a courseId. Please contact support.')];
                                }
                                canvasHost = (req.query.canvasHost
                                    ? decodeURIComponent(String(req.query.canvasHost))
                                    : undefined);
                                if (!canvasHost && defaultCanvasHost_1) {
                                    canvasHost = defaultCanvasHost_1;
                                }
                                if (!canvasHost || canvasHost.trim().length === 0) {
                                    return [2 /*return*/, res.status(422).send('To self-launch this app, CACCL needs a canvasHost. Please contact support.')];
                                }
                                // > Get from query
                                if (!appId
                                    && req.query.appId
                                    && !Number.isNaN(Number.parseInt(String(req.query.appId)))) {
                                    appId = Number.parseInt(String(req.query.appId));
                                }
                                // > Get from course map
                                if (!appId
                                    && courseAppIdMap_1
                                    && courseAppIdMap_1[canvasHost]
                                    && courseAppIdMap_1[canvasHost][courseId]) {
                                    appId = courseAppIdMap_1[canvasHost][courseId];
                                }
                                // > Get from host map
                                if (!appId
                                    && hostAppIdMap_1
                                    && hostAppIdMap_1[canvasHost]) {
                                    appId = hostAppIdMap_1[canvasHost];
                                }
                                if (!!appId) return [3 /*break*/, 2];
                                return [4 /*yield*/, appIdStore_1.get("".concat(canvasHost, "/").concat(courseId))];
                            case 1:
                                value = _b.sent();
                                if (value) {
                                    storedAppId = Number.parseInt(String(value.appId));
                                    if (!Number.isNaN(storedAppId)) {
                                        appId = storedAppId;
                                    }
                                }
                                _b.label = 2;
                            case 2:
                                if (!(!appId && adminAccessTokenMap_1)) return [3 /*break*/, 9];
                                accessTokens = ((_a = adminAccessTokenMap_1[canvasHost]) !== null && _a !== void 0 ? _a : []);
                                i = 0;
                                _b.label = 3;
                            case 3:
                                if (!(i < accessTokens.length)) return [3 /*break*/, 9];
                                apps = void 0;
                                _b.label = 4;
                            case 4:
                                _b.trys.push([4, 6, , 7]);
                                return [4 /*yield*/, api_1.course.app.list({
                                        courseId: courseId,
                                    }, {
                                        canvasHost: canvasHost,
                                        accessToken: accessTokens[i],
                                    })];
                            case 5:
                                apps = _b.sent();
                                return [3 /*break*/, 7];
                            case 6:
                                err_1 = _b.sent();
                                // This token failed. Simply continue
                                return [3 /*break*/, 8];
                            case 7:
                                app_1 = apps.find(function (candidateApp) {
                                    return candidateApp.url.startsWith("".concat(req.protocol, "://").concat(req.hostname).concat(CACCL_PATHS_1.default.LAUNCH));
                                });
                                if (app_1) {
                                    appId = app_1.id;
                                    return [3 /*break*/, 9];
                                }
                                _b.label = 8;
                            case 8:
                                i++;
                                return [3 /*break*/, 3];
                            case 9:
                                // Error if no app found
                                if (!appId) {
                                    return [2 /*return*/, res.status(404).send('This app cannot be launched this way because it is not yet installed into the course that you are launching from. Please contact support.')];
                                }
                                url = "https://".concat(canvasHost, "/courses/").concat(courseId, "/external_tools/").concat(appId, "?display=borderless");
                                return [2 /*return*/, res.redirect(url)];
                        }
                    });
                }); });
                return [3 /*break*/, 3];
            case 2:
                // Self launches are disabled
                app.get(CACCL_PATHS_1.default.SELF_LAUNCH, function (req, res) {
                    return res.status(404).send('Self launches are not enabled for this app.');
                });
                _g.label = 3;
            case 3:
                /*----------------------------------------*/
                /*              LTI Launches              */
                /*----------------------------------------*/
                // Throw error if credentials aren't included
                if (!installationCredentials
                    || Object.values(installationCredentials).length === 0) {
                    // Required credentials weren't included
                    throw new Error('CACCL LTI can\'t be initialized without installationCredentials!');
                }
                // Throw error if no express app is included
                if (!app) {
                    throw new Error('CACCL LTI can\'t be initialized without an express app.');
                }
                return [4 /*yield*/, initNonceStore(NONCE_LIFESPAN_SEC_1.default)];
            case 4:
                store = _g.sent();
                startTimestamp = Date.now();
                // Handle POST launch requests
                app.post(CACCL_PATHS_1.default.LAUNCH, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                    var consumerKey, consumerSecret, err_2;
                    var _a;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                _b.trys.push([0, 3, , 4]);
                                consumerKey = (_a = req.body) === null || _a === void 0 ? void 0 : _a.oauth_consumer_key;
                                consumerSecret = installationCredentials[consumerKey];
                                if (!consumerSecret) {
                                    return [2 /*return*/, res.status(403).send('This app is not yet set up to use your credentials. Please contact support.')];
                                }
                                // Validate
                                return [4 /*yield*/, (0, validateLaunch_1.default)({
                                        req: req,
                                        consumerSecret: consumerSecret,
                                        store: store,
                                        startTimestamp: startTimestamp,
                                    })];
                            case 1:
                                // Validate
                                _b.sent();
                                // Request is valid! Parse the launch
                                return [4 /*yield*/, (0, parseLaunch_1.default)(req)];
                            case 2:
                                // Request is valid! Parse the launch
                                _b.sent();
                                // Session saved! Now redirect to continue
                                if (!dontAuthorizeAfterLaunch) {
                                    // We are allowed to authorize on launch, so redirect to the authorize
                                    // path and include redirectToAfterLaunch as the 'next' url
                                    return [2 /*return*/, res.redirect(CACCL_PATHS_1.default.AUTHORIZE)];
                                }
                                // Not authorizing on launch. Immediately show the app
                                return [2 /*return*/, res.redirect('/')];
                            case 3:
                                err_2 = _b.sent();
                                // Invalid launch request or an error occurred while validating/parsing
                                // launch request
                                console.log(err_2);
                                return [2 /*return*/, (res
                                        .status(403)
                                        .send('We couldn\'t validate your authorization to use this app. Please try launch the app again. If you continue to have problems, please contact an admin.'))];
                            case 4: return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/];
        }
    });
}); };
/*------------------------------------------------------------------------*/
/*                             Session Parser                             */
/*------------------------------------------------------------------------*/
/**
 * Extract launch info from user's session
 * @author Gabe Abrams
 * @param req express request object
 * @returns info on user's current LTI launch status
 */
var getLaunchInfo = function (req) {
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
exports.getLaunchInfo = getLaunchInfo;
/*------------------------------------------------------------------------*/
/*                          Self-launch Function                          */
/*------------------------------------------------------------------------*/
/**
 * Get the URL for a self-launch request
 * @author Gabe Abrams
 * @param {number} courseId the Canvas id of the course to launch from
 * @param {string} [canvasHost=defaultCanvasHost] host of the
 *   Canvas instance containing the course to launch from
 * @param {number} [appId=look up appId] id for this app as it is installed in
 *   Canvas in the course
 *   be sensitive data.
 * @returns {string} url to redirect to for starting the self-launch process
 */
var getSelfLaunchURL = function (opts) {
    var courseId = opts.courseId, canvasHost = opts.canvasHost, appId = opts.appId;
    // Build the URL
    var url = "".concat(CACCL_PATHS_1.default.SELF_LAUNCH, "?courseId=").concat(courseId);
    if (canvasHost) {
        url += "&canvasHost=".concat(encodeURIComponent(canvasHost));
    }
    if (appId) {
        url += "&appId=".concat(appId);
    }
    return url;
};
exports.getSelfLaunchURL = getSelfLaunchURL;
/*------------------------------------------------------------------------*/
/*                                 Export                                 */
/*------------------------------------------------------------------------*/
exports.default = initLTI;
//# sourceMappingURL=index.js.map