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
// Import libs
var locks_1 = __importDefault(require("locks"));
var fast_clone_1 = __importDefault(require("fast-clone"));
var node_schedule_1 = __importDefault(require("node-schedule"));
/*------------------------------------------------------------------------*/
/*                                Constants                               */
/*------------------------------------------------------------------------*/
// The max age of an acceptable nonce
var EXPIRY_SEC = 55; // Needs to be at least 10s and no more than 55s
var EXPIRY_MS = EXPIRY_SEC * 1000;
var MemoryNonceStore = /** @class */ (function () {
    /**
     * Create a new MemoryNonceStore
     * @author Gabe Abrams
     */
    function MemoryNonceStore() {
        var _this = this;
        // Record start time (nothing older than start will be allowed)
        this.startTime = Date.now();
        // Sets of used nonces
        // - Newly used nonces are added to isUsedPrime
        // - Each "rotation", nonces are moved from isUsedPrime => isUsedSecondary
        //     and nonces in isUsedSecondary are deleted
        // - Rotations occur on the minute
        // - Because rotations occur every minute, the shortest a nonce will be
        //     stored is one minute. Thus, the expiry time must be less than 60s,
        //     55s to be safe
        this.isUsedMutex = locks_1.default.createMutex();
        this.isUsedPrime = new Set();
        this.isUsedSecondary = new Set();
        // Schedule rotation for every minute
        node_schedule_1.default.scheduleJob('* * * * *', function () {
            _this._rotate();
        });
    }
    /**
     * Checks if a new nonce is valid, mark it as used
     * @author Gabe Abrams
     * @param nonce OAuth nonce
     * @param timestamp OAuth timestamp
     * @returns Promise that resolves if nonce is valid, rejects with error if
     *   nonce is invalid.
     */
    MemoryNonceStore.prototype.check = function (nonce, timestampSecs) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        // Check if nonce
                        if (!nonce || nonce.trim().length === 0) {
                            return reject(new Error('No nonce included.'));
                        }
                        // Check timestamp
                        // > Check if exists
                        if (!timestampSecs || (timestampSecs + '').trim().length === 0) {
                            return reject(new Error('No timestamp.'));
                        }
                        // > Check if is a number
                        if (!Number.isNaN(Number.parseInt(String(timestampSecs)))) {
                            return reject(new Error('Timestamp is not a number.'));
                        }
                        // Convert oauth timestamp to ms (we now know it's a number)
                        var timestamp = timestampSecs * 1000;
                        // > Check if from before start
                        if (timestamp < _this.startTime) {
                            return reject(new Error('Nonce too old.'));
                        }
                        // > Check if expired
                        var msDiff = Math.abs(Date.now() - timestamp);
                        if (msDiff > EXPIRY_MS) {
                            // Expired!
                            return reject(new Error('Nonce expired.'));
                        }
                        // Manage nonce
                        _this.isUsedMutex.lock(function () {
                            try {
                                // Check if used
                                if (_this.isUsedPrime.has(nonce) || _this.isUsedSecondary.has(nonce)) {
                                    // Already used
                                    _this.isUsedMutex.unlock();
                                    return reject(new Error('Nonce already used.'));
                                }
                                // Mark as used
                                _this.isUsedPrime.add(nonce);
                                _this.isUsedMutex.unlock();
                                return resolve(undefined);
                            }
                            catch (err) {
                                // An error occurred!
                                _this.isUsedMutex.unlock();
                                return reject(err);
                            }
                        });
                    })];
            });
        });
    };
    /**
     * Performs a maintenance rotation: nonces are moved from
     *   isUsedPrime => isUsedSecondary and nonces in isUsedSecondary are deleted
     * @author Gabe Abrams
     */
    MemoryNonceStore.prototype._rotate = function () {
        var _this = this;
        this.isUsedMutex.lock(function () {
            _this.isUsedSecondary = (0, fast_clone_1.default)(_this.isUsedPrime);
            _this.isUsedPrime = new Set();
            _this.isUsedMutex.unlock();
        });
    };
    return MemoryNonceStore;
}());
exports.default = MemoryNonceStore;
//# sourceMappingURL=MemoryNonceStore.js.map