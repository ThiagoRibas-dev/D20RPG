"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServer = getServer;
var fs_1 = require("fs");
var http = __importStar(require("http"));
var path_1 = require("path");
var PORT = 3000;
var basePath = process.env.OUT_PATH === 'output' ? './output' : '.'; // Adjust paths accordingly
// Implement and configure basic http server using our index.ts with all data already available at the top
function getServer() {
    var _this = this;
    return http.createServer(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var requestUrl, filePath_1, fileData_1, filePath, fileExtension, isDir, files, responseData, fileData, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    requestUrl = req.url === '/' ? '/index.html' : req.url;
                    if (!requestUrl) {
                        console.error('Url is null');
                        return [2 /*return*/];
                    }
                    if (!!requestUrl.startsWith('/')) return [3 /*break*/, 2];
                    filePath_1 = (0, path_1.join)(basePath, 'index.html');
                    return [4 /*yield*/, fs_1.promises.readFile(filePath_1)];
                case 1:
                    fileData_1 = _a.sent();
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(fileData_1);
                    _a.label = 2;
                case 2:
                    filePath = (0, path_1.join)(basePath, requestUrl);
                    fileExtension = (0, path_1.extname)(filePath);
                    isDir = (0, fs_1.existsSync)(filePath) && fs_1.promises.lstat(filePath).then(function (res) { return res.isDirectory(); }).catch(function () { return false; });
                    return [4 /*yield*/, isDir];
                case 3:
                    if (!_a.sent()) return [3 /*break*/, 5];
                    return [4 /*yield*/, (0, fs_1.readdirSync)(filePath, { withFileTypes: true })];
                case 4:
                    files = _a.sent();
                    responseData = files.map(function (file) {
                        return {
                            name: file.name,
                            type: file.isDirectory() ? 'directory' : 'file'
                        };
                    });
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(responseData));
                    return [2 /*return*/];
                case 5: return [4 /*yield*/, fs_1.promises.readFile(filePath)];
                case 6:
                    fileData = _a.sent();
                    res.writeHead(200, { 'Content-Type': getMIMEType(fileExtension) });
                    res.end(fileData);
                    return [2 /*return*/];
                case 7:
                    e_1 = _a.sent();
                    console.error(e_1);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal Server Error');
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    }); });
}
function getMIMEType(fileExtension) {
    switch (fileExtension) {
        case '.css':
            return 'text/css';
        case '.js':
            return 'text/javascript';
        case '.mjs':
            return 'text/javascript';
        case '.html':
            return 'text/html';
        case '.ico':
            return 'image/x-icon';
        default:
            return 'application/octet-stream';
    }
}
getServer().listen(PORT, function () {
    console.log("Server listening on port ".concat(PORT, ". ").concat(process.env.OUT_PATH, " : ").concat(basePath));
});
//# sourceMappingURL=server.js.map