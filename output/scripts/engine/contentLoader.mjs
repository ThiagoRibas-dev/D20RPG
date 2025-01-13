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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
var ContentCategory = /** @class */ (function () {
    function ContentCategory() {
    }
    return ContentCategory;
}());
export { ContentCategory };
var ContentItem = /** @class */ (function () {
    function ContentItem() {
    }
    return ContentItem;
}());
export { ContentItem };
var ContentLoader = /** @class */ (function () {
    function ContentLoader() {
        this.contentData = {};
        this.campaignData = {};
    }
    ContentLoader.prototype.getContent = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (Object.keys(this.contentData).length > 0) {
                            return [2 /*return*/, this.contentData];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        _a = this;
                        return [4 /*yield*/, this.loadDirectory('./content')];
                    case 2:
                        _a.contentData = _b.sent();
                        console.log("content loaded successfully from javascript calls:", this.contentData);
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _b.sent();
                        console.error("Could not fetch data: ", e_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/, this.contentData];
                }
            });
        });
    };
    ContentLoader.prototype.getCampaigns = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, e_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (Object.keys(this.campaignData).length > 0) {
                            return [2 /*return*/, this.campaignData];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        _a = this;
                        return [4 /*yield*/, this.loadDirectory('./campaigns')];
                    case 2:
                        _a.campaignData = _b.sent();
                        console.log("campaigns loaded successfully from javascript calls:", this.campaignData);
                        return [3 /*break*/, 4];
                    case 3:
                        e_2 = _b.sent();
                        console.error("Could not fetch data: ", e_2);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/, this.campaignData];
                }
            });
        });
    };
    ContentLoader.prototype.loadDirectory = function (dirPath) {
        return __awaiter(this, void 0, void 0, function () {
            var directory, response, responseData, _i, responseData_1, file, fullPath, _a, _b, itemName, error_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        directory = {};
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 9, , 10]);
                        return [4 /*yield*/, fetch(dirPath)];
                    case 2:
                        response = _c.sent();
                        if (!response.ok) {
                            throw new Error("HTTP error: ".concat(response.status));
                        }
                        return [4 /*yield*/, response.json()];
                    case 3:
                        responseData = _c.sent();
                        _i = 0, responseData_1 = responseData;
                        _c.label = 4;
                    case 4:
                        if (!(_i < responseData_1.length)) return [3 /*break*/, 8];
                        file = responseData_1[_i];
                        fullPath = "".concat(dirPath, "/").concat(file.name);
                        if (!(file.type === 'directory')) return [3 /*break*/, 6];
                        _a = directory;
                        _b = file.name;
                        return [4 /*yield*/, this.loadDirectory(fullPath)];
                    case 5:
                        _a[_b] = _c.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        if (file.name.endsWith('.json')) {
                            itemName = file.name.slice(0, -5);
                            directory[itemName] = this.createContentItem(fullPath);
                        }
                        _c.label = 7;
                    case 7:
                        _i++;
                        return [3 /*break*/, 4];
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        error_1 = _c.sent();
                        console.error("Error reading directory: ".concat(dirPath), error_1);
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/, directory];
                }
            });
        });
    };
    ContentLoader.prototype.createContentItem = function (filePath) {
        var _this = this;
        // Using a closure to encapsulate data and isLoaded, also changed it to 'let' instead of 'var'.
        var getLazyLoadFn = function () {
            var data = null;
            var isLoaded = false;
            return function () { return __awaiter(_this, void 0, void 0, function () {
                var response, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!!isLoaded) return [3 /*break*/, 5];
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 4, , 5]);
                            console.log("Fetching ".concat(filePath));
                            return [4 /*yield*/, fetch(filePath)];
                        case 2:
                            response = _a.sent();
                            if (!response.ok) {
                                throw new Error("HTTP error: ".concat(response.status));
                            }
                            return [4 /*yield*/, response.json()];
                        case 3:
                            data = _a.sent();
                            isLoaded = true;
                            return [3 /*break*/, 5];
                        case 4:
                            error_2 = _a.sent();
                            console.error("Error loading or parsing file: ".concat(filePath), error_2);
                            return [2 /*return*/, null];
                        case 5: return [2 /*return*/, data];
                    }
                });
            }); };
        };
        return {
            get: getLazyLoadFn()
        };
    };
    return ContentLoader;
}());
export { ContentLoader };
export function getIValue(item) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!item.get) return [3 /*break*/, 2];
                    return [4 /*yield*/, item.get()];
                case 1: return [2 /*return*/, _a.sent()];
                case 2: return [2 /*return*/, null];
            }
        });
    });
}
//# sourceMappingURL=contentLoader.mjs.map